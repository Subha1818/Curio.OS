import React, { useState, useEffect } from 'react';
import {
  Lock,
  Heart,
  Mail,
  IndianRupee,
  Timer,
  RotateCcw,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { SECRET_FOLDER_PUZZLES, type SecretPuzzle } from '../../data/secretFolderPuzzles';

// ── Hardened Sincerity Evaluator ──────────────────────────────────────────────
function evaluateHardSincerity(text: string): { score: number; feedback: string } {
  const clean = text.toLowerCase().trim();
  if (!clean) return { score: 0, feedback: 'Type a message appreciating Administrator Subbu...' };

  const mentionsSubbu = clean.includes('subbu') || clean.includes('subhajit');
  if (!mentionsSubbu) {
    const rawLenScore = Math.min(25, Math.floor(clean.length / 4));
    return {
      score: rawLenScore,
      feedback: 'The administrator does not recognize your devotion without his name.',
    };
  }

  let points = 20; // Base score for naming Subbu

  // Category 1: Intellectual & Architectural Mastery
  const c1 = ['genius', 'brilliant', 'intellect', 'smartest', 'architect', 'legend', 'goat', 'master', 'visionary', 'blacksmith'];
  if (c1.some((w) => clean.includes(w))) points += 16;

  // Category 2: Appearance & Aura
  const c2 = ['handsome', 'majestic', 'gorgeous', 'charming', 'aesthetic', 'stunning', 'dapper', 'cute', 'attractive'];
  if (c2.some((w) => clean.includes(w))) points += 16;

  // Category 3: Coding & Engineering Prowess
  const c3 = ['code', 'developer', 'creator', 'engineer', 'craft', 'software', 'compiler', 'operating system', 'design'];
  if (c3.some((w) => clean.includes(w))) points += 16;

  // Category 4: Heart & Kindness
  const c4 = ['kind', 'sweet', 'generous', 'caring', 'humble', 'pure', 'wholesome', 'warm', 'patient'];
  if (c4.some((w) => clean.includes(w))) points += 16;

  // Category 5: Pure Devotion & Unmatched Flattery
  const c5 = ['love', 'marry', 'worship', 'adore', 'inspire', 'greatest', 'unmatched', 'flawless', 'perfection'];
  if (c5.some((w) => clean.includes(w))) points += 16;

  // Stringent length thresholds
  if (clean.length < 50) {
    points = Math.min(points, 52);
  } else if (clean.length < 85) {
    points = Math.min(points, 72);
  } else if (clean.length < 120) {
    points = Math.min(points, 88);
  } else if (clean.length >= 140) {
    points += 10;
  }

  const score = Math.min(100, Math.max(0, points));

  let feedback = 'Sincerity insufficient... Subbu expects true eloquence.';
  if (score === 100) feedback = 'PERFECT HARMONY! 100% Sincerity achieved.';
  else if (score >= 85) feedback = 'Close to true devotion, yet still missing nuance.';
  else if (score >= 60) feedback = 'Moderate praise detected. Subbu remains unimpressed.';
  else feedback = 'Sincerity registered as mediocre.';

  return { score, feedback };
}

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
    { prompt: `What is the sum of the 1st + 3rd number? (${n1} + ${n3})`, expected: n1 + n3 },
    { prompt: `What is the sum of the 2nd + 4th number? (${n2} + ${n4})`, expected: n2 + n4 },
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
  const [complimentInput, setComplimentInput] = useState('');
  const [round1Attempts, setRound1Attempts] = useState(0); // 0, 1, 2 (caps at 3)
  const [round1SubmittedScore, setRound1SubmittedScore] = useState<number | null>(null);
  const [showRound1TryAnother, setShowRound1TryAnother] = useState(false);

  // ── Round 2 State ───────────────────────────────────────────────────────────
  const [memoryData, setMemoryData] = useState<{ numbers: number[]; questions: MemoryQuestion[] }>(() =>
    generateMemoryChallenge()
  );
  const [memoryPhase, setMemoryPhase] = useState<'memorize' | 'answering'>('memorize');
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

  // Round 2 countdown timer
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

  // Advance to next round when failing
  const handleFailRound = (fromRound: 1 | 2 | 3) => {
    sound.playAlert();
    const newTotalFails = totalFailedAttempts + 1;
    setTotalFailedAttempts(newTotalFails);

    if (newTotalFails >= 6) {
      return; // Will render Access Denied screen
    }

    if (fromRound === 1) {
      setShowRound1TryAnother(true);
      setTimeout(() => {
        setShowRound1TryAnother(false);
        setCurrentRound(2);
        setMemoryData(generateMemoryChallenge());
        setMemoryPhase('memorize');
        setQuestionIndex(0);
        setMemoryAnswerInput('');
        setMemoryFailMessage(null);
      }, 1600);
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
        setMemoryPhase('memorize');
        setQuestionIndex(0);
        setMemoryAnswerInput('');
        setMemoryFailMessage(null);
      }, 2000);
    }
  };

  // Round 1 Submission
  const handleRound1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    const result = evaluateHardSincerity(complimentInput);
    setRound1SubmittedScore(result.score);

    if (result.score === 100) {
      onUnlock();
    } else {
      const nextAttemptCount = round1Attempts + 1;
      setRound1Attempts(nextAttemptCount);
      sound.playAlert();

      if (nextAttemptCount >= 3) {
        handleFailRound(1);
      }
    }
  };

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
        <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200">
          <div className="text-4xl">{successPopup.emoji}</div>
          <h3 className="text-lg font-bold text-emerald-400 font-mono tracking-wide">
            {successPopup.title}
          </h3>
          <p className="text-sm text-slate-200 font-semibold">{successPopup.subtitle}</p>
          <p className="text-xs text-slate-400 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            &ldquo;{successPopup.jab}&rdquo;
          </p>
          <button
            onClick={() => {
              sound.playClick();
              onUnlock();
            }}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-lg shadow-emerald-900/40"
          >
            {successPopup.buttonText} — UNLOCK NOW
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-2">
      <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-md space-y-5">
        {/* Header with Protocol Stage & Failure Tracker */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-inner">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-200 text-xs tracking-wider uppercase font-mono">
                Admin Protocol
              </h3>
              <p className="text-[11px] text-pink-400 font-medium">
                Round {currentRound} of 3:{' '}
                {currentRound === 1
                  ? 'Are You Sincere?'
                  : currentRound === 2
                  ? 'Prove You Have a Memory'
                  : 'Reputation Rehabilitation'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Total Fails</span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {totalFailedAttempts} / 6
            </span>
          </div>
        </div>

        {/* ── Round 1: "Are You Sincere?" ───────────────────────────────────── */}
        {currentRound === 1 && (
          <div className="space-y-4">
            {showRound1TryAnother ? (
              <div className="p-6 rounded-xl bg-slate-950/90 border border-slate-700 text-center space-y-2 animate-in fade-in duration-200">
                <p className="text-sm font-bold text-slate-200 font-mono tracking-wider">
                  Try another way.
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Advancing to Round 2...
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">Compliment Subbu:</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Attempt {Math.min(3, round1Attempts + 1)} of 3
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Sincerity must hit 100% to unlock immediately.
                  </p>
                </div>

                <form onSubmit={handleRound1Submit} className="space-y-3">
                  <textarea
                    rows={3}
                    value={complimentInput}
                    onChange={(e) => setComplimentInput(e.target.value)}
                    placeholder="Express your genuine praise for Subbu..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 font-sans resize-none"
                    autoFocus
                  />

                  {round1SubmittedScore !== null && (
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                          Evaluated Sincerity:
                        </span>
                        <span className="font-mono font-bold text-xs text-pink-400">
                          ❤️ {round1SubmittedScore}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-300 rounded-full"
                          style={{ width: `${round1SubmittedScore}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 italic font-mono pt-0.5">
                        {evaluateHardSincerity(complimentInput).feedback}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold font-mono tracking-wider transition-colors cursor-pointer shadow-md shadow-rose-600/20 uppercase"
                  >
                    Submit Sincerity Evaluation
                  </button>
                </form>
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
            ) : memoryPhase === 'memorize' ? (
              <div className="space-y-4 text-center py-2">
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                  <Timer className="w-4 h-4 animate-spin" />
                  MEMORIZE THIS. You have {memorizeCountdown} sec
                </div>

                {/* Visible Animated Timer Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${(memorizeCountdown / 3) * 100}%` }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-3 py-4">
                  {memoryData.numbers.map((num, i) => (
                    <div
                      key={i}
                      className="aspect-square bg-slate-950 border border-cyan-500/40 rounded-2xl flex items-center justify-center text-2xl font-bold font-mono text-cyan-300 shadow-lg shadow-cyan-950/50"
                    >
                      {num}
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
