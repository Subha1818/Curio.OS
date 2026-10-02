import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { Mail, Send, CheckCircle2, AlertCircle, Clock, RefreshCw, Sparkles, User, AtSign, Tag } from 'lucide-react';
import { sound } from '../../utils/sound';

interface GmailAppProps {
  windowId: string;
}

const SUBBU_EMAIL = 'subhajitpatra1818@gmail.com';
const MAX_CHARS = 2000;
const RATE_LIMIT_SECONDS = 60;
const LAST_SENT_KEY = 'curio_gmail_last_sent';

export const GmailApp: React.FC<GmailAppProps> = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState("Let's connect");
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rate limit countdown
  const [cooldown, setCooldown] = useState<number>(0);
  const cooldownTimerRef = useRef<number | null>(null);

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

  const isValidEmail = (addr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending || cooldown > 0) return;

    // Spam honeypot detection
    if (honeypot.trim() !== '') {
      // Fake success for bots silently
      setIsSent(true);
      return;
    }

    // Validation
    if (!name.trim()) {
      setErrorMessage('Please tell Subbu your name or alias.');
      return;
    }

    if (!email.trim() || !isValidEmail(email)) {
      setErrorMessage('Please enter a valid email address so Subbu can reply.');
      return;
    }

    if (!message.trim()) {
      setErrorMessage('Please type a message before sending.');
      return;
    }

    setErrorMessage(null);
    setIsSending(true);
    sound.playClick();

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_vanxewj';
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_lxnsuml';
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'P_lFzHqGWDhysQjRW';

    // Map exact template variable names: user_name, user_email, message + safe fallbacks
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
      setIsSent(true);
    } catch (err: unknown) {
      console.error('EmailJS send error:', err);
      const msg =
        err && typeof err === 'object' && 'text' in err
          ? String((err as { text: unknown }).text)
          : 'Failed to send dispatch. Please verify your connection or email subhajitpatra1818@gmail.com directly.';
      setErrorMessage(msg);
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
    setErrorMessage(null);
    setIsSent(false);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950/95 text-slate-100 font-sans select-none overflow-hidden">
      {/* Mail Client Header / Sub-Toolbar */}
      <div className="px-5 py-3 border-b border-white/10 bg-slate-900/60 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EA4335]/20 border border-[#EA4335]/40 flex items-center justify-center text-[#EA4335] shadow-[0_0_12px_rgba(234,67,53,0.3)]">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-wide text-white flex items-center gap-1.5 font-clash">
              New Message
              <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-[#EA4335]/15 text-[#EA4335] border border-[#EA4335]/30">
                EmailJS
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Direct transmission to Subbu's inbox</p>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span>smtp-ready</span>
        </div>
      </div>

      {/* Main Mail Content View */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
        {isSent ? (
          /* Success Screen in DREAM.OS voice */
          <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="max-w-md space-y-1.5">
              <h3 className="text-lg font-bold text-white font-clash">Sent!</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Subbu will see this when he resurfaces from whatever he's debugging. 💌
              </p>
              <p className="text-xs text-slate-500 font-mono mt-1">Delivered via EmailJS to {SUBBU_EMAIL}</p>
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

            {/* Error Banner */}
            {errorMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/35 text-rose-200 text-xs shadow-md animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="flex-1">{errorMessage}</span>
              </div>
            )}

            {/* To Field (Pre-filled & Locked) */}
            <div className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
              <span className="w-16 font-mono text-slate-400 font-medium">To:</span>
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#EA4335]/15 border border-[#EA4335]/30 text-slate-200 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA4335]" />
                <span>{SUBBU_EMAIL}</span>
                <span className="text-[10px] text-slate-400 ml-1">(Subhajit Patra)</span>
              </div>
            </div>

            {/* From Name Field */}
            <div className="flex items-center gap-3 py-1.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 focus-within:border-cyan-400/60 focus-within:ring-1 focus-within:ring-cyan-400/40 transition-all text-xs">
              <span className="w-16 font-mono text-slate-400 font-medium flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                From:
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name or Handle"
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none"
                disabled={isSending}
                required
              />
            </div>

            {/* From Email Field */}
            <div className="flex items-center gap-3 py-1.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 focus-within:border-cyan-400/60 focus-within:ring-1 focus-within:ring-cyan-400/40 transition-all text-xs">
              <span className="w-16 font-mono text-slate-400 font-medium flex items-center gap-1">
                <AtSign className="w-3.5 h-3.5 text-slate-500" />
                Email:
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@domain.com"
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none font-mono"
                disabled={isSending}
                required
              />
            </div>

            {/* Subject Field */}
            <div className="flex items-center gap-3 py-1.5 px-3 rounded-xl bg-white/[0.03] border border-white/10 focus-within:border-cyan-400/60 focus-within:ring-1 focus-within:ring-cyan-400/40 transition-all text-xs">
              <span className="w-16 font-mono text-slate-400 font-medium flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                Subject:
              </span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Let's connect"
                className="flex-1 bg-transparent text-white placeholder-slate-500 text-xs focus:outline-none"
                disabled={isSending}
              />
            </div>

            {/* Message Body Field */}
            <div className="space-y-1.5 pt-1">
              <div className="relative rounded-2xl bg-white/[0.03] border border-white/10 focus-within:border-[#EA4335]/60 focus-within:ring-1 focus-within:ring-[#EA4335]/40 transition-all overflow-hidden">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
                  rows={8}
                  placeholder="Hey Subbu! Loved checking out your Curio.OS portfolio. Wanted to talk about..."
                  className="w-full p-4 bg-transparent text-slate-100 placeholder-slate-500 text-xs leading-relaxed focus:outline-none resize-none custom-scrollbar"
                  disabled={isSending}
                  required
                />

                {/* Character Counter */}
                <div className="px-4 py-2 border-t border-white/5 bg-slate-900/40 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-[#EA4335]" />
                    <span>Real email delivery via EmailJS</span>
                  </span>
                  <span className={`font-mono text-[10px] ${message.length >= MAX_CHARS - 100 ? 'text-amber-400' : 'text-slate-500'}`}>
                    {message.length} / {MAX_CHARS}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-[11px] text-slate-500">
                {cooldown > 0 ? (
                  <span className="flex items-center gap-1.5 text-amber-400 font-mono">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    Cooldown: wait {cooldown}s to prevent spam
                  </span>
                ) : (
                  <span>Locked rate limit: 1 email / 60 seconds</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSending || cooldown > 0}
                className={`relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-xs text-white shadow-lg transition-all cursor-pointer ${
                  isSending || cooldown > 0
                    ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                    : 'bg-[#EA4335] hover:bg-[#d6382a] active:scale-95 border border-red-400/50 shadow-[0_0_18px_rgba(234,67,53,0.45)] hover:shadow-[0_0_24px_rgba(234,67,53,0.6)]'
                }`}
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Dispatching...</span>
                  </>
                ) : cooldown > 0 ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Wait {cooldown}s</span>
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
