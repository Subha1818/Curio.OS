import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWindowManager } from '../../context/WindowManagerContext';
import { useVoid } from '../../context/VoidContext';
import { sound } from '../../utils/sound';
import { subbuData } from '../../data/subbuData';
import { socialsData } from '../../data/socialsData';
import { educationData } from '../../data/educationData';
import { apiGetStats, type UserStats } from '../../api/authApi';
import type { AppId, WallpaperId } from '../../types/os';

// ── Types ────────────────────────────────────────────────────────────────────

interface HistoryLine {
  id: string;
  prompt: string;
  input?: string;
  output?: React.ReactNode;
  isMasked?: boolean;
}

type AuthFlowStep =
  | 'idle'
  | 'awaitEmail'
  | 'awaitPassword'
  | 'awaitUsername'
  | 'submitting'
  | 'done';

type AuthFlowMode = 'login' | 'register';

// ── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const Prompt: React.FC<{ username?: string; isMatrix?: boolean }> = ({ username, isMatrix }) => (
  <span>
    <span className={isMatrix ? 'text-emerald-400 font-semibold' : 'text-pink-400 font-semibold'}>
      cutie@{username ?? 'guest'}
    </span>
    <span className={isMatrix ? 'text-emerald-500' : 'text-indigo-400'}>:~</span>
    <span className={isMatrix ? 'text-emerald-600' : 'text-slate-500'}>$</span>
  </span>
);

// Matrix Rain background canvas component
const MatrixRainCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 600;
      canvas.height = canvas.parentElement?.clientHeight || 400;
    };
    resizeCanvas();

    const chars = '01CURIOVOID0101987654321ABCDEFΣΩΨλπ#*+-~';
    const fontSize = 12;
    const columns = Math.floor(canvas.width / fontSize);
    const drops = Array(columns).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#10b981';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = chars.charAt(Math.floor(Math.random() * chars.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    window.addEventListener('resize', resizeCanvas);
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-25 z-0"
    />
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const TerminalApp: React.FC<{ windowId: string }> = () => {
  const { user, login, register, logout, isLoggedIn, updateUserSettings } = useAuth();
  const { openApp, closeWindow, windows } = useWindowManager();
  const { isVoidAwoken } = useVoid();

  const currentUsername = user?.username;

  // ── History state ─────────────────────────────────────────────────────────
  // Keep only the 2 welcome lines, no pink broken CURIO text, no tip line
  const [history, setHistory] = useState<HistoryLine[]>([
    {
      id: uid(),
      prompt: '',
      output: (
        <div className="text-xs space-y-1 font-mono mb-2">
          <p className="text-slate-300">
            Welcome to <span className="text-pink-300 font-semibold">Curio.OS Terminal</span> — The Heart of the Machine.
          </p>
          <p className="text-emerald-400">
            Type <span className="text-amber-300 font-semibold">help</span> for commands, or{' '}
            <span className="text-amber-300 font-semibold">login</span> to authenticate.
          </p>
        </div>
      ),
    },
  ]);

  // ── Input state ───────────────────────────────────────────────────────────
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  // ── Matrix Visual Effect state ────────────────────────────────────────────
  const [matrixActive, setMatrixActive] = useState(false);

  // ── Auth flow state ───────────────────────────────────────────────────────
  const [authStep, setAuthStep] = useState<AuthFlowStep>('idle');
  const [authMode, setAuthMode] = useState<AuthFlowMode>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [inputMasked, setInputMasked] = useState(false);

  // ── Running command state ─────────────────────────────────────────────────
  const [isExecutingAsync, setIsExecutingAsync] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  // ── Auto-run hook: triggered by LoginPopup "Login" button ─────────────────
  useEffect(() => {
    const autorun = sessionStorage.getItem('curio_terminal_autorun');
    if (autorun === 'login') {
      sessionStorage.removeItem('curio_terminal_autorun');
      setTimeout(() => startAuthFlow('login'), 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const pushLine = useCallback((line: Omit<HistoryLine, 'id'>) => {
    setHistory((prev) => [...prev, { ...line, id: uid() }]);
  }, []);

  const pushOutput = useCallback((output: React.ReactNode) => {
    setHistory((prev) => [...prev, { id: uid(), prompt: '', output }]);
  }, []);

  const typewriterLine = useCallback(
    (text: string, delayMs = 25): Promise<void> =>
      new Promise((resolve) => {
        const lineId = uid();
        setHistory((prev) => [...prev, { id: lineId, prompt: '', output: '' }]);

        let i = 0;
        const tick = () => {
          i++;
          const slice = text.slice(0, i);
          setHistory((prev) =>
            prev.map((l) => (l.id === lineId ? { ...l, output: slice } : l))
          );
          if (i < text.length) {
            setTimeout(tick, delayMs);
          } else {
            resolve();
          }
        };
        setTimeout(tick, delayMs);
      }),
    []
  );

  // ── Auth flow orchestrator ─────────────────────────────────────────────────

  const startAuthFlow = useCallback(
    async (mode: AuthFlowMode) => {
      if (authStep !== 'idle') return;

      setAuthMode(mode);
      setAuthEmail('');
      setAuthPassword('');

      pushLine({ prompt: 'guest', input: mode });
      await new Promise((r) => setTimeout(r, 300));

      await typewriterLine('Initializing secure auth channel...', 20);
      await new Promise((r) => setTimeout(r, 200));

      setAuthStep('awaitEmail');
      setInputMasked(false);
      pushOutput(
        <span className="text-amber-300 font-mono text-xs">Enter email:</span>
      );
    },
    [authStep, pushLine, pushOutput, typewriterLine]
  );

  // ── Submit logic for Auth ──────────────────────────────────────────────────

  const handleAuthStepInput = useCallback(
    async (value: string) => {
      sound.playClick();

      if (authStep === 'awaitEmail') {
        setAuthEmail(value);
        pushLine({ prompt: 'guest', input: value, isMasked: false });

        setInputMasked(true);
        setAuthStep('awaitPassword');
        pushOutput(
          <span className="text-amber-300 font-mono text-xs">Enter password:</span>
        );
        return;
      }

      if (authStep === 'awaitPassword') {
        const password = value;
        setAuthPassword(password);
        pushLine({ prompt: 'guest', input: '●'.repeat(Math.min(value.length, 12)), isMasked: true });
        setInputMasked(false);

        if (authMode === 'register') {
          setAuthStep('awaitUsername');
          pushOutput(
            <span className="text-amber-300 font-mono text-xs">Enter username:</span>
          );
          return;
        }

        // Try login
        setAuthStep('submitting');
        pushOutput(
          <span className="text-slate-400 font-mono text-xs animate-pulse">Verifying credentials...</span>
        );

        const result = await login(authEmail, password);

        if (result.success && result.message) {
          pushOutput(
            <div className="text-xs font-mono space-y-0.5">
              <p className="text-emerald-400 font-semibold">✓ {result.message}</p>
              <p className="text-slate-400">Prompt updated. Welcome home. 🏠</p>
            </div>
          );
          setAuthStep('done');
          setInputMasked(false);
          setTimeout(() => setAuthStep('idle'), 500);
          return;
        }

        if (result.notFound) {
          pushOutput(
            <div className="text-xs font-mono space-y-0.5">
              <p className="text-amber-300">✦ No account found with that email.</p>
              <p className="text-slate-400">Switching to registration — let's get you set up!</p>
            </div>
          );
          setAuthMode('register');
          setAuthStep('awaitUsername');
          pushOutput(
            <span className="text-amber-300 font-mono text-xs">Enter username:</span>
          );
          return;
        }

        pushOutput(
          <div className="text-xs font-mono">
            <p className="text-rose-400">✗ {result.error}</p>
            <p className="text-slate-400">Try the login command again to retry.</p>
          </div>
        );
        setAuthStep('idle');
        setInputMasked(false);
        return;
      }

      if (authStep === 'awaitUsername') {
        const username = value;
        pushLine({ prompt: 'guest', input: username });

        setAuthStep('submitting');
        pushOutput(
          <span className="text-slate-400 font-mono text-xs animate-pulse">Creating your account...</span>
        );

        const result = await register(authEmail, authPassword, username);

        if (result.success && result.message) {
          pushOutput(
            <div className="text-xs font-mono space-y-0.5">
              <p className="text-emerald-400 font-semibold">✓ {result.message}</p>
              <p className="text-slate-400">Your data is now persistent across sessions. ✨</p>
            </div>
          );
          setAuthStep('done');
          setTimeout(() => setAuthStep('idle'), 500);
          return;
        }

        pushOutput(
          <div className="text-xs font-mono">
            <p className="text-rose-400">✗ {result.error}</p>
            <p className="text-slate-400">Try the register command to retry.</p>
          </div>
        );
        setAuthStep('idle');
      }
    },
    [authStep, authMode, authEmail, authPassword, login, register, pushLine, pushOutput]
  );

  // ── Dramatic Sudo easter egg ───────────────────────────────────────────────

  const triggerSudoEasterEgg = useCallback(
    async (fullCmd: string) => {
      setIsExecutingAsync(true);
      pushLine({ prompt: currentUsername ?? 'guest', input: fullCmd });

      pushOutput(
        <div className="text-xs text-rose-400 font-mono">
          [ROOT SECURITY PROTOCOL] Escalating privileges...
        </div>
      );

      await new Promise((r) => setTimeout(r, 450));
      pushOutput(
        <div className="text-xs text-amber-400 font-mono animate-pulse">
          ⚠️ ACCESS GRANTED. Executing command with full kernel authority...
        </div>
      );

      await new Promise((r) => setTimeout(r, 600));

      const lineId = uid();
      setHistory((prev) => [
        ...prev,
        {
          id: lineId,
          prompt: '',
          output: (
            <div className="text-xs font-mono text-rose-300">
              Deleting system32 &amp; Curio.Kernel core... [░░░░░░░░░░░░░░░░░░░░] 0%
            </div>
          ),
        },
      ]);

      const steps = [
        { bar: '█████░░░░░░░░░░░░░░░', pct: '25%' },
        { bar: '██████████░░░░░░░░░░', pct: '50%' },
        { bar: '███████████████░░░░░', pct: '75%' },
        { bar: '████████████████████', pct: '100%' },
      ];

      for (const step of steps) {
        await new Promise((r) => setTimeout(r, 350));
        setHistory((prev) =>
          prev.map((l) =>
            l.id === lineId
              ? {
                  ...l,
                  output: (
                    <div className="text-xs font-mono text-rose-400">
                      Deleting system32 &amp; Curio.Kernel core... [{step.bar}] {step.pct}
                    </div>
                  ),
                }
              : l
          )
        );
      }

      await new Promise((r) => setTimeout(r, 500));

      pushOutput(
        <div className="text-xs font-mono text-emerald-300 bg-emerald-950/40 p-2 rounded border border-emerald-500/30 my-1">
          Just kidding 😌 nice try though. Curio.OS is indestructible.
        </div>
      );

      setIsExecutingAsync(false);
    },
    [currentUsername, pushLine, pushOutput]
  );

  // ── Render Neofetch (Personalized or Guest) ────────────────────────────────

  const renderNeofetch = useCallback(async () => {
    setIsExecutingAsync(true);
    let stats: UserStats | null = null;

    if (isLoggedIn) {
      const res = await apiGetStats();
      if (res.stats) {
        stats = res.stats;
      }
    }

    setIsExecutingAsync(false);

    if (isLoggedIn && stats) {
      pushOutput(
        <div className="flex flex-col sm:flex-row gap-4 text-xs font-mono my-2 text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-pink-500/20">
          <div className="text-pink-400 select-none font-bold leading-tight flex-shrink-0">
            {'    /\\_/\\    '}<br />
            {'   ( o.o )   '}<br />
            {'    > ^ <    '}<br />
            {'  CURIO.OS   '}<br />
            {'  ADMIN-SYS  '}
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="text-pink-400 font-bold border-b border-pink-500/30 pb-0.5">
              cutie@{stats.username}
            </div>
            <div><span className="text-indigo-400">OS:</span> Curio.OS v2.5.0 Browser Edition</div>
            <div><span className="text-indigo-400">Host:</span> Neon Cloud (AWS us-east-2)</div>
            <div><span className="text-indigo-400">Kernel:</span> {stats.kernel}</div>
            <div><span className="text-indigo-400">Uptime:</span> {stats.uptime}</div>
            <div><span className="text-indigo-400">Days Active:</span> <span className="text-emerald-400 font-semibold">{stats.daysSinceJoined} days</span></div>
            <div><span className="text-indigo-400">Notes Stored:</span> <span className="text-amber-300 font-semibold">{stats.notesCount} items</span></div>
            <div><span className="text-indigo-400">Login Streak:</span> <span className="text-pink-400 font-semibold">{stats.loginStreak} days 🔥</span></div>
            <div><span className="text-indigo-400">Shell:</span> {stats.shell}</div>
            <div><span className="text-indigo-400">Wallpaper:</span> {stats.wallpaper}</div>
            <div><span className="text-indigo-400">Memory:</span> {stats.memory}</div>
            <div className="flex gap-1 pt-1.5">
              <span className="w-3 h-2.5 bg-pink-500 rounded-xs inline-block" />
              <span className="w-3 h-2.5 bg-indigo-500 rounded-xs inline-block" />
              <span className="w-3 h-2.5 bg-emerald-500 rounded-xs inline-block" />
              <span className="w-3 h-2.5 bg-amber-400 rounded-xs inline-block" />
              <span className="w-3 h-2.5 bg-cyan-400 rounded-xs inline-block" />
            </div>
          </div>
        </div>
      );
    } else {
      // Guest Neofetch
      pushOutput(
        <div className="flex flex-col sm:flex-row gap-4 text-xs font-mono my-2 text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
          <div className="text-slate-400 select-none font-bold leading-tight flex-shrink-0">
            {'    /\\_/\\    '}<br />
            {'   ( -.- )   '}<br />
            {'    > ^ <    '}<br />
            {'  CURIO.OS   '}<br />
            {'  GUEST-SYS  '}
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="text-slate-400 font-bold border-b border-slate-700 pb-0.5">
              cutie@guest
            </div>
            <div><span className="text-indigo-400">OS:</span> Curio.OS v2.5.0 Browser Edition</div>
            <div><span className="text-indigo-400">Kernel:</span> Curio.Kernel (Browser WebWorker)</div>
            <div><span className="text-indigo-400">Session:</span> Anonymous Explorer (Temporary)</div>
            <div><span className="text-indigo-400">Shell:</span> curio-zsh 2.5</div>
            <div><span className="text-indigo-400">Cloud Sync:</span> <span className="text-rose-400">Disabled</span></div>
            <div className="text-amber-300 pt-1 italic text-[11px]">
              Tip: Run <span className="underline font-semibold">login</span> to unlock personalized stats &amp; cloud storage!
            </div>
          </div>
        </div>
      );
    }
  }, [isLoggedIn, pushOutput]);

  // ── Render Subbu Sub-commands ──────────────────────────────────────────────

  const handleSubbuCommand = useCallback(
    async (args: string[]) => {
      const sub = (args[0] ?? '').toLowerCase();

      if (!sub) {
        // Typing subbu alone lists available sub-commands
        pushOutput(
          <div className="space-y-1.5 text-xs font-mono my-1">
            <div className="text-pink-400 font-semibold">
              Subhajit Patra (Subbu) — Portfolio CLI
            </div>
            <div className="text-slate-400">Usage: subbu -&lt;command&gt;</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-slate-300 pt-1">
              <div><span className="text-amber-300">subbu -about</span> — Profile card &amp; identity</div>
              <div><span className="text-amber-300">subbu -skill</span> — Visual skill breakdown</div>
              <div><span className="text-amber-300">subbu -projects</span> — Portfolio showcase</div>
              <div><span className="text-amber-300">subbu -work</span> — Career &amp; hackathon timeline</div>
              <div><span className="text-amber-300">subbu -achievements</span> — Awards &amp; certifications</div>
              <div><span className="text-amber-300">subbu -currentmission</span> — Current mission &amp; goal</div>
              <div><span className="text-amber-300">subbu -now</span> — What Subbu is doing right now</div>
              <div><span className="text-amber-300">subbu -interests</span> — Passions &amp; random curiosities</div>
              <div><span className="text-amber-300">subbu -socials</span> — Online profiles &amp; links</div>
              <div><span className="text-amber-300">subbu -education</span> — Schooling &amp; B.Tech timeline</div>
            </div>
          </div>
        );
        return;
      }

      switch (sub) {
        case '-about':
          pushOutput(
            <div className="text-xs font-mono my-2 text-pink-300 whitespace-pre leading-relaxed select-text">
{`╭─ ADMIN PROFILE ─────────────────╮

  NAME       ${subbuData.profile.name}
  ALIAS      ${subbuData.profile.alias}
  ROLE       ${subbuData.profile.role}
  LOCATION   ${subbuData.profile.location}
  STATUS     ${subbuData.profile.status}

  ${subbuData.profile.quote}

╰─────────────────────────────────╯`}
            </div>
          );
          break;

        case '-skill':
          pushOutput(
            <div className="text-xs font-mono my-2 space-y-3 select-text">
              {subbuData.skills.map((cat) => (
                <div key={cat.category} className="space-y-0.5">
                  <div className="text-indigo-400 font-bold tracking-wider">{cat.category}</div>
                  {cat.skills.map((s) => (
                    <div key={s.name} className="flex items-center gap-2">
                      <span className="text-pink-400 font-mono tracking-tight">{s.bar}</span>
                      <span className="text-slate-300">{s.name}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
          break;

        case '-projects': {
          setIsExecutingAsync(true);
          pushOutput(
            <div className="text-xs font-mono text-amber-300 animate-pulse my-1">
              Scanning administrator's creations... ⟳
            </div>
          );

          await new Promise((r) => setTimeout(r, 650));

          pushOutput(
            <div className="text-xs font-mono my-2 space-y-2.5 select-text">
              {subbuData.projects.map((proj) => (
                <div key={proj.id} className="space-y-0.5">
                  <div className="text-pink-400 font-bold">
                    [{proj.id}] {proj.name}
                  </div>
                  <div className="text-slate-300 pl-5">
                    {proj.description}
                  </div>
                </div>
              ))}
            </div>
          );
          setIsExecutingAsync(false);
          break;
        }

        case '-work':
          pushOutput(
            <div className="text-xs font-mono my-2 text-slate-300 whitespace-pre leading-relaxed select-text">
{`2026
│
├── SIH 2026
├── Hackathon projects
├── LogiFlow
├── DREAM.OS
└── ???

2025
│
└── The origin story...`}
            </div>
          );
          break;

        case '-achievements':
          pushOutput(
            <div className="text-xs font-mono my-2 space-y-2 select-text">
              {subbuData.achievements.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="text-amber-300 font-semibold">
                    {item.icon} {item.title}
                  </div>
                  {item.detail && (
                    <div className="text-slate-400 pl-5 text-[11px]">
                      {item.detail}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
          break;

        case '-currentmission':
          pushOutput(
            <div className="text-xs font-mono my-2 text-slate-300 whitespace-pre leading-relaxed select-text">
{`CURRENT MISSION
────────────────────────────

${subbuData.currentMission.philosophy.join('\n')}

STATUS: ${subbuData.currentMission.statusProgress} ${subbuData.currentMission.statusPercent}

Next objective:
${subbuData.currentMission.nextObjective}`}
            </div>
          );
          break;

        case '-now':
          pushOutput(
            <div className="text-xs font-mono my-2 text-slate-300 whitespace-pre leading-relaxed select-text">
{`SUBBU IS CURRENTLY:

${subbuData.now.statusList.map((s) => `> ${s}`).join('\n')}

Last detected:
${subbuData.now.lastDetected}`}
            </div>
          );
          break;

        case '-interests':
          pushOutput(
            <div className="text-xs font-mono my-2 space-y-0.5 select-text">
              {subbuData.interests.map((interest) => (
                <div key={interest} className="text-pink-300">
                  ✦ <span className="text-slate-200">{interest}</span>
                </div>
              ))}
            </div>
          );
          break;

        case '-socials': {
          const activeSocials = socialsData.filter((s) => s.url && s.url.trim() !== '');
          pushOutput(
            <div className="text-xs font-mono my-2 space-y-2 select-text">
              <div className="text-pink-400 font-bold border-b border-pink-500/30 pb-1 flex items-center justify-between">
                <span>🌐 SUBBU'S ACTIVE SOCIAL CHANNELS</span>
                <span className="text-[10px] text-slate-400 font-normal">{activeSocials.length} connected</span>
              </div>
              <div className="space-y-1.5 pt-1">
                {activeSocials.map((s) => (
                  <div
                    key={s.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2 rounded-lg bg-slate-900/60 border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-amber-300 font-semibold">{s.name}</span>
                      <span className="text-slate-500">({s.handle})</span>
                    </div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline truncate max-w-xs sm:max-w-sm"
                    >
                      {s.url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          );
          break;
        }

        case '-education':
          pushOutput(
            <div className="text-xs font-mono my-2 space-y-2 select-text">
              <div className="text-pink-400 font-bold border-b border-pink-500/30 pb-1 flex items-center justify-between">
                <span>🎓 SUBBU'S ACADEMIC TIMELINE &amp; EDUCATION</span>
                <span className="text-[10px] text-slate-400 font-normal">3 stages verified</span>
              </div>
              <div className="space-y-2.5 pt-1">
                {educationData.map((item) => (
                  <div key={item.id} className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-indigo-400 font-bold">
                        [{item.step}] {item.stage}
                      </span>
                      {item.status ? (
                        <span className="text-amber-400 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 font-bold">
                          {item.status}
                        </span>
                      ) : (
                        <span className="text-emerald-400 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <div className="text-white font-semibold">{item.institution}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-slate-300 pt-1">
                      {Object.entries(item)
                        .filter(([k]) => !['id', 'step', 'stage', 'institution'].includes(k))
                        .map(([k, v]) => (
                          <div key={k}>
                            <span className="text-slate-500 uppercase">{k}:</span>{' '}
                            <span className="text-pink-300 font-semibold">{v}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
          break;

        default:
          pushOutput(
            <div className="text-xs text-rose-400 font-mono">
              Unknown subbu flag: <span className="text-amber-300">{sub}</span>. Type{' '}
              <span className="text-pink-400 font-semibold">subbu</span> to see available sub-commands.
            </div>
          );
      }
    },
    [pushOutput]
  );

  // ── Main command execution ─────────────────────────────────────────────────

  const executeCommand = useCallback(
    async (cmdStr: string) => {
      const trimmed = cmdStr.trim();
      if (!trimmed) return;
      setCmdHistory((prev) => [...prev, trimmed]);

      // If we're in an auth flow, route input there
      if (authStep !== 'idle' && authStep !== 'done') {
        setInput('');
        await handleAuthStepInput(trimmed);
        return;
      }

      // Check for sudo easter egg
      if (trimmed.toLowerCase().startsWith('sudo ') || trimmed.toLowerCase() === 'sudo') {
        setInput('');
        await triggerSudoEasterEgg(trimmed);
        return;
      }

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);
      setInput('');

      // Add user line to history
      pushLine({ prompt: currentUsername ?? 'guest', input: trimmed });

      // Handle subbu portfolio command
      if (cmd === 'subbu') {
        await handleSubbuCommand(args);
        return;
      }

      let response: React.ReactNode = null;

      switch (cmd) {
        // ── Basic Commands ──────────────────────────────────────────────────
        case 'help':
          response = (
            <div className="space-y-2 text-xs font-mono select-text">
              <div className="text-pink-400 font-semibold border-b border-pink-500/30 pb-1">
                CURIO.OS TERMINAL v2.5.0 — COMMAND DIRECTORY
              </div>

              <div>
                <div className="text-indigo-400 font-bold mb-0.5">BASIC</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-slate-300">
                  <div><span className="text-amber-300">help</span> — Display this help index</div>
                  <div><span className="text-amber-300">clear</span> — Clear terminal output</div>
                  <div><span className="text-amber-300">whoami</span> — Identity &amp; active session</div>
                  <div><span className="text-amber-300">about</span> — About Curio.OS &amp; tech stack</div>
                  <div><span className="text-amber-300">neofetch</span> — Personalized system info</div>
                  <div><span className="text-amber-300">echo &lt;text&gt;</span> — Print string to terminal</div>
                  <div><span className="text-amber-300">history</span> — Command history in this session</div>
                </div>
              </div>

              <div>
                <div className="text-indigo-400 font-bold mb-0.5">USER &amp; AUTH</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-slate-300">
                  <div><span className="text-amber-300">login</span> — Authenticate account</div>
                  <div><span className="text-amber-300">register</span> — Create new account</div>
                  <div><span className="text-amber-300">logout</span> — Sign out of session</div>
                  <div><span className="text-amber-300">user</span> — Detailed account stats</div>
                  <div><span className="text-amber-300">profile</span> — Profile summary &amp; bio</div>
                  <div><span className="text-amber-300">passwd</span> — Password rotation status</div>
                </div>
              </div>

              <div>
                <div className="text-indigo-400 font-bold mb-0.5">PERSONAL (Requires Login)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-slate-300">
                  <div><span className="text-amber-300">notes</span> — Open Brain.exe notes app</div>
                  <div><span className="text-amber-300">files</span> — Open Portfolio &amp; File Manager</div>
                  <div><span className="text-amber-300">music</span> — Open Curio Music Player</div>
                </div>
              </div>

              <div>
                <div className="text-indigo-400 font-bold mb-0.5">OS CONTROLS</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-slate-300">
                  <div><span className="text-amber-300">wallpaper [id]</span> — Switch wallpaper</div>
                  <div><span className="text-amber-300">settings</span> — Open Settings app</div>
                  <div><span className="text-amber-300">socials</span> — Open Social Profiles app</div>
                  <div><span className="text-amber-300">open &lt;app&gt;</span> — Launch app window</div>
                  <div><span className="text-amber-300">close &lt;app&gt;</span> — Close active window</div>
                  <div><span className="text-amber-300">reboot</span> — Replay boot sequence</div>
                  <div><span className="text-amber-300">shutdown</span> — Fake shutdown screen</div>
                </div>
              </div>

              <div>
                <div className="text-indigo-400 font-bold mb-0.5">FUN &amp; EASTER EGGS</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-slate-300">
                  <div><span className="text-amber-300">fortune</span> — Random prophecy</div>
                  <div><span className="text-amber-300">joke</span> — Programmer humor</div>
                  <div><span className="text-amber-300">matrix</span> — Toggle Matrix rain overlay</div>
                  <div><span className="text-amber-300">sudo &lt;cmd&gt;</span> — Root escalation bit</div>
                  <div><span className="text-amber-300">void</span> — Open VOID.EXE</div>
                  <div><span className="text-amber-300">secret</span> — Admin whisper</div>
                </div>
              </div>

              <div>
                <div className="text-indigo-400 font-bold mb-0.5">ADMIN PORTFOLIO</div>
                <div className="text-slate-300">
                  <span className="text-amber-300">subbu</span> or <span className="text-amber-300">subbu -&lt;flag&gt;</span> (e.g.{' '}
                  <span className="text-pink-400">subbu -socials</span>,{' '}
                  <span className="text-pink-400">subbu -education</span>,{' '}
                  <span className="text-pink-400">subbu -about</span>,{' '}
                  <span className="text-pink-400">subbu -projects</span>,{' '}
                  <span className="text-pink-400">subbu -skill</span>)
                </div>
              </div>
            </div>
          );
          break;

        case 'clear':
          setHistory([]);
          return;

        case 'whoami':
          response = isLoggedIn ? (
            <div className="text-xs text-slate-300 font-mono space-y-0.5">
              <p><span className="text-pink-400">user:</span> cutie@{currentUsername}</p>
              <p><span className="text-pink-400">status:</span> <span className="text-emerald-400">Authenticated ✓</span></p>
              <p><span className="text-pink-400">email:</span> {user?.email}</p>
              <p><span className="text-pink-400">role:</span> Cutiepie Administrator</p>
            </div>
          ) : (
            <div className="text-xs text-slate-300 font-mono space-y-0.5">
              <p><span className="text-pink-400">user:</span> cutie@guest</p>
              <p><span className="text-pink-400">status:</span> <span className="text-amber-400">Anonymous Explorer</span></p>
              <p className="text-slate-500">Run <span className="text-amber-300 font-semibold">login</span> to claim root access!</p>
            </div>
          );
          break;

        case 'about':
          response = (
            <div className="text-xs text-slate-300 space-y-1 font-mono">
              <p className="font-semibold text-indigo-400">Curio.OS v2.5.0 Browser Desktop</p>
              <p>A whimsical, fictional desktop operating system designed by <span className="text-pink-400 font-medium">Subhajit Patra (Subbu)</span>.</p>
              <p className="text-slate-400">Frontend: React 19 + TypeScript + Vite + Tailwind CSS + Web Audio API.</p>
              <p className="text-slate-400">Backend: Node.js + Express + Neon Serverless Postgres + JWT httpOnly Cookies.</p>
            </div>
          );
          break;

        case 'neofetch':
          await renderNeofetch();
          return;

        case 'echo':
          response = (
            <div className="text-xs text-slate-200 font-mono">
              {args.join(' ') || ''}
            </div>
          );
          break;

        case 'history':
          response = (
            <div className="text-xs font-mono space-y-0.5 text-slate-300 select-text">
              {cmdHistory.length === 0 ? (
                <p className="text-slate-500 italic">No commands recorded yet.</p>
              ) : (
                cmdHistory.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <span className="text-slate-500 w-6 text-right">{idx + 1}</span>
                    <span className="text-amber-300">{item}</span>
                  </div>
                ))
              )}
            </div>
          );
          break;

        // ── User / Auth Commands ────────────────────────────────────────────
        case 'login':
          if (isLoggedIn) {
            response = (
              <div className="text-xs text-amber-300 font-mono">
                Already logged in as <span className="text-pink-400">cutie@{currentUsername}</span>! Run <span className="text-amber-300 underline">logout</span> to switch accounts.
              </div>
            );
            break;
          }
          await startAuthFlow('login');
          return;

        case 'register':
          if (isLoggedIn) {
            response = (
              <div className="text-xs text-amber-300 font-mono">
                You already have an active account (<span className="text-pink-400">{currentUsername}</span>). Log out first to register another.
              </div>
            );
            break;
          }
          await startAuthFlow('register');
          return;

        case 'logout':
          if (!isLoggedIn) {
            response = <div className="text-xs text-slate-400 font-mono">You are not logged in, cutie.</div>;
            break;
          }
          await logout();
          response = (
            <div className="text-xs font-mono space-y-0.5">
              <p className="text-amber-300">✦ Logged out successfully. Come back soon! 👋</p>
              <p className="text-slate-400">Prompt reset to <span className="text-pink-400">cutie@guest</span>.</p>
            </div>
          );
          break;

        case 'user':
        case 'profile':
          if (!isLoggedIn) {
            response = (
              <div className="text-xs font-mono text-slate-400 space-y-1">
                <p>Guest profile active.</p>
                <p className="text-pink-400">Run <span className="text-amber-300">login</span> or <span className="text-amber-300">register</span> to save your persistent profile.</p>
              </div>
            );
          } else {
            response = (
              <div className="text-xs font-mono text-slate-300 space-y-1 bg-slate-900/40 p-2.5 rounded border border-pink-500/20">
                <div className="text-pink-400 font-bold border-b border-pink-500/30 pb-0.5">
                  USER PROFILE: cutie@{user?.username}
                </div>
                <div><span className="text-indigo-400">Email:</span> {user?.email}</div>
                <div><span className="text-indigo-400">Wallpaper:</span> {user?.wallpaperId || 'cosmic-aurora'}</div>
                <div><span className="text-indigo-400">Member Since:</span> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}</div>
                <div><span className="text-indigo-400">Role:</span> Cutiepie VIP Administrator</div>
                {user?.bio && <div><span className="text-indigo-400">Bio:</span> {user.bio}</div>}
              </div>
            );
          }
          break;

        case 'passwd':
          if (!isLoggedIn) {
            response = <div className="text-xs text-pink-400 font-mono">login first, cutie 🥺</div>;
          } else {
            response = (
              <div className="text-xs text-slate-300 font-mono space-y-1">
                <p className="text-amber-400">🔒 Password Security Protocol</p>
                <p>Your password hash is encrypted with 12 rounds of bcrypt on Neon Postgres.</p>
                <p className="text-slate-500">Direct CLI rotation is currently locked by Administrator Subbu for your protection 😉.</p>
              </div>
            );
          }
          break;

        // ── Personal Commands (Auth Gated) ──────────────────────────────────
        case 'notes':
          if (!isLoggedIn) {
            response = <div className="text-xs text-pink-400 font-mono">login first, cutie 🥺</div>;
          } else {
            openApp('notes');
            response = <div className="text-xs text-emerald-400 font-mono">Opening Brain.exe (Notes)... 📝</div>;
          }
          break;

        case 'photos':
          openApp('files');
          response = (
            <div className="text-xs text-emerald-400 font-mono">
              Opening Subbu's Photography &amp; Art gallery... 📸
            </div>
          );
          break;

        case 'favorites':
        case 'music':
          openApp('music');
          response = (
            <div className="text-xs text-emerald-400 font-mono">
              Opening Curio Music Player... 🎵
            </div>
          );
          break;

        case 'files':
          openApp('files');
          response = <div className="text-xs text-emerald-400 font-mono">Opening Portfolio &amp; File Manager... 📂</div>;
          break;

        case 'socials':
        case 'social':
          openApp('socials');
          response = (
            <div className="text-xs text-emerald-400 font-mono">
              Opening Subbu's Socials App... 🌐
            </div>
          );
          break;

        case 'education':
          openApp('files');
          response = (
            <div className="text-xs text-emerald-400 font-mono">
              Opening Academic Timeline in File Manager... 🎓
            </div>
          );
          break;

        // ── OS Commands ─────────────────────────────────────────────────────
        case 'wallpaper': {
          const validWallpapers: WallpaperId[] = [
            'cosmic-aurora',
            'cyber-noir',
            'dream-lavender',
            'synth-sunset',
            'matrix-green',
          ];

          const targetWallpaper = args[0]?.toLowerCase() as WallpaperId | undefined;

          if (!targetWallpaper) {
            response = (
              <div className="text-xs font-mono space-y-1 text-slate-300">
                <p className="text-indigo-400 font-bold">AVAILABLE WALLPAPERS:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-300">
                  <div>✦ <span className="text-amber-300 font-semibold">cosmic-aurora</span> — Deep space aurora mesh</div>
                  <div>✦ <span className="text-amber-300 font-semibold">cyber-noir</span> — Neon rain cityscape</div>
                  <div>✦ <span className="text-amber-300 font-semibold">dream-lavender</span> — Pastel lavender glow</div>
                  <div>✦ <span className="text-amber-300 font-semibold">synth-sunset</span> — Retro 80s synth horizon</div>
                  <div>✦ <span className="text-amber-300 font-semibold">matrix-green</span> — Cyber digital stream</div>
                </div>
                <p className="text-slate-400 text-[11px] pt-1">
                  Usage: <span className="text-pink-400 font-semibold">wallpaper &lt;id&gt;</span> (e.g. <span className="text-amber-300">wallpaper synth-sunset</span>)
                </p>
              </div>
            );
          } else if (validWallpapers.includes(targetWallpaper)) {
            window.dispatchEvent(
              new CustomEvent<WallpaperId>('curio:wallpaper', { detail: targetWallpaper })
            );
            if (isLoggedIn) {
              updateUserSettings({ wallpaperId: targetWallpaper });
            }
            response = (
              <div className="text-xs text-emerald-400 font-mono">
                ✓ Wallpaper changed to <span className="text-pink-400 font-semibold">'{targetWallpaper}'</span>. Looking sleek! ✨
              </div>
            );
          } else {
            response = (
              <div className="text-xs text-rose-400 font-mono">
                Invalid wallpaper id '{targetWallpaper}'. Choose from: {validWallpapers.join(', ')}
              </div>
            );
          }
          break;
        }

        case 'settings':
          openApp('settings');
          response = <div className="text-xs text-emerald-400 font-mono">Opening System Settings... ⚙️</div>;
          break;

        case 'open': {
          const appName = (args[0] ?? '').toLowerCase();
          const appMap: Record<string, AppId> = {
            terminal: 'terminal',
            files: 'files',
            file: 'files',
            explorer: 'files',
            socials: 'socials',
            social: 'socials',
            links: 'socials',
            music: 'music',
            songs: 'music',
            player: 'music',
            notes: 'notes',
            note: 'notes',
            brain: 'notes',
            settings: 'settings',
            setting: 'settings',
            config: 'settings',
            void: 'void',
            abyss: 'void',
          };

          const targetApp = appMap[appName];
          if (targetApp) {
            openApp(targetApp);
            response = (
              <div className="text-xs text-emerald-400 font-mono">
                Launching <span className="text-pink-300">{targetApp}</span>... 🚀
              </div>
            );
          } else {
            response = (
              <div className="text-xs text-rose-400 font-mono">
                Unknown app '{appName}'. Available apps: <span className="text-amber-300">terminal, files, socials, music, notes, settings, void</span>.
              </div>
            );
          }
          break;
        }

        case 'close': {
          const appName = (args[0] ?? '').toLowerCase();
          const appMap: Record<string, AppId> = {
            terminal: 'terminal',
            files: 'files',
            file: 'files',
            explorer: 'files',
            socials: 'socials',
            social: 'socials',
            links: 'socials',
            music: 'music',
            songs: 'music',
            player: 'music',
            notes: 'notes',
            note: 'notes',
            brain: 'notes',
            settings: 'settings',
            setting: 'settings',
            config: 'settings',
            void: 'void',
            abyss: 'void',
          };

          const targetApp = appMap[appName];
          if (!targetApp) {
            response = (
              <div className="text-xs text-rose-400 font-mono">
                Unknown app '{appName}'. Available apps: <span className="text-amber-300">terminal, files, music, notes, settings, void</span>.
              </div>
            );
          } else {
            const win = windows.find((w) => w.appId === targetApp);
            if (win) {
              closeWindow(win.id);
              response = (
                <div className="text-xs text-emerald-400 font-mono">
                  Closed <span className="text-pink-300">{targetApp}</span> window.
                </div>
              );
            } else {
              response = (
                <div className="text-xs text-slate-400 font-mono">
                  No active window found for <span className="text-amber-300">{targetApp}</span>.
                </div>
              );
            }
          }
          break;
        }

        case 'reboot':
          pushOutput(
            <div className="text-xs text-amber-300 font-mono animate-pulse">
              Initiating Curio.OS reboot sequence... ⟳
            </div>
          );
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('curio:reboot'));
          }, 500);
          return;

        case 'shutdown':
          pushOutput(
            <div className="text-xs text-rose-400 font-mono animate-pulse">
              Halting processor and system subsystems...
            </div>
          );
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('curio:shutdown'));
          }, 500);
          return;

        // ── Fun & Easter Eggs ───────────────────────────────────────────────
        case 'fortune': {
          const fortunes = [
            'You will find an Easter egg in the administrator’s secret folder.',
            'Curiosity built this entire operating system. Keep poking around.',
            'A pleasant surprise waits in VOID.EXE... if your courage holds.',
            'Subbu smiles upon those who build weird and beautiful things.',
            'Your browser tab has never looked this aesthetic.',
            'An unexpected commit will soon resolve your biggest bug.',
            'In a world of generic web apps, you chose whimsical desktops.',
            'Happiness is a terminal that remembers your nickname.',
          ];
          const choice = fortunes[Math.floor(Math.random() * fortunes.length)];
          response = (
            <div className="text-xs text-amber-300 italic font-mono">
              ✨ {choice}
            </div>
          );
          break;
        }

        case 'joke': {
          const jokes = [
            'Why do programmers prefer dark mode? Because light attracts bugs.',
            'There are 10 types of people in the world: those who understand binary, and those who don’t.',
            'A SQL query walks into a bar, walks up to two tables and asks: "Can I join you?"',
            'Why did the JavaScript developer wear glasses? Because they didn’t C#.',
            'Hardware: The part of a computer you can kick. Software: The part you can only curse at.',
          ];
          const joke = jokes[Math.floor(Math.random() * jokes.length)];
          response = (
            <div className="text-xs text-cyan-300 font-mono">
              😄 {joke}
            </div>
          );
          break;
        }

        case 'matrix': {
          const next = !matrixActive;
          setMatrixActive(next);
          response = (
            <div className="text-xs text-emerald-400 font-mono">
              {next
                ? 'Wake up, Neo... The Matrix rain effect is ENABLED. Follow the white rabbit. 🐇'
                : 'Matrix rain effect DISABLED. Welcome back to reality.'}
            </div>
          );
          break;
        }

        case 'void':
          if (isVoidAwoken) {
            // Post-awaken: eerie, cryptic response
            setIsExecutingAsync(true);
            await new Promise((r) => setTimeout(r, 300));
            pushOutput(
              <div className="text-xs font-mono space-y-1">
                <p className="text-rose-400">VOID.EXE &gt; <span className="text-rose-300 animate-pulse">It is already here.</span></p>
                <p className="text-slate-500">You opened it. You defied it. It noticed.</p>
                <p className="text-rose-500/60 text-[10px]">Check the taskbar. Check the vignette on your screen edges. It leaked.</p>
              </div>
            );
            setIsExecutingAsync(false);
          } else {
            openApp('void');
            response = (
              <div className="text-xs text-purple-400 font-mono">
                Summoning VOID.EXE... It is staring back into your soul. 👁️
              </div>
            );
          }
          break;

        case 'secret':
          response = (
            <div className="text-xs text-rose-300 font-mono space-y-0.5">
              <p>🤫 Admin Whisper:</p>
              <p className="text-slate-300">
                Go to File Explorer → &quot;Admin&apos;s Secret Folder&quot;.
              </p>
              <p className="text-slate-400 text-[11px]">
                Subbu&apos;s sincerity filter requires &gt;85% genuine adoration to unlock the archive.
              </p>
            </div>
          );
          break;

        default:
          response = (
            <div className="text-rose-400 text-xs font-mono">
              command not found: <span className="text-slate-200">{cmd}</span>. Type{' '}
              <span className="text-amber-300 font-semibold">help</span> for available commands.
            </div>
          );
      }

      if (response) pushOutput(response);
    },
    [
      authStep,
      handleAuthStepInput,
      triggerSudoEasterEgg,
      currentUsername,
      pushLine,
      handleSubbuCommand,
      isLoggedIn,
      renderNeofetch,
      cmdHistory,
      startAuthFlow,
      logout,
      user,
      openApp,
      windows,
      closeWindow,
      updateUserSettings,
      matrixActive,
      pushOutput,
      isVoidAwoken,
    ]
  );

  // ── Keyboard handler ──────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!inputMasked) sound.playKeystroke();

    if (e.key === 'Enter') {
      if (isExecutingAsync) return;
      executeCommand(input);
      setInput('');
      setHistoryIdx(-1);
      return;
    }

    if (authStep !== 'idle') return;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = historyIdx === -1 ? cmdHistory.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(next);
      if (cmdHistory[next]) setInput(cmdHistory[next]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx === -1) return;
      const next = historyIdx + 1;
      if (next >= cmdHistory.length) {
        setHistoryIdx(-1);
        setInput('');
      } else {
        setHistoryIdx(next);
        setInput(cmdHistory[next]);
      }
    }
  };

  const promptUser = isLoggedIn ? (currentUsername ?? 'guest') : 'guest';

  return (
    <div
      className={`relative h-full w-full ${
        matrixActive ? 'bg-black text-emerald-400' : 'bg-slate-950/95 text-slate-200'
      } font-mono p-4 overflow-y-auto flex flex-col text-sm select-text transition-colors duration-300`}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Matrix rain canvas background when active */}
      {matrixActive && <MatrixRainCanvas />}

      {/* History lines */}
      <div className="relative z-10 flex-1 space-y-1.5">
        {history.map((item) => (
          <div key={item.id}>
            {item.input !== undefined && (
              <div className="flex items-center gap-1.5 text-xs">
                <Prompt
                  username={item.input ? (isLoggedIn ? currentUsername : 'guest') : 'guest'}
                  isMatrix={matrixActive}
                />
                <span className={matrixActive ? 'text-emerald-300 ml-1' : 'text-slate-100 ml-1'}>
                  {item.isMasked ? '●'.repeat(Math.min(item.input.length, 12)) : item.input}
                </span>
              </div>
            )}
            {item.output !== undefined && item.output !== '' && (
              <div className="pl-1 py-0.5 text-xs">{item.output}</div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input line */}
      <div
        className={`relative z-10 flex items-center gap-1.5 pt-2 border-t ${
          matrixActive ? 'border-emerald-900/60' : 'border-slate-800/80'
        } mt-2`}
      >
        <Prompt username={promptUser} isMatrix={matrixActive} />
        <input
          ref={inputRef}
          type={inputMasked ? 'password' : 'text'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={authStep === 'submitting' || isExecutingAsync}
          className={`flex-1 bg-transparent border-none outline-none font-mono text-xs focus:ring-0 p-0 ml-1 ${
            matrixActive
              ? 'text-emerald-300 placeholder-emerald-800'
              : inputMasked
              ? 'text-slate-300'
              : 'text-slate-100 placeholder-slate-600'
          } ${authStep === 'submitting' || isExecutingAsync ? 'opacity-40' : ''}`}
          placeholder={
            authStep === 'awaitEmail'
              ? 'your@email.com'
              : authStep === 'awaitPassword'
              ? '••••••••'
              : authStep === 'awaitUsername'
              ? 'cool_username'
              : 'type a command...'
          }
          autoFocus
          autoComplete="off"
          spellCheck={false}
        />
        {(authStep === 'submitting' || isExecutingAsync) && (
          <span className="text-pink-400 animate-pulse text-xs font-mono">⟳</span>
        )}
      </div>
    </div>
  );
};
