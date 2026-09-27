#!/usr/bin/env node
/**
 * Curio.OS — Developer CLI: add-track
 * ====================================
 * Adds a new music track to the Curio music player WITHOUT touching the
 * Express server or the React codebase directly.
 *
 * Features:
 *   - Auto-detects audio files in curio-server/incoming/
 *   - Reads ID3 tags (Title, Artist, Album, embedded APIC Album Art)
 *   - Auto-detects audio duration via ffprobe if available
 *   - Supports both interactive prompts and non-interactive CLI flags
 *   - Copies audio + album art to both Curio_OS/public/tracks/ and curio-server/public/tracks/
 *   - Appends entry to Curio_OS/src/data/tracks.json
 *
 * Usage:
 *   npm run add-track
 *   npm run add-track -- ./incoming/song.mp3
 *   npm run add-track -- --title "Track" --artist "Artist" --yes
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// ── Path constants ────────────────────────────────────────────────────────────
const SCRIPT_DIR = __dirname;                          // curio-server/scripts/
const SERVER_ROOT = path.resolve(SCRIPT_DIR, '..');     // curio-server/
const REPO_ROOT = path.resolve(SERVER_ROOT, '..');    // My OS/
const CLIENT_ROOT = path.join(REPO_ROOT, 'Curio_OS');  // Curio_OS/

const TRACKS_JSON = path.join(CLIENT_ROOT, 'src', 'data', 'tracks.json');
const CLIENT_TRACKS_DIR = path.join(CLIENT_ROOT, 'public', 'tracks');
const SERVER_TRACKS_DIR = path.join(SERVER_ROOT, 'public', 'tracks');
const INCOMING_DIR = path.join(SERVER_ROOT, 'incoming');

const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.mpeg', '.aac']);

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')      // strip special chars
    .replace(/[\s_]+/g, '-')       // spaces/underscores → hyphens
    .replace(/-+/g, '-')           // collapse consecutive hyphens
    .replace(/^-|-$/g, '');        // trim leading/trailing hyphens
}

function randomSuffix() {
  return Math.random().toString(16).slice(2, 6);
}

function getAudioDuration(filePath) {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      { stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000 }
    ).toString().trim();
    const secs = parseFloat(out);
    if (!isNaN(secs)) {
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    }
  } catch {
    /* ffprobe not available — skip */
  }
  return null;
}

/** Extract basic ID3v2 metadata (Title, Artist, Album, Cover Art) without external deps */
function parseId3Tags(filePath) {
  const result = { title: null, artist: null, album: null, coverArtBuffer: null, coverArtExt: '.png' };
  try {
    const buf = fs.readFileSync(filePath);
    if (buf.length < 10 || buf.slice(0, 3).toString() !== 'ID3') return result;

    const latin1 = buf.toString('latin1');

    // Title (TIT2)
    const tit2Idx = latin1.indexOf('TIT2');
    if (tit2Idx !== -1) {
      const size = buf.readUInt32BE(tit2Idx + 4);
      if (size > 1 && size < 200) {
        const raw = latin1.slice(tit2Idx + 10, tit2Idx + 10 + size).replace(/^[^\w\s\u00C0-\u024F\u0900-\u097F]+/, '').trim();
        if (raw) result.title = raw.replace(/\0/g, '').trim();
      }
    }

    // Artist (TPE1)
    const tpe1Idx = latin1.indexOf('TPE1');
    if (tpe1Idx !== -1) {
      const size = buf.readUInt32BE(tpe1Idx + 4);
      if (size > 1 && size < 200) {
        const raw = latin1.slice(tpe1Idx + 10, tpe1Idx + 10 + size).replace(/^[^\w\s\u00C0-\u024F\u0900-\u097F]+/, '').trim();
        if (raw) result.artist = raw.replace(/\0/g, '').trim();
      }
    }

    // Album (TALB)
    const talbIdx = latin1.indexOf('TALB');
    if (talbIdx !== -1) {
      const size = buf.readUInt32BE(talbIdx + 4);
      if (size > 1 && size < 200) {
        const raw = latin1.slice(talbIdx + 10, talbIdx + 10 + size).replace(/^[^\w\s\u00C0-\u024F\u0900-\u097F]+/, '').trim();
        if (raw) result.album = raw.replace(/\0/g, '').trim();
      }
    }

    // APIC (Attached Picture)
    const apicIdx = buf.indexOf(Buffer.from('APIC'));
    if (apicIdx !== -1) {
      const apicSize = buf.readUInt32BE(apicIdx + 4);
      const searchEnd = Math.min(buf.length, apicIdx + 50 + apicSize);
      const pngIdx = buf.indexOf(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), apicIdx);
      const jpgIdx = buf.indexOf(Buffer.from([0xFF, 0xD8, 0xFF]), apicIdx);

      let imgStart = -1;
      let imgExt = '.png';
      if (pngIdx !== -1 && pngIdx < searchEnd) {
        imgStart = pngIdx;
        imgExt = '.png';
      } else if (jpgIdx !== -1 && jpgIdx < searchEnd) {
        imgStart = jpgIdx;
        imgExt = '.jpg';
      }

      if (imgStart !== -1) {
        const imgEnd = Math.min(buf.length, apicIdx + 10 + apicSize);
        result.coverArtBuffer = buf.slice(imgStart, imgEnd);
        result.coverArtExt = imgExt;
      }
    }
  } catch (err) {
    // Ignore ID3 parsing errors gracefully
  }
  return result;
}

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  dim: '\x1b[2m',
  pink: '\x1b[35m',
};

const log = {
  info: (msg) => console.log(`${c.cyan}ℹ${c.reset}  ${msg}`),
  ok: (msg) => console.log(`${c.green}✔${c.reset}  ${msg}`),
  warn: (msg) => console.log(`${c.yellow}⚠${c.reset}  ${msg}`),
  error: (msg) => console.error(`${c.red}✘${c.reset}  ${msg}`),
  title: (msg) => console.log(`\n${c.bold}${c.pink}${msg}${c.reset}\n`),
  dim: (msg) => console.log(`${c.dim}${msg}${c.reset}`),
};

function ask(rl, question, defaultValue) {
  const hint = defaultValue != null ? ` ${c.dim}[${defaultValue}]${c.reset}` : '';
  return new Promise((resolve) => {
    rl.question(`${c.cyan}?${c.reset}  ${question}${hint}: `, (answer) => {
      const trimmed = (answer || '').trim();
      resolve(trimmed !== '' ? trimmed : (defaultValue ?? ''));
    });
  });
}

// Simple flag parser
function parseArgs() {
  const args = process.argv.slice(2);
  const flags = {};
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (key === 'yes' || key === 'auto') {
        flags[key] = true;
      } else if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        flags[key] = args[i + 1];
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      positional.push(arg);
    }
  }
  return { flags, positional };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  log.title('🎵  Curio.OS — add-track  (dev tool)');

  const { flags, positional } = parseArgs();
  const isAuto = flags.yes || flags.auto;

  // 1. Resolve source file
  let srcFile = flags.file || positional[0];

  if (!srcFile) {
    fs.mkdirSync(INCOMING_DIR, { recursive: true });
    const candidates = fs.readdirSync(INCOMING_DIR).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return AUDIO_EXTS.has(ext) && f !== '.gitignore';
    });

    if (candidates.length === 0) {
      log.error(`No audio file provided and incoming/ is empty.`);
      log.dim(`  Drop a .mp3 / .wav / .ogg file into curio-server/incoming/`);
      log.dim(`  or run: npm run add-track -- ./path/to/song.mp3`);
      process.exit(1);
    }

    if (candidates.length === 1 || isAuto) {
      srcFile = path.join(INCOMING_DIR, candidates[0]);
      log.info(`Found in incoming/: ${c.bold}${candidates[0]}${c.reset}`);
    } else {
      console.log(`\n  Multiple files found in incoming/:`);
      candidates.forEach((f, i) => console.log(`    ${c.cyan}${i + 1}${c.reset}. ${f}`));
      const rl0 = readline.createInterface({ input: process.stdin, output: process.stdout });
      const pick = await ask(rl0, 'Which file? (enter number)', '1');
      rl0.close();
      const idx = parseInt(pick, 10) - 1;
      if (idx < 0 || idx >= candidates.length) {
        log.error('Invalid selection.');
        process.exit(1);
      }
      srcFile = path.join(INCOMING_DIR, candidates[idx]);
    }
  }

  // 2. Validate file
  const srcAbs = path.resolve(srcFile);
  let srcExt = path.extname(srcAbs).toLowerCase();

  if (!fs.existsSync(srcAbs)) {
    log.error(`File not found: ${srcAbs}`);
    process.exit(1);
  }

  if (!AUDIO_EXTS.has(srcExt)) {
    log.error(`Unsupported file type: ${srcExt}`);
    log.dim(`  Supported: ${[...AUDIO_EXTS].join(' / ')}`);
    process.exit(1);
  }

  log.ok(`Audio file validated: ${path.basename(srcAbs)} (${srcExt})`);

  // 3. Inspect ID3 Tags & Duration
  const id3 = parseId3Tags(srcAbs);
  if (id3.title) log.info(`ID3 Title detected: ${id3.title}`);
  if (id3.artist) log.info(`ID3 Artist detected: ${id3.artist}`);
  if (id3.coverArtBuffer) log.info(`Embedded Cover Art detected (${(id3.coverArtBuffer.length / 1024).toFixed(1)} KB)`);

  const detectedDuration = getAudioDuration(srcAbs);
  if (detectedDuration) log.info(`Detected duration: ${detectedDuration}`);

  // 4. Load existing tracks.json
  if (!fs.existsSync(TRACKS_JSON)) {
    log.error(`tracks.json not found at:\n   ${TRACKS_JSON}`);
    process.exit(1);
  }

  let tracks;
  try {
    tracks = JSON.parse(fs.readFileSync(TRACKS_JSON, 'utf8'));
  } catch (e) {
    log.error(`Failed to parse tracks.json: ${e.message}`);
    process.exit(1);
  }

  // 5. Determine metadata
  const srcBaseName = path.basename(srcAbs, srcExt);
  const guessedTitle = id3.title || srcBaseName.replace(/[-_]+/g, ' ').replace(/\b\w/g, (w) => w.toUpperCase());
  const guessedArtist = id3.artist || 'Curio Soundscapes';

  let title = flags.title || positional[1];
  let artist = flags.artist || positional[2];
  let tag = flags.tag;
  let mood = flags.mood;
  let bpmRaw = flags.bpm;
  let duration = flags.duration;
  let coverArt = flags.coverArt;

  if (!isAuto && (!title || !artist)) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log('');
    title = title || await ask(rl, 'Track title', guessedTitle);
    artist = artist || await ask(rl, 'Artist name', guessedArtist);
    tag = tag || await ask(rl, 'Tag / genre label (e.g. "Romantic Retro")', 'Retro Romance');
    mood = mood || await ask(rl, 'Mood / vibe (e.g. "Late Night Nostalgia")', 'Nostalgic');
    bpmRaw = bpmRaw || await ask(rl, 'BPM (number)', '85');
    duration = duration || await ask(rl, 'Duration (m:ss format)', detectedDuration ?? '3:30');
    coverArt = coverArt || await ask(rl, 'Cover art path (optional — press Enter to auto/skip)', '');
    rl.close();
  } else {
    title = title || guessedTitle;
    artist = artist || guessedArtist;
    tag = tag || 'Retro Romance';
    mood = mood || 'Nostalgic';
    bpmRaw = bpmRaw || '85';
    duration = duration || detectedDuration || '3:30';
  }

  const bpm = parseInt(bpmRaw, 10) || 85;

  // 6. Generate unique ID
  const slug = slugify(title) || 'track';
  const id = `${slug}-${randomSuffix()}`;

  // If source extension is .mpeg but contains mp3 audio, normalize to .mp3
  let finalExt = srcExt;
  if (finalExt === '.mpeg') finalExt = '.mp3';

  const destFileName = `${id}${finalExt}`;

  // 7. Ensure destination directories exist
  fs.mkdirSync(CLIENT_TRACKS_DIR, { recursive: true });
  fs.mkdirSync(SERVER_TRACKS_DIR, { recursive: true });

  // 8. Copy audio file to both tracks/ destinations
  const destClient = path.join(CLIENT_TRACKS_DIR, destFileName);
  const destServer = path.join(SERVER_TRACKS_DIR, destFileName);

  fs.copyFileSync(srcAbs, destClient);
  fs.copyFileSync(srcAbs, destServer);
  log.ok(`Audio copied to: Curio_OS/public/tracks/${destFileName}`);
  log.ok(`Audio copied to: curio-server/public/tracks/${destFileName}`);

  // 9. Handle Cover Art
  let finalCoverArt = null;
  if (coverArt && fs.existsSync(coverArt)) {
    const artExt = path.extname(coverArt).toLowerCase() || '.png';
    const coverFileName = `${id}-cover${artExt}`;
    fs.copyFileSync(coverArt, path.join(CLIENT_TRACKS_DIR, coverFileName));
    fs.copyFileSync(coverArt, path.join(SERVER_TRACKS_DIR, coverFileName));
    finalCoverArt = coverFileName;
    log.ok(`Cover art saved: ${coverFileName}`);
  } else if (id3.coverArtBuffer) {
    const coverFileName = `${id}-cover${id3.coverArtExt}`;
    fs.writeFileSync(path.join(CLIENT_TRACKS_DIR, coverFileName), id3.coverArtBuffer);
    fs.writeFileSync(path.join(SERVER_TRACKS_DIR, coverFileName), id3.coverArtBuffer);
    finalCoverArt = coverFileName;
    log.ok(`Embedded cover art extracted: ${coverFileName}`);
  }

  // 10. Build new entry matching the Track shape MusicApp expects
  const newEntry = {
    id,
    title,
    artist,
    duration: duration || '?',
    bpm,
    fileName: destFileName,
    tag,
    mood,
    ...(finalCoverArt ? { coverArt: finalCoverArt } : {}),
  };

  // 11. Append to tracks.json
  tracks.push(newEntry);
  fs.writeFileSync(TRACKS_JSON, JSON.stringify(tracks, null, 2) + '\n', 'utf8');
  log.ok(`Appended to: Curio_OS/src/data/tracks.json`);

  // 12. Cleanup incoming
  const srcIncoming = path.join(INCOMING_DIR, path.basename(srcAbs));
  if (fs.existsSync(srcIncoming)) {
    if (isAuto) {
      fs.unlinkSync(srcIncoming);
      log.info(`Cleaned up incoming/${path.basename(srcAbs)}`);
    } else {
      const rl2 = readline.createInterface({ input: process.stdin, output: process.stdout });
      const del = await ask(rl2, 'Remove original from incoming/? (y/n)', 'y');
      rl2.close();
      if (del.toLowerCase() === 'y') {
        fs.unlinkSync(srcIncoming);
        log.info(`Removed incoming/${path.basename(srcAbs)}`);
      }
    }
  }

  // 13. Summary
  console.log(`
${c.bold}${c.green}🎉 Track successfully added!${c.reset}

  ${c.cyan}ID${c.reset}       ${id}
  ${c.cyan}Title${c.reset}    ${title}
  ${c.cyan}Artist${c.reset}   ${artist}
  ${c.cyan}File${c.reset}     /tracks/${destFileName}
  ${c.cyan}Cover${c.reset}    ${finalCoverArt ? '/tracks/' + finalCoverArt : 'Default Turntable'}
  ${c.cyan}BPM${c.reset}      ${bpm}
  ${c.cyan}Duration${c.reset} ${duration || '?'}
  ${c.cyan}Tag${c.reset}      ${tag}
  ${c.cyan}Mood${c.reset}     ${mood}

${c.dim}Vite HMR has updated Curio.OS live! Open the Music app to play it.${c.reset}
`);
}

main().catch((err) => {
  console.error('\nUnexpected error:', err.message || err);
  process.exit(1);
});
