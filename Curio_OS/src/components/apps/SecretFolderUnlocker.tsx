import React, { useState, useEffect, useRef } from 'react';
import {
  Lock,
  Zap,
  Mail,
  IndianRupee,
  Timer,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Brain,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { useAnimationsEnabled } from '../../utils/useAnimations';
import { SECRET_FOLDER_PUZZLES, type SecretPuzzle } from '../../data/secretFolderPuzzles';

// ── Security Override Reflex Game ──────────────────────────────────────────────

// ── Question Types for Round 2 ────────────────────────────────────────────────
interface MemoryQuestion {
  prompt: string;
  expected: number;
}

function generateMemoryChallenge(): { numbers: number[]; questions: MemoryQuestion[] } {
  // Generate 4 unique random 2-digit numbers
  const nums: number[] = [];
  while (nums.length < 4) {
    const n = Math.floor(Math.random() * 89) + 10; // 10 to 98
    if (!nums.includes(n)) nums.push(n);
  }

  const [n1, n2, n3, n4] = nums;
  const sorted = [...nums].sort((a, b) => a - b);

  const candidatePool: MemoryQuestion[] = [
    { prompt: 'What was the 1st number?', expected: n1 },
    { prompt: 'What was the 2nd number?', expected: n2 },
    { prompt: 'What was the 3rd number?', expected: n3 },
    { prompt: 'What was the 4th number?', expected: n4 },
    { prompt: 'What was the largest number?', expected: sorted[3] },
    { prompt: 'What was the smallest number?', expected: sorted[0] },
    { prompt: 'What was the 2nd largest number?', expected: sorted[2] },
    { prompt: 'What is the sum of the 1st and 3rd number?', expected: n1 + n3 },
    { prompt: 'What is the sum of the 2nd and 4th number?', expected: n2 + n4 },
    { prompt: 'What is the difference between largest and smallest?', expected: sorted[3] - sorted[0] },
  ];

  // Pick 3 random distinct questions
  const shuffledQuestions = [...candidatePool].sort(() => Math.random() - 0.5).slice(0, 3);

  return { numbers: nums, questions: shuffledQuestions };
}

// ── Helper to shuffle array ───────────────────────────────────────────────────
function shuffleWords(words: string[]): string[] {
  let shuffled = [...words];
  let attempts = 0;
  while (attempts < 10) {
    shuffled = [...words].sort(() => Math.random() - 0.5);
    if (shuffled.join(' ').toLowerCase() !== words.join(' ').toLowerCase()) {
      break;
    }
    attempts++;
  }
  return shuffled;
}

interface SecretFolderUnlockerProps {
  onUnlock: () => void;
  onMailSubbu: () => void;
  onDonate: () => void;
}

export const SecretFolderUnlocker: React.FC<SecretFolderUnlockerProps> = ({
  onUnlock,
  onMailSubbu,
  onDonate,
}) => {
  // Protocol overall state
  const [currentRound, setCurrentRound] = useState<1 | 2 | 3>(1);
  const [totalFailedAttempts, setTotalFailedAttempts] = useState<number>(0);

  // ── Round 1 State ───────────────────────────────────────────────────────────
  const [round1Level, setRound1Level] = useState(1);
  const [isPlayingRound1, setIsPlayingRound1] = useState(true);
  const [round1Feedback, setRound1Feedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [round1Attempts, setRound1Attempts] = useState(0);
  const [round1Transition, setRound1Transition] = useState<{ success: boolean } | null>(null);

  const needleRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(0);
  const dirRef = useRef(1);
  const reqRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (currentRound !== 1 || !isPlayingRound1 || round1Transition) return;
    let speed = 1.2;
    if (round1Level === 2) speed = 2.2;
    if (round1Level === 3) speed = 3.5;

    const animate = () => {
      posRef.current += speed * dirRef.current;
      if (posRef.current >= 100) {
        posRef.current = 100;
        dirRef.current = -1;
      }
      if (posRef.current <= 0) {
        posRef.current = 0;
        dirRef.current = 1;
      }

      if (needleRef.current) {
        needleRef.current.style.left = `${posRef.current}%`;
      }
      reqRef.current = requestAnimationFrame(animate);
    };
    reqRef.current = requestAnimationFrame(animate);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [currentRound, isPlayingRound1, round1Level, round1Transition]);

  // ── Round 2 State ───────────────────────────────────────────────────────────
  const [memoryData, setMemoryData] = useState<{ numbers: number[]; questions: MemoryQuestion[] }>(() =>
    generateMemoryChallenge()
  );
  const [memoryPhase, setMemoryPhase] = useState<'intro' | 'memorize' | 'answering'>('intro');
  const [introCountdown, setIntroCountdown] = useState(3);
  const [memorizeCountdown, setMemorizeCountdown] = useState(3);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [memoryAnswerInput, setMemoryAnswerInput] = useState('');
  const [memoryFailMessage, setMemoryFailMessage] = useState<string | null>(null);

  // ── Round 3 State ───────────────────────────────────────────────────────────
  const [puzzle, setPuzzle] = useState<SecretPuzzle>(() => {
    const idx = Math.floor(Math.random() * SECRET_FOLDER_PUZZLES.length);
    return SECRET_FOLDER_PUZZLES[idx];
  });
  const [availableWords, setAvailableWords] = useState<{ id: string; word: string }[]>([]);
  const [placedWords, setPlacedWords] = useState<{ id: string; word: string }[]>([]);
  const [scrambleFailNotice, setScrambleFailNotice] = useState<string | null>(null);
  const [successPopup, setSuccessPopup] = useState<SecretPuzzle['popup'] | null>(null);

  // Terminal Chrome & Animations (Hooks must remain at the top level!)
  const animationsEnabled = useAnimationsEnabled();
  const fullStatusText = `admin_protocol.sys :: round ${currentRound}/3 :: fails ${totalFailedAttempts}/6`;
  const [displayedStatus, setDisplayedStatus] = useState(fullStatusText);

  // Character reveal / typewriter animation for the terminal status line
  useEffect(() => {
    if (!animationsEnabled) {
      setDisplayedStatus(fullStatusText);
      return;
    }
    let i = 0;
    setDisplayedStatus('');
    const interval = setInterval(() => {
      i++;
      setDisplayedStatus(fullStatusText.slice(0, i));
      if (i >= fullStatusText.length) {
        clearInterval(interval);
      }
    }, 18);
    return () => clearInterval(interval);
  }, [fullStatusText, animationsEnabled]);

  const consoleGlowClass = !animationsEnabled
    ? currentRound === 1
      ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.2),0_10px_35px_rgba(0,0,0,0.85)]'
      : currentRound === 2
      ? 'border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.2),0_10px_35px_rgba(0,0,0,0.85)]'
      : 'border-fuchsia-500/50 shadow-[0_0_20px_rgba(217,70,239,0.2),0_10px_35px_rgba(0,0,0,0.85)]'
    : currentRound === 1
    ? 'border-cyan-500/40 animate-console-glow-cyan'
    : currentRound === 2
    ? 'border-blue-500/40 animate-console-glow-blue'
    : 'border-fuchsia-500/40 animate-console-glow-magenta';

  // Initialize Round 3 words when puzzle changes
  const initRound3Words = (p: SecretPuzzle) => {
    const rawWords = p.answer.split(/\s+/);
    const shuffled = shuffleWords(rawWords);
    setAvailableWords(shuffled.map((w, i) => ({ id: `${w}-${i}-${Date.now()}`, word: w })));
    setPlacedWords([]);
    setScrambleFailNotice(null);
  };

  useEffect(() => {
    initRound3Words(puzzle);
  }, [puzzle]);

  // Round 2 intro countdown timer
  useEffect(() => {
    if (currentRound !== 2 || memoryPhase !== 'intro') return;

    setIntroCountdown(3);
    const interval = setInterval(() => {
      setIntroCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setMemoryPhase('memorize');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRound, memoryPhase]);

  // Round 2 memorize countdown timer (3 seconds)
  useEffect(() => {
    if (currentRound !== 2 || memoryPhase !== 'memorize') return;

    setMemorizeCountdown(3);
    const interval = setInterval(() => {
      setMemorizeCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setMemoryPhase('answering');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRound, memoryPhase, memoryData]);


  // ── Handlers ────────────────────────────────────────────────────────────────

  // Transition from Round 1 to Round 2 on button click
  const handleStartRound2 = () => {
    sound.playClick();
    setRound1Transition(null);
    setCurrentRound(2);
    setMemoryData(generateMemoryChallenge());
    setMemoryPhase('intro');
    setIntroCountdown(3);
    setQuestionIndex(0);
    setMemoryAnswerInput('');
    setMemoryFailMessage(null);
  };

  // Advance to next round when failing
  const handleFailRound = (fromRound: 1 | 2 | 3) => {
    sound.playAlert();
    const newTotalFails = totalFailedAttempts + 1;
    setTotalFailedAttempts(newTotalFails);

    if (newTotalFails >= 6) {
      return; // Will render Access Denied screen
    }

    if (fromRound === 1) {
      setIsPlayingRound1(false);
      setRound1Feedback(null);
      setRound1Transition({ success: false });
    } else if (fromRound === 2) {
      setMemoryFailMessage('❌ MEMORY TEST FAILED\nYour brain has left the chat.\nMoving to the next test...');
      setTimeout(() => {
        setMemoryFailMessage(null);
        setCurrentRound(3);
        const nextPuzzle = SECRET_FOLDER_PUZZLES[Math.floor(Math.random() * SECRET_FOLDER_PUZZLES.length)];
        setPuzzle(nextPuzzle);
        initRound3Words(nextPuzzle);
      }, 2200);
    } else if (fromRound === 3) {
      setScrambleFailNotice('❌ Incorrect arrangement! Looping back with fresh challenges...');
      setTimeout(() => {
        setScrambleFailNotice(null);
        setCurrentRound(2);
        setMemoryData(generateMemoryChallenge());
        setMemoryPhase('intro');
        setIntroCountdown(3);
        setQuestionIndex(0);
        setMemoryAnswerInput('');
        setMemoryFailMessage(null);
      }, 2000);
    }
  };

  // Round 1 Submission
  const handleRound1Submit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!isPlayingRound1) return;

    sound.playClick();
    
    // Target is 42 to 58
    const isHit = posRef.current >= 42 && posRef.current <= 58;

    if (isHit) {
      sound.playNotification();
      setIsPlayingRound1(false);
      setRound1Feedback({ msg: `Override ${round1Level}/3 Successful!`, type: 'success' });
      
      setTimeout(() => {
        if (round1Level >= 3) {
          setIsPlayingRound1(false);
          setRound1Feedback(null);
          setRound1Transition({ success: true });
        } else {
          setRound1Level(prev => prev + 1);
          setIsPlayingRound1(true);
          setRound1Feedback(null);
        }
      }, 1000);
    } else {
      sound.playAlert();
      const nextAttemptCount = round1Attempts + 1;
      setRound1Attempts(nextAttemptCount);
      setIsPlayingRound1(false);
      setRound1Feedback({ msg: `Override Failed!`, type: 'error' });

      if (nextAttemptCount >= 3) {
        setTimeout(() => handleFailRound(1), 1000);
      } else {
        setTimeout(() => {
          setIsPlayingRound1(true);
          setRound1Feedback(null);
        }, 1000);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && currentRound === 1 && isPlayingRound1 && !round1Transition) {
        e.preventDefault();
        handleRound1Submit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRound, isPlayingRound1, round1Transition, round1Attempts, round1Level]);

  // Round 2 Question Submit
  const handleMemoryAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    const currentQ = memoryData.questions[questionIndex];
    const userVal = parseInt(memoryAnswerInput.trim(), 10);

    if (userVal === currentQ.expected) {
      sound.playNotification();
      if (questionIndex >= 2) {
        // Passed all 3 questions!
        onUnlock();
      } else {
        setQuestionIndex((prev) => prev + 1);
        setMemoryAnswerInput('');
      }
    } else {
      handleFailRound(2);
    }
  };

  // Round 3 Word Placement
  const handleWordClickAvailable = (item: { id: string; word: string }) => {
    sound.playClick();
    setAvailableWords((prev) => prev.filter((w) => w.id !== item.id));
    setPlacedWords((prev) => [...prev, item]);
  };

  const handleWordClickPlaced = (item: { id: string; word: string }) => {
    sound.playClick();
    setPlacedWords((prev) => prev.filter((w) => w.id !== item.id));
    setAvailableWords((prev) => [...prev, item]);
  };

  const handleResetRound3 = () => {
    sound.playClick();
    initRound3Words(puzzle);
  };

  const handleRound3Submit = () => {
    sound.playClick();
    const formed = placedWords.map((w) => w.word).join(' ');

    const cleanFormed = formed.trim().toLowerCase().replace(/[.,!?'"’]/g, '');
    const cleanAnswer = puzzle.answer.trim().toLowerCase().replace(/[.,!?'"’]/g, '');

    if (cleanFormed === cleanAnswer) {
      sound.playNotification();
      setSuccessPopup(puzzle.popup);
    } else {
      handleFailRound(3);
    }
  };

  // ── Overall Failure (ACCESS DENIED Screen after 6 total failed attempts) ─────
  if (totalFailedAttempts >= 6) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-slate-900/95 border border-amber-600/40 shadow-2xl backdrop-blur-md space-y-5 text-center">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Lock className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-amber-400 text-base tracking-widest font-mono">
              🔐 ACCESS DENIED
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              You&apos;ve tried very hard across all protocols.
            </p>
            <p className="text-slate-400 text-xs">
              Perhaps you should ask the administrator himself.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onMailSubbu();
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-500/25 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Mail className="w-4 h-4" /> MAIL SUBBU
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onDonate();
              }}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <IndianRupee className="w-4 h-4" /> DONATE ₹1
            </button>
          </div>

          <p className="text-[10px] text-slate-500 font-mono pt-3 border-t border-slate-800">
            Total attempts exhausted: {totalFailedAttempts} / 6
          </p>
        </div>
      </div>
    );
  }

  // ── Success Popup for Round 3 ────────────────────────────────────────────────
  if (successPopup) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-xl bg-[#090D16]/95 border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2),0_10px_35px_rgba(0,0,0,0.85)] backdrop-blur-xl space-y-4 text-center animate-in zoom-in-95 duration-200 relative overflow-hidden">
          {/* Subtle scanline overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.35)_51%)] bg-[length:100%_4px] opacity-20" />
          
          <div className="text-4xl relative z-10">{successPopup.emoji}</div>
          <h3 className="text-lg font-bold text-emerald-400 font-mono tracking-wide relative z-10">
            {successPopup.title}
          </h3>
          <p className="text-sm text-slate-200 font-semibold relative z-10">{successPopup.subtitle}</p>
          <p className="text-xs text-slate-300 italic bg-slate-950/80 p-3 rounded-xl border border-slate-800 relative z-10">
            &ldquo;{successPopup.jab}&rdquo;
          </p>
          <button
            onClick={() => {
              sound.playClick();
              onUnlock();
            }}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl text-xs tracking-wide transition-colors cursor-pointer shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-1.5 relative z-10"
          >
            <span>Let me in</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (

    <div className="h-full flex items-center justify-center p-2">
      <div
        className={`max-w-md w-full p-5 sm:p-6 rounded-xl bg-[#090D16]/95 backdrop-blur-xl border space-y-4 relative overflow-hidden transition-all duration-300 ${consoleGlowClass}`}
      >
        {/* Retro Security Console Scanlines Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.35)_51%)] bg-[length:100%_4px] opacity-25" />
        {animationsEnabled && (
          <div className="absolute inset-x-0 h-16 pointer-events-none bg-gradient-to-b from-transparent via-cyan-400/[0.04] to-transparent animate-scanline" />
        )}

        {/* Terminal Monospace Status Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-inner transition-colors ${
                currentRound === 1
                  ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                  : currentRound === 2
                  ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                  : 'bg-fuchsia-500/15 border-fuchsia-500/30 text-fuchsia-400'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center font-mono text-xs text-slate-300 truncate">
                <span className="text-emerald-400 font-bold mr-1.5 select-none">&gt;</span>
                <span className="tracking-normal">{displayedStatus}</span>
                <span className="inline-block w-1.5 h-3 bg-emerald-400/70 ml-1 animate-pulse" />
              </div>
              <p
                className={`text-[11px] font-sans font-medium mt-0.5 ${
                  currentRound === 1
                    ? 'text-cyan-400'
                    : currentRound === 2
                    ? 'text-blue-400'
                    : 'text-fuchsia-400'
                }`}
              >
                {currentRound === 1
                  ? 'Security Override'
                  : currentRound === 2
                  ? 'Prove You Have a Memory'
                  : 'Reputation Rehabilitation'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Round 1: "Security Override" ───────────────────────────────────── */}
        {currentRound === 1 && (
          <div className="space-y-4">
            {round1Transition ? (
              <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800 text-center space-y-4 animate-in fade-in duration-200">
                <div
                  className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center border shadow-inner ${
                    round1Transition.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-rose-500/10'
                  }`}
                >
                  {round1Transition.success ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <RotateCcw className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-1">
                  <h4
                    className={`text-sm font-bold font-mono tracking-wider ${
                      round1Transition.success ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {round1Transition.success
                      ? 'OVERRIDE PROTOCOL COMPLETE'
                      : 'REFLEX ATTEMPTS EXHAUSTED'}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {round1Transition.success
                      ? 'Reflex locks bypassed. Prepare for memory validation protocol.'
                      : 'Reflex sync timed out. Rerouting to secondary memory protocol.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartRound2}
                  className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold font-mono tracking-wider transition-all cursor-pointer shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2"
                >
                  <span>Go to next round</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">Sync with the signal:</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Misses: {round1Attempts} / 3
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Hit SPACE or click exactly when the needle aligns with the center.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 relative overflow-hidden">
                  <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                    <span>Lock {round1Level} of 3</span>
                    <span className="text-[11px] text-slate-500">
                      {round1Level === 1 ? 'slow' : round1Level === 2 ? 'fast' : 'extreme'}
                    </span>
                  </div>

                  <div className="relative w-full h-8 bg-slate-900 rounded-lg border border-slate-700/50 overflow-hidden shadow-inner">
                    {/* Target Zone */}
                    <div className="absolute top-0 bottom-0 left-[42%] right-[42%] bg-emerald-500/20 border-x border-emerald-500/50" />
                    
                    {/* Needle */}
                    <div 
                      ref={needleRef}
                      className="absolute top-0 bottom-0 w-1 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] -ml-[2px]"
                      style={{ left: '0%' }}
                    />
                  </div>

                  {round1Feedback && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
                       <span className={`text-sm font-bold font-mono tracking-wider ${round1Feedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                         {round1Feedback.msg}
                       </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => handleRound1Submit(e)}
                  disabled={!isPlayingRound1}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-mono tracking-wider transition-colors cursor-pointer shadow-md shadow-amber-600/20 uppercase flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" /> OVERRIDE
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Round 2: "Prove You Have a Memory" ────────────────────────────── */}
        {currentRound === 2 && (
          <div className="space-y-4">
            {memoryFailMessage ? (
              <div className="p-5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-center space-y-2 animate-in fade-in duration-200">
                <p className="text-sm font-bold text-rose-300 font-mono tracking-wide">
                  ❌ MEMORY TEST FAILED
                </p>
                <p className="text-xs text-slate-300 font-mono">Your brain has left the chat.</p>
                <p className="text-[11px] text-slate-400 pt-1">Moving to the next test...</p>
              </div>
            ) : memoryPhase === 'intro' ? (
              <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800 text-center space-y-4 animate-in fade-in duration-200">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                  <Brain className="w-6 h-6 animate-pulse" />
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold font-mono tracking-wider text-cyan-300">
                    Remember these numbers
                  </h4>
                  <p className="text-xs text-slate-400 font-sans max-w-xs mx-auto">
                    4 numbers will appear on screen for 5 seconds. Memorize their values and their positions carefully.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sound.playClick();
                    setMemoryPhase('memorize');
                  }}
                  className="w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-medium font-sans transition-all cursor-pointer shadow-md shadow-cyan-600/20 flex items-center justify-center gap-2"
                >
                  <span>Ready? Show me the numbers</span>
                  {introCountdown > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950/80 border border-cyan-400/40 text-cyan-200 font-mono">
                      {introCountdown}s
                    </span>
                  )}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : memoryPhase === 'memorize' ? (
              <div className="space-y-4 text-center py-2">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Timer className="w-4 h-4 animate-spin" />
                    Remember these numbers!
                  </span>
                  <span className="text-slate-400">{memorizeCountdown}s</span>
                </div>

                {/* Visible Animated Timer Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(memorizeCountdown / 5) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-3 py-3">
                  {memoryData.numbers.map((num, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <div className="w-full aspect-square bg-slate-950 border border-cyan-500/40 rounded-2xl flex items-center justify-center text-2xl font-bold font-mono text-cyan-300 shadow-lg shadow-cyan-950/50">
                        {num}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">
                        {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : '4th'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-cyan-400 font-bold">
                    Question {questionIndex + 1} of 3
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">1 strike policy</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
                  <p className="text-xs font-semibold text-slate-200 font-mono">
                    {memoryData.questions[questionIndex].prompt}
                  </p>
                </div>

                <form onSubmit={handleMemoryAnswerSubmit} className="space-y-3">
                  <input
                    type="number"
                    value={memoryAnswerInput}
                    onChange={(e) => setMemoryAnswerInput(e.target.value)}
                    placeholder="Enter numerical answer..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!memoryAnswerInput.trim()}
                    className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-mono tracking-wider transition-colors cursor-pointer shadow-md shadow-cyan-600/20 uppercase"
                  >
                    Submit Answer
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* ── Round 3: "Reputation Rehabilitation" ──────────────────────────── */}
        {currentRound === 3 && (
          <div className="space-y-4">
            {scrambleFailNotice ? (
              <div className="p-5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-center space-y-2 animate-in fade-in duration-200">
                <p className="text-xs font-bold text-rose-300 font-mono">{scrambleFailNotice}</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div>
                  <p className="text-xs text-slate-300 font-medium">
                    Unscramble the words to rehabilitate your standing:
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Click words below to construct the sentence in correct order.
                  </p>
                </div>

                {/* Word Construction Slot */}
                <div className="min-h-16 p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center gap-1.5">
                  {placedWords.length === 0 ? (
                    <span className="text-slate-600 text-xs italic font-mono select-none">
                      (Your sentence will appear here...)
                    </span>
                  ) : (
                    placedWords.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleWordClickPlaced(item)}
                        className="px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 text-xs font-medium transition-colors cursor-pointer shadow-sm"
                        title="Click to remove"
                      >
                        {item.word} ✕
                      </button>
                    ))
                  )}
                </div>

                {/* Available Shuffled Pool */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Available Words:</span>
                    <button
                      type="button"
                      onClick={handleResetRound3}
                      className="text-slate-500 hover:text-slate-300 flex items-center gap-1 text-[10px]"
                    >
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 min-h-12 items-center">
                    {availableWords.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleWordClickAvailable(item)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors cursor-pointer shadow-sm"
                      >
                        + {item.word}
                      </button>
                    ))}
                    {availableWords.length === 0 && (
                      <span className="text-[11px] text-slate-500 italic pl-1">
                        All words placed! Ready to submit.
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRound3Submit}
                  disabled={placedWords.length === 0}
                  className="w-full py-2.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold font-mono tracking-wider transition-colors cursor-pointer shadow-md shadow-pink-600/20 uppercase"
                >
                  Submit Arrangement
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
