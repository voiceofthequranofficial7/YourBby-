import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Music, Plus, Sparkles, Send } from 'lucide-react';

export const NotesBubbleRow: React.FC = () => {
  const { notes, currentUser, createNote } = useApp();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteMusic, setNoteMusic] = useState('');

  const myNote = notes.find(n => n.author.id === currentUser?.id);
  const otherNotes = notes.filter(n => n.author.id !== currentUser?.id);

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await createNote(noteText.trim(), noteMusic.trim() || undefined);
    setNoteText('');
    setNoteMusic('');
    setIsAddingNote(false);
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 mb-4 shadow-xs">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          Status Notes
        </span>
        <span className="text-[10px] text-slate-400">24h disappearing updates</span>
      </div>

      <div className="flex items-start gap-4 overflow-x-auto no-scrollbar py-2">
        {/* User's own note / Add Note */}
        <div className="flex flex-col items-center shrink-0 w-24">
          <div
            onClick={() => setIsAddingNote(true)}
            className="relative cursor-pointer group flex flex-col items-center"
          >
            {/* Note thought bubble */}
            <div className="mb-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 group-hover:bg-rose-50 dark:group-hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-medium text-slate-700 dark:text-slate-200 max-w-[90px] truncate text-center shadow-xs transition-colors">
              {myNote ? myNote.text : (
                <span className="text-slate-400 flex items-center justify-center gap-1">
                  <Plus className="w-3 h-3 text-rose-500" /> Share note
                </span>
              )}
            </div>

            <div className="relative">
              <img
                src={currentUser?.avatar || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f43f5e"/><stop offset="100%" stop-color="%236366f1"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(%23g)"/><text x="50" y="58" font-size="36" font-weight="bold" fill="white" text-anchor="middle" font-family="sans-serif">${encodeURIComponent(currentUser?.displayName?.[0] || 'U')}</text></svg>`}
                alt="My Note"
                className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-rose-500 transition-all"
              />
              {!myNote && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                  +
                </div>
              )}
            </div>
          </div>
          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mt-1 truncate">
            Your Note
          </span>
        </div>

        {/* Other friends' notes */}
        {otherNotes.map((note) => (
          <div key={note.id} className="flex flex-col items-center shrink-0 w-24">
            <div className="mb-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-medium text-slate-800 dark:text-slate-200 max-w-[96px] truncate text-center shadow-xs">
              {note.text}
            </div>
            <div className="relative">
              <img
                src={note.author.avatar}
                alt={note.author.displayName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-400/40"
              />
              {note.musicSnippet && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[9px] shadow-xs" title={note.musicSnippet}>
                  <Music className="w-2.5 h-2.5" />
                </div>
              )}
            </div>
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 mt-1 truncate">
              {note.author.displayName.split(' ')[0]}
            </span>
          </div>
        ))}
      </div>

      {/* Add note modal inline */}
      {isAddingNote && (
        <form onSubmit={handleSaveNote} className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Share a thought (e.g. Chai break ☕)..."
            maxLength={60}
            className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-transparent focus:border-rose-500 focus:outline-none"
            autoFocus
          />
          <input
            type="text"
            value={noteMusic}
            onChange={(e) => setNoteMusic(e.target.value)}
            placeholder="Music tag (optional)"
            className="hidden sm:block w-36 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs rounded-xl border border-transparent focus:border-rose-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm"
          >
            <Send className="w-3 h-3" /> Save
          </button>
          <button
            type="button"
            onClick={() => setIsAddingNote(false)}
            className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  );
};
