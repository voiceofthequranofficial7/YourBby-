import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Plus } from 'lucide-react';

export const StoriesBar: React.FC = () => {
  const {
    stories,
    currentUser,
    setActiveStoryIndex,
    openCreateModal,
  } = useApp();

  return (
    <div className="w-full bg-white dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 mb-4 shadow-xs">
      <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-1">
        {/* Add Story Button Tile */}
        <div className="flex flex-col items-center shrink-0 cursor-pointer group" onClick={() => openCreateModal('story')}>
          <div className="relative w-15 h-15 rounded-full p-[2px] ring-2 ring-dashed ring-rose-400/50 group-hover:ring-rose-500 transition-all flex items-center justify-center">
            <img
              src={currentUser?.avatar || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f43f5e"/><stop offset="100%" stop-color="%236366f1"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(%23g)"/><text x="50" y="58" font-size="36" font-weight="bold" fill="white" text-anchor="middle" font-family="sans-serif">${encodeURIComponent(currentUser?.displayName?.[0] || 'U')}</text></svg>`}
              alt="My Story"
              className="w-full h-full rounded-full object-cover"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-1.5 truncate w-16 text-center">
            Your Story
          </span>
        </div>

        {/* Stories from following/friends */}
        {stories.map((story, index) => {
          const isSeen = story.seen;
          return (
            <div
              key={story.id}
              onClick={() => setActiveStoryIndex(index)}
              className="flex flex-col items-center shrink-0 cursor-pointer group"
            >
              <div
                className={`w-15 h-15 rounded-full p-[2.5px] transition-transform group-hover:scale-105 ${
                  isSeen
                    ? 'ring-2 ring-slate-300 dark:ring-slate-700'
                    : 'bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 shadow-sm shadow-rose-500/20'
                }`}
              >
                <div className="w-full h-full rounded-full p-[2px] bg-white dark:bg-slate-900">
                  <img
                    src={story.author.avatar}
                    alt={story.author.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 mt-1.5 truncate w-16 text-center">
                {story.author.displayName.split(' ')[0]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
