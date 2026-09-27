import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Pin,
  Sparkles,
  Tag,
  Search,
  Edit2,
  Check,
  X,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { sound } from '../../utils/sound';
import { useAuth } from '../../context/AuthContext';
import {
  apiGetNotes,
  apiCreateNote,
  apiUpdateNote,
  apiDeleteNote,
  type BackendNote,
} from '../../api/authApi';

interface LocalNote {
  id: string;
  content: string;
  tag: string;
  pinned: boolean;
  date: string;
}

const DEFAULT_GUEST_NOTES: LocalNote[] = [
  {
    id: 'local-1',
    content: 'Curio.OS architecture: build something that feels alive and whimsical. ✨',
    tag: 'Whimsy',
    pinned: true,
    date: 'Today, 10:14 AM',
  },
  {
    id: 'local-2',
    content: 'SIH hackathon presentation notes: keep it punchy and highlight the glassmorphic aesthetics.',
    tag: 'Priority',
    pinned: false,
    date: 'Yesterday',
  },
  {
    id: 'local-3',
    content: 'Life is too short to build generic SaaS dashboards.',
    tag: 'Ideas',
    pinned: false,
    date: 'Sep 24',
  },
];

const PRESET_TAGS = ['Ideas', 'Priority', 'Whimsy', 'Code', 'Personal'];

export const NotesApp: React.FC<{ windowId: string }> = () => {
  useEffect(() => {
    sessionStorage.setItem('curio_notes_opened', 'true');
    window.dispatchEvent(new Event('curio_activity_updated'));
  }, []);

  const { isLoggedIn, user } = useAuth();

  // State
  const [notes, setNotes] = useState<BackendNote[]>([]);
  const [guestNotes, setGuestNotes] = useState<LocalNote[]>(DEFAULT_GUEST_NOTES);
  const [loading, setLoading] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form inputs
  const [input, setInput] = useState('');
  const [selectedTag, setSelectedTag] = useState('Ideas');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);

  // In-place editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTag, setEditTag] = useState('');

  // ── Fetch Notes from Backend (if Logged In) ─────────────────────────────────
  const fetchNotes = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiGetNotes();
      if (res.notes) {
        setNotes(res.notes);
      } else if (res.error) {
        setError(res.error);
      }
    } catch {
      setError('Failed to reach Curio notes server.');
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotes();
    }
  }, [isLoggedIn, fetchNotes]);

  // ── Create Note ─────────────────────────────────────────────────────────────
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sound.playClick();

    if (isLoggedIn) {
      setSyncing(true);
      const res = await apiCreateNote(input.trim(), false, [selectedTag]);
      setSyncing(false);
      if (res.note) {
        setNotes((prev) => [res.note!, ...prev]);
        setInput('');
        sound.playNotification();
      } else {
        setError(res.error ?? 'Failed to save note');
      }
    } else {
      // Local Guest Note
      const newNote: LocalNote = {
        id: `guest-${Date.now()}`,
        content: input.trim(),
        tag: selectedTag,
        pinned: false,
        date: 'Just now',
      };
      setGuestNotes([newNote, ...guestNotes]);
      setInput('');
      sound.playNotification();
    }
  };

  // ── Toggle Pin ──────────────────────────────────────────────────────────────
  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    sound.playClick();
    if (isLoggedIn) {
      const nextPinned = !currentPinned;
      setNotes((prev) =>
        prev
          .map((n) => (n.id === id ? { ...n, pinned: nextPinned } : n))
          .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
      );
      await apiUpdateNote(id, { pinned: nextPinned });
    } else {
      setGuestNotes((prev) =>
        prev
          .map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
          .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
      );
    }
  };

  // ── Delete Note ─────────────────────────────────────────────────────────────
  const handleDeleteNote = async (id: string) => {
    sound.playClick();
    if (isLoggedIn) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      await apiDeleteNote(id);
    } else {
      setGuestNotes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  // ── Start In-place Editing ──────────────────────────────────────────────────
  const startEditing = (id: string, currentContent: string, currentTag: string) => {
    sound.playClick();
    setEditingId(id);
    setEditContent(currentContent);
    setEditTag(currentTag);
  };

  // ── Save Edited Note ────────────────────────────────────────────────────────
  const saveEditing = async (id: string) => {
    if (!editContent.trim()) return;
    sound.playClick();

    if (isLoggedIn) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, content: editContent.trim(), tags: [editTag] } : n
        )
      );
      setEditingId(null);
      await apiUpdateNote(id, { content: editContent.trim(), tags: [editTag] });
    } else {
      setGuestNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, content: editContent.trim(), tag: editTag } : n
        )
      );
      setEditingId(null);
    }
  };

  // ── Normalized Filtered Notes ───────────────────────────────────────────────
  const activeNotesList = useMemo(() => {
    const rawList = isLoggedIn
      ? notes.map((n) => ({
          id: n.id,
          content: n.content,
          tag: n.tags && n.tags.length > 0 ? n.tags[0] : 'General',
          pinned: n.pinned,
          date: new Date(n.created_at).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        }))
      : guestNotes;

    return rawList.filter((note) => {
      const matchesSearch =
        !searchQuery.trim() ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        note.tag.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchesTag = !filterTag || note.tag.toLowerCase() === filterTag.toLowerCase();

      return matchesSearch && matchesTag;
    });
  }, [isLoggedIn, notes, guestNotes, searchQuery, filterTag]);

  return (
    <div className="h-full w-full bg-slate-950/95 text-slate-200 flex flex-col p-4 select-none text-sm font-sans">
      {/* ── Guest Warning / Nudge Banner ────────────────────────────────────── */}
      {!isLoggedIn ? (
        <div className="mb-3 p-2.5 rounded-xl bg-pink-950/40 border border-pink-500/30 flex items-center justify-between text-xs text-pink-200">
          <div className="flex items-center gap-2">
            <CloudOff className="w-4 h-4 text-pink-400 shrink-0" />
            <span>
              Browsing as <strong>guest</strong>. Notes stored in local session.
            </span>
          </div>
          <span className="text-[11px] font-mono text-amber-300 bg-black/40 px-2 py-0.5 rounded border border-amber-400/20">
            Run login in Terminal to sync
          </span>
        </div>
      ) : (
        <div className="mb-3 p-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Cloud className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">
              Cloud Sync: <span className="text-emerald-400 font-medium">Active</span> (cutie@{user?.username})
            </span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              fetchNotes();
            }}
            title="Refresh notes from Neon DB"
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-pink-400' : ''}`} />
          </button>
        </div>
      )}

      {/* ── Note Composer ───────────────────────────────────────────────────── */}
      <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md mb-3.5 shadow-lg">
        <form onSubmit={handleAddNote} className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-pink-400 font-bold flex items-center gap-1.5 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" /> BRAIN.EXE
            </span>
            <span className="text-[11px] text-slate-400">What&apos;s on your mind?</span>
          </div>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Jot down a fleeting thought, secret idea, or code reminder..."
            rows={2}
            className="w-full bg-slate-950/80 border border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 resize-none font-sans"
          />

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 flex-wrap">
              {PRESET_TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  onClick={() => {
                    sound.playClick();
                    setSelectedTag(tag);
                  }}
                  className={`text-[10px] px-2 py-0.5 rounded-full transition-all ${
                    selectedTag === tag
                      ? 'bg-pink-500/25 text-pink-300 border border-pink-500/40 font-semibold'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={!input.trim() || syncing}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-lg text-xs font-semibold shadow-md hover:opacity-95 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {syncing ? 'Saving...' : 'Save Thought'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Search & Filter Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 mb-2 px-1">
        {/* Search */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg text-xs text-slate-300 flex-1 max-w-xs focus-within:border-pink-500/50">
          <Search className="w-3 h-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search thoughts..."
            className="bg-transparent border-none outline-none text-[11px] text-slate-200 placeholder-slate-500 w-full"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-500 hover:text-slate-300">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Tag Filter Pills */}
        <div className="flex items-center gap-1 text-[10px] overflow-x-auto">
          {filterTag && (
            <button
              onClick={() => setFilterTag(null)}
              className="text-pink-400 hover:underline flex items-center gap-0.5"
            >
              Clear tag filter
            </button>
          )}
        </div>
      </div>

      {/* ── Notes Stream ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
          <span>Notes Feed ({activeNotesList.length})</span>
          {error && <span className="text-rose-400 lowercase">{error}</span>}
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs font-mono animate-pulse">
            Retrieving encrypted notes from Neon DB...
          </div>
        ) : activeNotesList.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            {searchQuery || filterTag
              ? 'No matching notes found. Try adjusting your search query.'
              : 'No thoughts recorded yet. Free your mind! 💡'}
          </div>
        ) : (
          activeNotesList.map((note) => {
            const isEditing = editingId === note.id;

            return (
              <div
                key={note.id}
                className={`p-3.5 rounded-xl border transition-all relative group ${
                  note.pinned
                    ? 'bg-indigo-950/30 border-indigo-500/40 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800/70 hover:border-slate-700'
                }`}
              >
                {/* Header row: Tag & Actions */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setFilterTag(filterTag === note.tag ? null : note.tag)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono flex items-center gap-1 hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      <Tag className="w-2.5 h-2.5 text-pink-400" />
                      #{note.tag}
                    </button>
                    {note.pinned && (
                      <span className="text-[10px] text-amber-400 font-medium flex items-center gap-0.5">
                        <Pin className="w-2.5 h-2.5 fill-amber-400" /> Pinned
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Toggle Pin button */}
                    <button
                      onClick={() => handleTogglePin(note.id, note.pinned)}
                      title={note.pinned ? 'Unpin note' : 'Pin note to top'}
                      className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                        note.pinned
                          ? 'text-amber-400 bg-amber-400/10'
                          : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'fill-amber-400' : ''}`} />
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => startEditing(note.id, note.content, note.tag)}
                      title="Edit note"
                      className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      title="Delete note"
                      className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content body / Edit mode */}
                {isEditing ? (
                  <div className="space-y-2 mt-1">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full bg-slate-950 border border-pink-500/60 rounded-lg p-2 text-xs text-slate-100 focus:outline-none resize-none font-sans"
                      rows={2}
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {PRESET_TAGS.map((t) => (
                          <button
                            type="button"
                            key={t}
                            onClick={() => setEditTag(t)}
                            className={`text-[9px] px-1.5 py-0.5 rounded ${
                              editTag === t ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEditing(note.id)}
                          className="px-2.5 py-1 text-[11px] bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Save
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap select-text">
                    {note.content}
                  </p>
                )}

                {/* Footer timestamp */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-1 border-t border-slate-800/40 font-mono">
                  <span>{note.date}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
