import fs from 'fs';
import path from 'path';

const SAMPLE_RATE = 44100;

function createWavHeader(numSamples: number): Buffer {
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = numSamples * blockAlign;
  const header = Buffer.alloc(44);

  // RIFF identifier
  header.write('RIFF', 0);
  // RIFF chunk size
  header.writeUInt32LE(36 + dataSize, 4);
  // WAVE identifier
  header.write('WAVE', 8);
  // fmt subchunk identifier
  header.write('fmt ', 12);
  // subchunk1 size (16 for PCM)
  header.writeUInt32LE(16, 16);
  // Audio format (1 = PCM)
  header.writeUInt16LE(1, 20);
  // Num channels
  header.writeUInt16LE(numChannels, 22);
  // Sample rate
  header.writeUInt32LE(SAMPLE_RATE, 24);
  // Byte rate
  header.writeUInt32LE(byteRate, 28);
  // Block align
  header.writeUInt16LE(blockAlign, 32);
  // Bits per sample
  header.writeUInt16LE(16, 34);
  // data subchunk identifier
  header.write('data', 36);
  // data subchunk size
  header.writeUInt32LE(dataSize, 40);

  return header;
}

// Track 1: Midnight Whimsy (Warm Rhodes-like lofi electric piano chords + gentle vinyl texture)
function generateTrack1(durationSec = 24): Buffer {
  const numSamples = Math.floor(SAMPLE_RATE * durationSec);
  const header = createWavHeader(numSamples);
  const data = Buffer.alloc(numSamples * 4);

  // Chord progression: Dm9 -> G13 -> Cmaj9 -> Am7
  const chords = [
    [146.83, 220.0, 261.63, 329.63, 392.0], // Dm9: D3, A3, C4, E4, G4
    [196.0, 246.94, 329.63, 392.0, 440.0],  // G13: G3, B3, E4, G4, A4
    [130.81, 196.0, 246.94, 261.63, 329.63],// Cmaj9: C3, G3, B3, C4, E4
    [110.0, 164.81, 220.0, 261.63, 329.63]  // Am7: A2, E3, A3, C4, E4
  ];
  const chordDuration = durationSec / 4;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const chordIndex = Math.min(3, Math.floor(t / chordDuration));
    const chord = chords[chordIndex];
    const localT = t % chordDuration;
    
    // Gentle envelope: soft attack, sustained warm body, slight decay
    const attack = Math.min(1, localT / 0.15);
    const decay = Math.max(0.2, Math.exp(-localT * 0.45));
    const env = attack * decay;

    let left = 0;
    let right = 0;

    // Electric piano harmonics
    chord.forEach((freq, idx) => {
      const vibrato = 1 + 0.003 * Math.sin(2 * Math.PI * 4.5 * t);
      const f = freq * vibrato;
      // Fundamental + gentle warm harmonics
      const s1 = Math.sin(2 * Math.PI * f * t);
      const s2 = 0.3 * Math.sin(2 * Math.PI * f * 2 * t);
      const s3 = 0.1 * Math.sin(2 * Math.PI * f * 3 * t);
      const tone = (s1 + s2 + s3) * env * 0.15;

      // Slight stereo pan per voice
      const pan = (idx / (chord.length - 1)) * 0.6 + 0.2; // 0.2 to 0.8
      left += tone * (1 - pan);
      right += tone * pan;
    });

    // Cozy lofi bass pulse on root
    const rootFreq = chord[0] / 2;
    const bass = 0.22 * Math.sin(2 * Math.PI * rootFreq * t) * Math.exp(-(localT % 1.5) * 1.8);
    left += bass * 0.5;
    right += bass * 0.5;

    // Subtle warm tape/vinyl hiss
    const vinyl = (Math.random() - 0.5) * 0.008;
    left += vinyl;
    right += vinyl;

    // Soft clip & clamp to 16-bit PCM
    const clampL = Math.max(-1, Math.min(1, left));
    const clampR = Math.max(-1, Math.min(1, right));
    data.writeInt16LE(Math.floor(clampL * 30000), i * 4);
    data.writeInt16LE(Math.floor(clampR * 30000), i * 4 + 2);
  }

  return Buffer.concat([header, data]);
}

// Track 2: Curio Reverie (Ambient synth pads + twinkling bell arpeggios)
function generateTrack2(durationSec = 24): Buffer {
  const numSamples = Math.floor(SAMPLE_RATE * durationSec);
  const header = createWavHeader(numSamples);
  const data = Buffer.alloc(numSamples * 4);

  // Key: F# Minor / A Major Dreamy Ambient
  const padFrequencies = [185.0, 220.0, 277.18, 369.99, 440.0]; // F#3, A3, C#4, F#4, A4
  const arpNotes = [369.99, 440.0, 554.37, 659.25, 739.99, 880.0]; // F#4, A4, C#5, E5, F#5, A5

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Slow atmospheric filter sweep on pads
    const sweep = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.1 * t);
    let left = 0;
    let right = 0;

    padFrequencies.forEach((freq, idx) => {
      const chorus1 = Math.sin(2 * Math.PI * (freq + 0.3) * t);
      const chorus2 = Math.sin(2 * Math.PI * (freq - 0.3) * t);
      const tone = (chorus1 + chorus2) * 0.08 * (0.6 + 0.4 * sweep);
      if (idx % 2 === 0) left += tone;
      else right += tone;
    });

    // Twinkling bell arpeggios (8th notes, ~120 ms step)
    const arpStep = Math.floor(t * 4) % arpNotes.length;
    const arpLocalT = (t * 4) % 1;
    const bellEnv = Math.exp(-arpLocalT * 6);
    const bellFreq = arpNotes[arpStep];
    const bell = Math.sin(2 * Math.PI * bellFreq * t) * bellEnv * 0.12;

    const arpPan = 0.5 + 0.35 * Math.sin(t * 1.5);
    left += bell * (1 - arpPan);
    right += bell * arpPan;

    const clampL = Math.max(-1, Math.min(1, left));
    const clampR = Math.max(-1, Math.min(1, right));
    data.writeInt16LE(Math.floor(clampL * 30000), i * 4);
    data.writeInt16LE(Math.floor(clampR * 30000), i * 4 + 2);
  }

  return Buffer.concat([header, data]);
}

// Track 3: Lavender Code (Melodic nostalgic lofi chillhop)
function generateTrack3(durationSec = 24): Buffer {
  const numSamples = Math.floor(SAMPLE_RATE * durationSec);
  const header = createWavHeader(numSamples);
  const data = Buffer.alloc(numSamples * 4);

  // Chords: Emaj7 -> G#m7 -> F#m7 -> B7
  const chords = [
    [164.81, 246.94, 311.13, 392.0], // E3, B3, D#4, G4
    [207.65, 246.94, 311.13, 415.3], // G#3, B3, D#4, G#4
    [185.0, 220.0, 277.18, 369.99],  // F#3, A3, C#4, F#4
    [123.47, 185.0, 246.94, 293.66]  // B2, F#3, B3, D4
  ];
  const chordDuration = durationSec / 4;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const chordIndex = Math.min(3, Math.floor(t / chordDuration));
    const chord = chords[chordIndex];
    const localT = t % chordDuration;
    const env = Math.min(1, localT / 0.1) * Math.max(0.3, Math.exp(-localT * 0.6));

    let left = 0;
    let right = 0;

    chord.forEach((freq, idx) => {
      const tone = Math.sin(2 * Math.PI * freq * t) * env * 0.16;
      if (idx % 2 === 0) left += tone * 0.7;
      else right += tone * 0.7;
    });

    // Soft kick / rim pulse every 0.7 seconds (chill lofi tempo ~85 bpm)
    const beatT = t % 0.7;
    const kick = Math.sin(2 * Math.PI * 65 * beatT) * Math.exp(-beatT * 18) * 0.25;
    left += kick;
    right += kick;

    const clampL = Math.max(-1, Math.min(1, left));
    const clampR = Math.max(-1, Math.min(1, right));
    data.writeInt16LE(Math.floor(clampL * 30000), i * 4);
    data.writeInt16LE(Math.floor(clampR * 30000), i * 4 + 2);
  }

  return Buffer.concat([header, data]);
}

// Track 4: Void Ambient Echoes (Deep cosmic drone & harmonic resonance)
function generateTrack4(durationSec = 24): Buffer {
  const numSamples = Math.floor(SAMPLE_RATE * durationSec);
  const header = createWavHeader(numSamples);
  const data = Buffer.alloc(numSamples * 4);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;

    // Deep sub drone at 55Hz (A1) and 110Hz (A2)
    const drone1 = Math.sin(2 * Math.PI * 55 * t) * 0.22;
    const drone2 = Math.sin(2 * Math.PI * 110 * t + Math.sin(0.5 * t)) * 0.15;
    
    // Shimmering overtone sweeps
    const shimmerFreq = 440 + 80 * Math.sin(2 * Math.PI * 0.12 * t);
    const shimmer = Math.sin(2 * Math.PI * shimmerFreq * t) * 0.08 * (0.5 + 0.5 * Math.sin(t * 0.8));

    const left = drone1 * 0.8 + drone2 * 0.6 + shimmer * 0.8;
    const right = drone1 * 0.6 + drone2 * 0.8 + shimmer * 0.4;

    const clampL = Math.max(-1, Math.min(1, left));
    const clampR = Math.max(-1, Math.min(1, right));
    data.writeInt16LE(Math.floor(clampL * 30000), i * 4);
    data.writeInt16LE(Math.floor(clampR * 30000), i * 4 + 2);
  }

  return Buffer.concat([header, data]);
}

async function main() {
  const outDir = path.join(__dirname, '../public/tracks');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('🎵 Generating royalty-free Curio audio tracks in', outDir);

  const t1 = generateTrack1(24);
  fs.writeFileSync(path.join(outDir, 'midnight-whimsy.wav'), t1);
  console.log('✅ Generated midnight-whimsy.wav (', t1.length, 'bytes)');

  const t2 = generateTrack2(24);
  fs.writeFileSync(path.join(outDir, 'curio-reverie.wav'), t2);
  console.log('✅ Generated curio-reverie.wav (', t2.length, 'bytes)');

  const t3 = generateTrack3(24);
  fs.writeFileSync(path.join(outDir, 'lavender-code.wav'), t3);
  console.log('✅ Generated lavender-code.wav (', t3.length, 'bytes)');

  const t4 = generateTrack4(24);
  fs.writeFileSync(path.join(outDir, 'void-ambient-echoes.wav'), t4);
  console.log('✅ Generated void-ambient-echoes.wav (', t4.length, 'bytes)');

  console.log('🎉 All audio tracks generated successfully!');
}

main().catch(console.error);
