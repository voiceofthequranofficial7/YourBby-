import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Plus, ChevronLeft, ChevronRight, Eye, Play } from 'lucide-react';

export const StoriesBar: React.FC = () => {
  const {
    stories,
    currentUser,
    setActiveStoryIndex,
    openCreateModal,
    t,
    blockedUserIds,
  } = useApp();

  const scrollRef = useRef<HTMLDivElement>(null);

  const nowMs = Date.now();
  const activeStories = stories.filter((s) => {
    const exp = new Date(s.expiresAt).getTime();
    const notExpired = Number.isNaN(exp) || exp > nowMs;
    const notBlocked = !blockedUserIds.includes(s.author.id);
    return notExpired && notBlocked;
  });

  const scrollByAmount = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -280 : 280,
      behavior: 'smooth',
    });
  };

  const fallbackAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f43f5e"/><stop offset="100%" stop-color="%236366f1"/></linearGradient></defs><rect width="200" height="200" fill="url(%23g)"/><text x="100" y="118" font-size="68" font-weight="bold" fill="white" text-anchor="middle" font-family="sans-serif">${encodeURIComponent(
    currentUser?.displayName?.[0] || 'U'
  )}</text></svg>`;

  return (
    <section
      aria-label="Stories"
      className="relative w-full bg-white dark:bg-slate-900/85 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-xs"
    >
      {/* Desktop Left/Right Scroll Affordances */}
      {activeStories.length > 2 && (
        <>
          <button
            type="button"
            onClick={() => scrollByAmount('left')}
            className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-md items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition-transform"
            aria-label="Scroll stories left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount('right')}
            className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-md items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-105 transition-transform"
            aria-label="Scroll stories right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Horizontal Portrait Story Cards Row */}
      <div
        ref={scrollRef}
        className="flex flex-row items-stretch gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
      >
        {/* 1. First Card: Create Story Portrait Card */}
        <button
          type="button"
          onClick={() => openCreateModal('story')}
          className="group relative w-[108px] sm:w-[118px] h-[186px] sm:h-[200px] shrink-0 rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex flex-col text-left shadow-xs hover:border-rose-500/50 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
        >
          {/* Upper Portrait User Photo (68% height) */}
          <div className="relative w-full h-[67%] overflow-hidden bg-slate-900">
            <img
              src={currentUser?.avatar || fallbackAvatar}
              alt={currentUser?.displayName || 'Your Profile'}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
          </div>

          {/* Floating Plus Button Overlapping the Seam */}
          <div className="absolute left-1/2 top-[67%] -translate-x-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-600 text-white ring-4 ring-white dark:ring-slate-900 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.75]" />
          </div>

          {/* Lower Label Footer (33% height) */}
          <div className="flex-1 w-full bg-white dark:bg-slate-900 pt-4 pb-2 px-2 flex items-end justify-center">
            <span className="text-[11px] sm:text-xs font-bold text-slate-900 dark:text-white text-center leading-tight line-clamp-2">
              {t('createStory')}
            </span>
          </div>
        </button>

        {/* 2. Active Portrait Story Cards */}
        {activeStories.map((story) => {
          // Find true index in full stories array so StoryViewerModal opens the exact story
          const fullIndex = stories.findIndex((s) => s.id === story.id);
          const isSeen = story.seen;
          const isMe =
            story.author.id === currentUser?.id ||
            story.author.username === currentUser?.username;

          return (
            <button
              key={story.id}
              type="button"
              onClick={() => setActiveStoryIndex(fullIndex !== -1 ? fullIndex : 0)}
              className="group relative w-[108px] sm:w-[118px] h-[186px] sm:h-[200px] shrink-0 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-900 text-left shadow-xs hover:border-rose-500/50 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              {/* Portrait Story Media Background */}
              {story.mediaType === 'video' && story.mediaUrl ? (
                <video
                  src={story.mediaUrl}
                  muted
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : story.mediaUrl ? (
                <img
                  src={story.mediaUrl}
                  alt={story.textOverlay || `${story.author.displayName}'s story`}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${
                    story.backgroundGradient || 'from-rose-500 via-purple-600 to-indigo-700'
                  } flex items-center justify-center p-3`}
                >
                  <p className="text-white text-[11px] font-bold text-center line-clamp-4 leading-snug drop-shadow-xs">
                    {story.textOverlay || 'Story'}
                  </p>
                </div>
              )}

              {/* Top & Bottom Measured Contrast Scrims */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/85 pointer-events-none" />

              {/* Top-Left Author Avatar with Seen/Unseen Ring */}
              <div
                className={`absolute top-2.5 left-2.5 z-10 w-9 h-9 rounded-full p-[2px] shadow-md transition-transform group-hover:scale-105 ${
                  isSeen
                    ? 'bg-slate-400/70 dark:bg-slate-600'
                    : 'bg-gradient-to-tr from-rose-500 via-pink-500 to-indigo-500'
                }`}
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-slate-950 p-[1.5px]">
                  <img
                    src={story.author.avatar || fallbackAvatar}
                    alt={story.author.displayName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>

              {/* Top-Right Video or Views Indicator */}
              <div className="absolute top-2.5 right-2 z-10 flex items-center gap-1">
                {story.mediaType === 'video' ? (
                  <span className="w-5 h-5 rounded-full bg-black/50 backdrop-blur-xs text-white flex items-center justify-center">
                    <Play className="w-2.5 h-2.5 fill-white" />
                  </span>
                ) : (
                  story.viewsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-black/50 backdrop-blur-xs text-[9px] font-semibold text-white/90 flex items-center gap-0.5 tabular-nums">
                      <Eye className="w-2.5 h-2.5" />
                      {story.viewsCount}
                    </span>
                  )
                )}
              </div>

              {/* Optional Mid Text Preview if Photo/Video has Caption */}
              {story.mediaUrl && story.textOverlay && (
                <div className="absolute inset-x-2 bottom-9 z-10">
                  <p className="text-[10px] font-medium text-white/90 line-clamp-1 drop-shadow-xs">
                    {story.textOverlay}
                  </p>
                </div>
              )}

              {/* Bottom Author Name Label */}
              <div className="absolute inset-x-2.5 bottom-2.5 z-10">
                <p className="text-[11px] sm:text-xs font-bold text-white leading-tight truncate drop-shadow-sm">
                  {isMe ? t('yourStory') : story.author.displayName}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
