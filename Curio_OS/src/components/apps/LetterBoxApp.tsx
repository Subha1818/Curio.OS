import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  apiGetLetters,
  apiPostLetter,
  apiDeleteLetter,
  apiLikeLetter,
  apiUnlikeLetter,
  type LetterItem,
} from '../../api/letterboxApi';
import { LETTERBOX_HINTS } from '../../data/letterboxHints';
import { useAnimationsEnabled } from '../../utils/useAnimations';
import { sound } from '../../utils/sound';
import { LetterBoxIcon } from '../icons/LetterBoxIcon';
import { NamePopup } from '../NamePopup';
import { getNickname, setAskedName } from '../../utils/identity';
import {
  Heart,
  Share2,
  Trash2,
  Sparkles,
  Send,
  Flame,
  Clock,
  Compass,
} from 'lucide-react';

// Format timestamp into whimsical relative time
function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return 'recently';
  }
}

export const LetterBoxApp: React.FC<{ windowId: string }> = () => {
  const animationsEnabled = useAnimationsEnabled();

  const [sortMode, setSortMode] = useState<'newest' | 'top'>('newest');

  // Feed state
  const [letters, setLetters] = useState<LetterItem[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Composer state
  const [draftContent, setDraftContent] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hintIndex, setHintIndex] = useState<number>(0);

  // Identity state
  const [nickname, setNicknameState] = useState<string | null>(getNickname());
  const [showNamePopup, setShowNamePopup] = useState<boolean>(false);

  // In-app ephemeral toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Rotating hints effect
  useEffect(() => {
    sessionStorage.setItem('curio_letterbox_opened', 'true');
    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % LETTERBOX_HINTS.length);
    }, 3800);
    return () => clearInterval(interval);
  }, []);

  // Fetch feed
  const loadFeed = useCallback(async (sort: 'newest' | 'top', cursor?: number | null) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    const res = await apiGetLetters(sort, cursor, 20);

    if (res.letters) {
      if (cursor) {
        setLetters((prev) => [...prev, ...res.letters!]);
      } else {
        setLetters(res.letters);
      }
      setNextCursor(res.nextCursor ?? null);
    } else if (res.error) {
      showToast(res.error);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [showToast]);

  // Initial feed load & sort changes
  useEffect(() => {
    loadFeed(sortMode);
  }, [sortMode, loadFeed]);

  // Sync nickname if it changes elsewhere
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getNickname();
      if (current !== nickname) {
        setNicknameState(current);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nickname]);

  // Handle Like Toggle
  const handleToggleLike = async (letterId: number) => {
    const target = letters.find((l) => l.id === letterId);
    if (!target) return;

    sound.playClick();
    const willLike = !target.likedByMe;

    // Optimistic UI update
    setLetters((prev) =>
      prev.map((l) =>
        l.id === letterId
          ? {
            ...l,
            likedByMe: willLike,
            likeCount: willLike ? l.likeCount + 1 : Math.max(0, l.likeCount - 1),
          }
          : l
      )
    );

    if (willLike) {
      const res = await apiLikeLetter(letterId);
      if (res.error) {
        // Rollback
        setLetters((prev) =>
          prev.map((l) => (l.id === letterId ? { ...l, likedByMe: false, likeCount: target.likeCount } : l))
        );
        showToast(res.error);
      }
    } else {
      const res = await apiUnlikeLetter(letterId);
      if (res.error) {
        // Rollback
        setLetters((prev) =>
          prev.map((l) => (l.id === letterId ? { ...l, likedByMe: true, likeCount: target.likeCount } : l))
        );
        showToast(res.error);
      }
    }
  };

  // Handle Post Letter
  const handleSubmitLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = draftContent.trim();
    if (!trimmed) return;

    setSubmitting(true);
    sound.playClick();

    const currentName = getNickname() || undefined;
    const res = await apiPostLetter(trimmed, currentName);

    if (res.letter) {
      sound.playNotification();
      setDraftContent('');
      setLetters((prev) => [res.letter!, ...prev]);
      showToast('Letter dropped into the brain! 💌');
    } else if (res.error) {
      sound.playAlert();
      showToast(res.error);
    }

    setSubmitting(false);
  };

  // Handle Delete Letter
  const handleDeleteLetter = async (letterId: number) => {
    if (!window.confirm('Erase this thought from the letterbox?')) return;
    sound.playClick();

    const res = await apiDeleteLetter(letterId);
    if (res.success) {
      setLetters((prev) => prev.filter((l) => l.id !== letterId));
      showToast('Thought erased from the stream.');
    } else if (res.error) {
      showToast(res.error);
    }
  };

  // Handle Share / Copy Link
  const handleShareLetter = (letter: LetterItem) => {
    sound.playClick();
    const shareText = `"${letter.content}" — ${letter.username} (${letter.formattedId} on Curio.OS LetterBox)\nhttps://github.com/Subha1818/Curio.OS`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      showToast(`Copied ${letter.formattedId} to clipboard! 📋`);
    } else {
      showToast('Copied thought to clipboard!');
    }
  };

  return (
    <div className="h-full w-full bg-slate-950/95 text-slate-200 flex flex-col select-none overflow-hidden font-sans relative">
      {/* ── Toast Overlay ───────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-slate-900/95 border border-purple-500/40 text-purple-200 px-4 py-2 rounded-full text-xs font-sans font-medium shadow-2xl flex items-center gap-2 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {showNamePopup && (
        <NamePopup 
          forceShow
          onDismissForSession={() => {
            setShowNamePopup(false);
            setNicknameState(getNickname());
          }} 
          onStayAnonymous={() => {
            setShowNamePopup(false);
          }} 
        />
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="px-4 py-3.5 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md flex items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-2.5">
          <LetterBoxIcon className="w-7 h-7" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-display font-semibold text-white tracking-normal flex items-center gap-2">
                LetterBox
                <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                  Guestbook
                </span>
              </h1>
            </div>
            <p className="text-xs font-sans text-slate-400">
              Thoughts and curiosities left by visitors inside Curio.OS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-sans text-slate-400 bg-slate-950/70 border border-slate-800 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live feed</span>
        </div>
      </div>

      {/* ── Main Viewport ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 font-sans">
            {/* ── Open-Ended Composer (No Categories) ─────────────────────────── */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-900/60 border border-slate-800/90 shadow-xl backdrop-blur-md relative overflow-hidden">
              {/* Header & Rotating Hint */}
              <div className="mb-3 space-y-0.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-display font-medium text-slate-100 flex items-center gap-1.5">
                    <span>Leave a letter</span>
                  </h2>
                  <span
                    className={`text-xs font-sans ${280 - draftContent.length < 20
                        ? 'text-rose-400 font-medium'
                        : 'text-slate-400'
                      }`}
                  >
                    {280 - draftContent.length} left
                  </span>
                </div>

                {/* Rotating In-Voice Inspiration Line */}
                <div className="h-5 flex items-center overflow-hidden">
                  <p
                    key={hintIndex}
                    className={`text-xs font-sans text-purple-300/90 italic truncate ${animationsEnabled ? 'animate-in fade-in duration-500' : ''
                      }`}
                  >
                    ✦ {LETTERBOX_HINTS[hintIndex]}
                  </p>
                </div>
              </div>

              {/* Textarea Form */}
              <form onSubmit={handleSubmitLetter} className="space-y-3 font-sans">
                <textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value.slice(0, 280))}
                  placeholder="What's on your mind? Drop a thought into the stream..."
                  rows={3}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/40 resize-none font-sans transition-all"
                />

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs text-slate-400 font-sans flex items-center gap-1.5">
                    {nickname ? (
                      <span>
                        Posting as <span className="text-purple-300 font-medium">{nickname}</span>
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Posting as Mystery Visitor.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAskedName(); // So we don't double trigger
                            setShowNamePopup(true);
                          }}
                          className="text-purple-300 hover:text-purple-200 underline underline-offset-2 transition-colors cursor-pointer"
                        >
                          Set Name?
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !draftContent.trim()}
                    className={`px-4 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${submitting || !draftContent.trim()
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20 hover:scale-[1.02]'
                      }`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? 'Dropping...' : 'Drop letter'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* ── Feed Bar: Sort Toggle & Count ───────────────────────────────── */}
            <div className="flex items-center justify-between px-1 text-xs font-sans">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">
                  {letters.length} thoughts registered
                </span>
              </div>

              {/* Sort Toggle */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg text-xs font-sans">
                <button
                  onClick={() => {
                    sound.playClick();
                    setSortMode('newest');
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${sortMode === 'newest'
                      ? 'bg-purple-500/20 text-purple-200 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  Newest
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setSortMode('top');
                  }}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 ${sortMode === 'top'
                      ? 'bg-purple-500/20 text-purple-200 font-medium'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  <Flame className="w-3 h-3 text-amber-400" />
                  Most Liked
                </button>
              </div>
            </div>

            {/* ── Feed Stream ─────────────────────────────────────────────────── */}
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 space-y-3 font-sans">
                <div className="w-8 h-8 rounded-full border-2 border-purple-500/40 border-t-purple-400 animate-spin" />
                <p className="text-xs font-sans text-slate-400 animate-pulse">
                  Tuning into thoughts stream...
                </p>
              </div>
            ) : letters.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center space-y-3 font-sans">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-purple-400">
                  <Compass className="w-7 h-7" />
                </div>
                <h3 className="text-base font-display font-medium text-slate-200">The stream is quiet.</h3>
                <p className="text-xs font-sans text-slate-400 max-w-sm">
                  Be the first visitor. Drop a letter, greeting, idea, or thought above.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pb-2 font-sans">
                {letters.map((letter, index) => (
                  <div
                    key={letter.id}
                    style={{
                      animationDelay: animationsEnabled ? `${index * 50}ms` : '0ms',
                    }}
                    className={`group relative p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-purple-500/35 shadow-md hover:shadow-xl hover:shadow-purple-500/5 flex flex-col justify-between transition-all duration-300 ${animationsEnabled
                        ? 'animate-in fade-in slide-in-from-bottom-2 duration-500 hover:-translate-y-1'
                        : ''
                      }`}
                  >
                    {/* Top Row: #047 + Delete (if author/admin) */}
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
                      <div className="flex items-center gap-1.5 text-purple-300 font-mono font-medium">
                        <span>🧠</span>
                        <span>{letter.formattedId}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-sans">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatRelativeTime(letter.createdAt)}
                        </span>

                        {letter.canDelete && (
                          <button
                            onClick={() => handleDeleteLetter(letter.id)}
                            title="Erase letter"
                            className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content: Rendered strictly as plain text */}
                    <p className="text-xs text-slate-200 leading-relaxed font-sans select-text whitespace-pre-wrap mb-4 flex-1">
                      &ldquo;{letter.content}&rdquo;
                    </p>

                    {/* Footer: Author, Rank Badge & Actions */}
                    <div className="pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs font-sans">
                      {/* Author + Rank */}
                      <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                        <span className="text-slate-300 font-medium truncate">
                          — {letter.username}
                        </span>
                        <span
                          title={`${letter.authorRank.likesReceived} community likes received`}
                          className="text-xs font-sans px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 shrink-0 cursor-default"
                        >
                          {letter.authorRank.badge}
                        </span>
                      </div>

                      {/* Action buttons: Heart & Share */}
                      <div className="flex items-center gap-2 font-sans">
                        {/* Like Button */}
                        <button
                          onClick={() => handleToggleLike(letter.id)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-sans transition-all cursor-pointer ${letter.likedByMe
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                              : 'bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/40'
                            }`}
                        >
                          <Heart
                            className={`w-3.5 h-3.5 transition-transform ${letter.likedByMe
                                ? 'fill-rose-500 text-rose-500 scale-110'
                                : 'hover:scale-110'
                              }`}
                          />
                          <span>{letter.likeCount}</span>
                        </button>

                        {/* Share Button */}
                        <button
                          onClick={() => handleShareLetter(letter)}
                          title="Copy thought to clipboard"
                          className="p-1 rounded-full text-slate-400 hover:text-purple-300 hover:bg-slate-800/60 transition-colors cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination: Load More */}
            {nextCursor && !loading && (
              <div className="text-center pt-2 pb-4 font-sans">
                <button
                  onClick={() => loadFeed(sortMode, nextCursor)}
                  disabled={loadingMore}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/40 text-xs font-sans text-slate-300 hover:text-purple-200 transition-colors shadow-sm cursor-pointer"
                >
                  {loadingMore ? 'Fetching more thoughts...' : 'Load more thoughts ↓'}
                </button>
              </div>
            )}
      </div>
    </div>
  );
};
