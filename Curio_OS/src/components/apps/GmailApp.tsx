import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { MessagesSquare, Send, CheckCircle2, AlertCircle, Clock, RefreshCw, User, AtSign, Tag, Lock } from 'lucide-react';
import { sound } from '../../utils/sound';

interface GmailAppProps {
  windowId: string;
}

const SUBBU_EMAIL = 'subhajitpatra1818@gmail.com';
const MAX_CHARS = 2000;
const RATE_LIMIT_SECONDS = 60;
const LAST_SENT_KEY = 'curio_gmail_last_sent';

const MOCHI_TIPS = [
  "Don't forget your name, so Subbu knows who's being this charming. 🐾",
  "Short and sweet works. So does long and chaotic. ✨",
  "I won't read it. Probably. 🐱",
  "Say something nice! He works hard on this OS. 🌸",
  "Got a cool project or idea? Subbu loves building things. 💻",
];

export const GmailApp: React.FC<GmailAppProps> = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState("Let's connect");
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isPlaneFlying, setIsPlaneFlying] = useState(false);

  // Field validation states & inline error
  const [fieldErrors, setFieldErrors] = useState<{
    name?: boolean;
    email?: boolean;
    message?: boolean;
  }>({});
  const [validationTip, setValidationTip] = useState<string | null>(null);

  // Rate limit countdown
  const [cooldown, setCooldown] = useState<number>(0);
  const cooldownTimerRef = useRef<number | null>(null);

  // Mochi speech bubble
  const [mochiTipIdx, setMochiTipIdx] = useState(0);
  const [mochiMood, setMochiMood] = useState<'idle' | 'happy' | 'thinking'>('idle');

  // Check rate limit on mount and run timer
  useEffect(() => {
    const checkRateLimit = () => {
      const lastSent = localStorage.getItem(LAST_SENT_KEY);
      if (lastSent) {
        const elapsed = Math.floor((Date.now() - Number(lastSent)) / 1000);
        const remaining = RATE_LIMIT_SECONDS - elapsed;
        if (remaining > 0) {
          setCooldown(remaining);
        } else {
          setCooldown(0);
        }
      }
    };

    checkRateLimit();
    cooldownTimerRef.current = window.setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  // Periodic Mochi tip rotation
  useEffect(() => {
    const tipInterval = window.setInterval(() => {
      setMochiTipIdx((prev) => (prev + 1) % MOCHI_TIPS.length);
    }, 11000);
    return () => clearInterval(tipInterval);
  }, []);

  const isValidEmail = (addr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr.trim());
  };

  const handleMochiPoke = () => {
    sound.playChime();
    setMochiMood('happy');
    setMochiTipIdx((prev) => (prev + 1) % MOCHI_TIPS.length);
    setTimeout(() => setMochiMood('idle'), 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending || cooldown > 0) return;

    // Spam honeypot detection
    if (honeypot.trim() !== '') {
      setIsSent(true);
      return;
    }

    // Validation checks with per-field feedback and playful voice
    if (!name.trim()) {
      setFieldErrors({ name: true });
      setValidationTip("Looks like you forgot to tell me who you are 👀");
      sound.playAlert();
      return;
    }

    if (!email.trim() || !isValidEmail(email)) {
      setFieldErrors({ email: true });
      setValidationTip("Subbu will need a real email to write you back! 📬");
      sound.playAlert();
      return;
    }

    if (!message.trim()) {
      setFieldErrors({ message: true });
      setValidationTip("An empty letter? Don't be shy, say hi! ✨");
      sound.playAlert();
      return;
    }

    // Clear validation issues
    setFieldErrors({});
    setValidationTip(null);
    setIsPlaneFlying(true);
    setIsSending(true);
    sound.playClick();

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_vanxewj';
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_lxnsuml';
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'P_lFzHqGWDhysQjRW';

    // Map template parameters
    const templateParams: Record<string, string> = {
      user_name: name.trim(),
      user_email: email.trim(),
      message: message.trim(),
      subject: subject.trim() || "Let's connect",
      from_name: name.trim(),
      from_email: email.trim(),
      reply_to: email.trim(),
      name: name.trim(),
      email: email.trim(),
    };

    try {
      await emailjs.send(serviceId, templateId, templateParams, publicKey);

      // Record rate limit timestamp
      localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
      setCooldown(RATE_LIMIT_SECONDS);

      sound.playSuccess();
      setTimeout(() => {
        setIsSent(true);
        setIsPlaneFlying(false);
      }, 500);
    } catch (err: unknown) {
      console.error('Email send error:', err);
      setIsPlaneFlying(false);
      const msg =
        err && typeof err === 'object' && 'text' in err
          ? String((err as { text: unknown }).text)
          : 'Failed to dispatch letter. Please verify your connection or write directly to subhajitpatra1818@gmail.com.';
      setValidationTip(msg);
      sound.playAlert();
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    sound.playClick();
    setName('');
    setEmail('');
    setSubject("Let's connect");
    setMessage('');
    setFieldErrors({});
    setValidationTip(null);
    setIsSent(false);
    setIsPlaneFlying(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/95 text-slate-100 font-sans select-none overflow-hidden relative">
      {/* Subtle Connection Watermark Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025] bg-[radial-gradient(#4ade80_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full border border-dashed border-emerald-500/40 pointer-events-none opacity-[0.035] -rotate-12 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full border border-emerald-500/40 flex items-center justify-center font-mono text-[9px] uppercase tracking-widest text-emerald-400">
          Curio Connect
        </div>
      </div>

      {/* Header / Sub-Toolbar */}
      <div className="px-5 py-3 border-b border-white/10 bg-slate-900/60 backdrop-blur-md flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.3)]">
            <MessagesSquare className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-white flex items-center gap-2 font-clash">
              Let's Connect
            </h2>
            <p className="text-[11px] text-slate-400">Direct transmission to Subbu's inbox</p>
          </div>
        </div>

        {/* In-Universe Mochi Watching Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/25 text-[11px] font-mono text-purple-300">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse shadow-[0_0_6px_rgba(244,114,182,0.8)]" />
          <span>Mochi is watching 🐾</span>
        </div>
      </div>

      {/* Main Mail Content View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 relative z-10">
        {isSent ? (
          /* Success Screen in DREAM.OS / Curio.OS voice */
          <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)] animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="max-w-md space-y-1.5">
              <h3 className="text-xl font-bold text-white font-clash">Message Dispatched!</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                Sent! Subbu will see this when he resurfaces from whatever he's debugging. 💌
              </p>
              <p className="text-xs text-slate-500 font-mono pt-1">
                Delivered straight to {SUBBU_EMAIL}
              </p>
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-xs font-medium text-slate-200 hover:text-white transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                Send another message
              </button>
            </div>
          </div>
        ) : (
          /* Compose Form */
          <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
            {/* Honeypot hidden input for anti-spam */}
            <input
              type="text"
              name="website_honey"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              className="hidden"
              aria-hidden="true"
            />

            {/* ── 1. Locked "To" Recipient Row (Visually Distinct & Static) ── */}
            <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-slate-400 select-none">
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
                  <Lock className="w-3 h-3 text-slate-500" />
                  To:
                </span>
                <div className="flex items-center gap-2 px-2.5 py-0.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-200 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                  <span className="font-medium text-slate-100">{SUBBU_EMAIL}</span>
                  <span className="text-[10px] text-slate-500 ml-0.5">(Subhajit Patra)</span>
                </div>
              </div>

            </div>

            {/* Visual separator between static To and real inputs */}
            <div className="border-t border-white/5 my-2" />

            {/* ── 2. Editable Sender Inputs (From Name & Email) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* From Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-400">
                  Your name <span className="text-pink-400">*</span>
                </label>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border transition-all ${fieldErrors.name
                    ? 'animate-field-shake border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5'
                    : 'border-white/15 hover:border-white/25 focus-within:border-pink-400/80 focus-within:ring-2 focus-within:ring-pink-400/20 focus-within:shadow-[0_0_12px_rgba(244,114,182,0.15)]'
                    }`}
                >
                  <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) {
                        setFieldErrors((prev) => ({ ...prev, name: false }));
                        setValidationTip(null);
                      }
                    }}
                    placeholder="e.g. Alex Hunter"
                    className="w-full bg-transparent text-white font-medium placeholder:text-slate-500/60 placeholder:font-normal placeholder:italic text-xs focus:outline-none"
                    disabled={isSending}
                  />
                </div>
              </div>

              {/* From Email */}
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-400">
                  Your email <span className="text-pink-400">*</span>
                </label>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border transition-all ${fieldErrors.email
                    ? 'animate-field-shake border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5'
                    : 'border-white/15 hover:border-white/25 focus-within:border-pink-400/80 focus-within:ring-2 focus-within:ring-pink-400/20 focus-within:shadow-[0_0_12px_rgba(244,114,182,0.15)]'
                    }`}
                >
                  <AtSign className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: false }));
                        setValidationTip(null);
                      }
                    }}
                    placeholder="your.email@domain.com"
                    className="w-full bg-transparent text-white font-medium placeholder:text-slate-500/60 placeholder:font-normal placeholder:italic text-xs focus:outline-none font-mono"
                    disabled={isSending}
                  />
                </div>
              </div>
            </div>

            {/* ── 3. Subject Field ── */}
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-slate-400">
                Subject
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/60 border border-white/15 hover:border-white/25 focus-within:border-pink-400/80 focus-within:ring-2 focus-within:ring-pink-400/20 focus-within:shadow-[0_0_12px_rgba(244,114,182,0.15)] transition-all">
                <Tag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Let's connect"
                  className="w-full bg-transparent text-white font-medium placeholder:text-slate-500/60 placeholder:font-normal placeholder:italic text-xs focus:outline-none"
                  disabled={isSending}
                />
              </div>
            </div>

            {/* ── 4. Message Body Field ── */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-medium text-slate-400">
                  Message <span className="text-pink-400">*</span>
                </label>
                <span className={`font-mono text-[10px] ${message.length >= MAX_CHARS - 100 ? 'text-amber-400' : 'text-slate-500'}`}>
                  {message.length} / {MAX_CHARS}
                </span>
              </div>
              <div
                className={`relative rounded-2xl bg-slate-900/60 border transition-all overflow-hidden ${fieldErrors.message
                  ? 'animate-field-shake border-rose-500/80 ring-1 ring-rose-500/40 bg-rose-500/5'
                  : 'border-white/15 hover:border-white/25 focus-within:border-pink-400/80 focus-within:ring-2 focus-within:ring-pink-400/20 focus-within:shadow-[0_0_12px_rgba(244,114,182,0.15)]'
                  }`}
              >
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value.slice(0, MAX_CHARS));
                    if (fieldErrors.message) {
                      setFieldErrors((prev) => ({ ...prev, message: false }));
                      setValidationTip(null);
                    }
                  }}
                  rows={7}
                  placeholder="Hey Subbu! Loved exploring your Curio.OS portfolio. Wanted to discuss..."
                  className="w-full p-4 bg-transparent text-slate-100 placeholder:text-slate-500/60 placeholder:font-normal placeholder:italic text-xs leading-relaxed focus:outline-none resize-none custom-scrollbar"
                  disabled={isSending}
                />
              </div>
            </div>

            {/* ── 5. Mochi In-Window Companion Tip ── */}
            <div className="flex items-center gap-2.5 py-1">
              <div
                onClick={handleMochiPoke}
                className="relative w-8 h-8 rounded-full bg-amber-500/15 border border-amber-400/30 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-90 transition-transform shadow-sm group shrink-0"
                title="Click Mochi for a tip!"
              >
                {/* Mini Mochi SVG Avatar */}
                <svg viewBox="0 0 40 40" className={`w-6 h-6 transition-transform ${mochiMood === 'happy' ? 'animate-bounce' : ''}`}>
                  <circle cx="20" cy="20" r="15" fill="#fed7aa" />
                  <polygon points="12,12 8,2 18,8" fill="#fb923c" />
                  <polygon points="11,10 9,4 16,8" fill="#fda4af" />
                  <polygon points="28,12 32,2 22,8" fill="#78350f" />
                  <polygon points="29,10 31,4 24,8" fill="#fda4af" />
                  {mochiMood === 'happy' ? (
                    <>
                      <path d="M13 18 Q16 15 18 18" fill="none" stroke="#431407" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M22 18 Q24 15 27 18" fill="none" stroke="#431407" strokeWidth="1.5" strokeLinecap="round" />
                    </>
                  ) : (
                    <>
                      <circle cx="15" cy="18" r="1.8" fill="#431407" />
                      <circle cx="25" cy="18" r="1.8" fill="#431407" />
                    </>
                  )}
                  <ellipse cx="20" cy="22" rx="1.5" ry="1" fill="#f43f5e" />
                  <path d="M18 24 Q20 26 22 24" fill="none" stroke="#431407" strokeWidth="1" strokeLinecap="round" />
                </svg>
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />
              </div>

              {/* Mochi Speech Bubble */}
              <div className="relative px-3 py-1.5 rounded-xl bg-slate-900/80 border border-purple-500/20 text-[11px] text-purple-200/90 shadow-sm flex items-center gap-1.5 animate-fadeIn">

                <span>{MOCHI_TIPS[mochiTipIdx]}</span>
              </div>
            </div>

            {/* ── 6. Bottom Action Bar (Inline Validation & Rate-Limited Send Area) ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              {/* Inline Validation Feedback */}
              <div className="min-h-[20px] flex items-center">
                {validationTip && (
                  <div className="flex items-center gap-1.5 text-xs text-rose-300 font-mono animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>{validationTip}</span>
                  </div>
                )}
              </div>

              {/* Send Area (Button or In-Voice Rate Limit) */}
              <div className="w-full sm:w-auto flex justify-end">
                {cooldown > 0 ? (
                  /* Rate limit folded cleanly into send position */
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs font-mono text-amber-300 shadow-inner select-none animate-fadeIn">
                    <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                    <span>Give it a moment — one message at a time. ({cooldown}s)</span>
                  </div>
                ) : (
                  /* Active Send Button with airplane micro-interaction */
                  <button
                    type="submit"
                    disabled={isSending}
                    className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-xs text-white bg-[#EA4335] hover:bg-[#d6382a] active:scale-95 border border-red-400/50 shadow-[0_0_18px_rgba(234,67,53,0.45)] hover:shadow-[0_0_24px_rgba(234,67,53,0.6)] transition-all cursor-pointer"
                  >
                    {isSending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Dispatching...</span>
                      </>
                    ) : (
                      <>
                        <span>Send</span>
                        <Send
                          className={`w-3.5 h-3.5 text-white transition-transform ${isPlaneFlying ? 'animate-plane-fly' : 'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
                            }`}
                        />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
