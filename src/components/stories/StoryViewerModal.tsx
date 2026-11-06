import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Heart,
  Send,
  Eye,
  MapPin,
  Music,
  Trash2,
  Globe,
  Users,
  Lock,
  Pause,
  Play,
  Check
} from 'lucide-react';

export const StoryViewerModal: React.FC = () => {
  const {
    stories,
    activeStoryIndex,
    setActiveStoryIndex,
    markStorySeen,
    deleteStory,
    currentUser,
    startChatWithUser,
    sendMessage,
    setViewingProfileUsername,
    setActiveTab,
  } = useApp();

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(false);
  const [showViewersSheet, setShowViewersSheet] = useState(false);
  const [replySentFeedback, setReplySentFeedback] = useState(false);

  // Touch swipe tracking
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const activeStory =
    activeStoryIndex !== null && stories[activeStoryIndex] ? stories[activeStoryIndex] : null;

  const isOwnStory =
    Boolean(activeStory && currentUser) &&
    (activeStory!.author.id === currentUser!.id ||
      activeStory!.author.username === currentUser!.username);

  useEffect(() => {
    if (activeStory) {
      markStorySeen(activeStory.id);
      setProgress(0);
      setLiked(false);
      setShowViewersSheet(false);
      setReplySentFeedback(false);
    }
  }, [activeStoryIndex, activeStory?.id]);

  // Story timer
  useEffect(() => {
    if (!activeStory || isPaused || showViewersSheet) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStory, isPaused, showViewersSheet, activeStoryIndex, stories.length]);

  if (!activeStory || activeStoryIndex === null) return null;

  const handleNext = () => {
    if (activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const handlePrev = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    } else {
      setProgress(0);
    }
  };

  const handleClose = () => {
    setShowViewersSheet(false);
    setActiveStoryIndex(null);
  };

  const handleDeleteOwnStory = async () => {
    const idToRemove = activeStory.id;
    const totalRemaining = stories.length - 1;
    await deleteStory(idToRemove);
    if (totalRemaining <= 0) {
      setActiveStoryIndex(null);
    } else if (activeStoryIndex >= totalRemaining) {
      setActiveStoryIndex(totalRemaining - 1);
    }
  };

  const handleSendStoryReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setReplyText('');
    setReplySentFeedback(true);
    setTimeout(() => setReplySentFeedback(false), 2500);

    try {
      const conv = await startChatWithUser(activeStory.author);
      if (conv) {
        await sendMessage(
          conv.id,
          `Replied to your story: "${trimmed}"`,
          activeStory.mediaUrl,
          activeStory.mediaType === 'video' ? 'video' : activeStory.mediaUrl ? 'image' : undefined
        );
      }
    } catch (_) {}
  };

  // Touch swipe handlers (left/right to switch story, down to close)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    }
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartXRef.current;
    const endY = e.changedTouches[0]?.clientY ?? touchStartYRef.current;
    const dx = endX - touchStartXRef.current;
    const dy = endY - touchStartYRef.current;

    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    } else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) {
      handleClose();
    }
  };

  // Relative time & expiration helper
  const createdTime = new Date(activeStory.createdAt).getTime();
  const expiresTime = new Date(activeStory.expiresAt).getTime();
  const hoursAgo = Math.max(0, Math.floor((Date.now() - createdTime) / (1000 * 60 * 60)));
  const minsAgo = Math.max(1, Math.floor((Date.now() - createdTime) / (1000 * 60)));
  const hoursLeft = Math.max(1, Math.ceil((expiresTime - Date.now()) / (1000 * 60 * 60)));
  const timeLabel = hoursAgo > 0 ? `${hoursAgo}h ago` : `${minsAgo}m ago`;

  const privacyLabel =
    activeStory.privacy === 'close_friends'
      ? 'Close Friends'
      : activeStory.privacy === 'friends'
      ? 'Friends'
      : 'Public';

  const viewersList = activeStory.viewers || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-0 sm:p-4 select-none">
      {/* Desktop Left/Right Navigation Arrows */}
      {activeStoryIndex > 0 && (
        <button
          type="button"
          onClick={handlePrev}
          className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white items-center justify-center cursor-pointer z-20 transition"
          aria-label="Previous story"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {activeStoryIndex < stories.length - 1 && (
        <button
          type="button"
          onClick={handleNext}
          className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md text-white items-center justify-center cursor-pointer z-20 transition"
          aria-label="Next story"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Portrait Story Container */}
      <div className="relative w-full max-w-sm h-full sm:h-[88vh] bg-slate-950 sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-white/10">
        {/* Segmented Progress Bars */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center gap-1.5">
          {stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width:
                    idx < activeStoryIndex
                      ? '100%'
                      : idx === activeStoryIndex
                      ? `${progress}%`
                      : '0%',
                }}
              />
            </div>
          ))}
        </div>

        {/* Story Author & Actions Header */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white">
          <button
            type="button"
            onClick={() => {
              const uname = activeStory.author.username;
              handleClose();
              setViewingProfileUsername(uname);
              setActiveTab('profile');
            }}
            className="flex items-center gap-2.5 text-left group"
          >
            <img
              src={activeStory.author.avatar}
              alt={activeStory.author.displayName}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-rose-500"
            />
            <div>
              <p className="text-xs font-bold leading-tight drop-shadow-md group-hover:underline">
                {activeStory.author.displayName}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-white/80">
                <span>{timeLabel}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5">
                  {activeStory.privacy === 'close_friends' ? (
                    <Lock className="w-2.5 h-2.5 text-emerald-400" />
                  ) : activeStory.privacy === 'friends' ? (
                    <Users className="w-2.5 h-2.5 text-sky-400" />
                  ) : (
                    <Globe className="w-2.5 h-2.5 text-white/80" />
                  )}
                  {privacyLabel}
                </span>
                {!Number.isNaN(expiresTime) && (
                  <>
                    <span>·</span>
                    <span>{hoursLeft}h left</span>
                  </>
                )}
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            {/* Pause / Resume Toggle */}
            <button
              type="button"
              onClick={() => setIsPaused((p) => !p)}
              className="p-1.5 rounded-full bg-black/45 hover:bg-black/65 text-white transition"
              title={isPaused ? 'Resume story' : 'Pause story'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>

            {/* Viewers Count Button (Opens Viewers List Sheet) */}
            <button
              type="button"
              onClick={() => setShowViewersSheet((prev) => !prev)}
              className="flex items-center gap-1 text-[11px] font-semibold text-white bg-black/45 hover:bg-black/65 px-2.5 py-1 rounded-full transition tabular-nums"
              title="View story viewers"
            >
              <Eye className="w-3.5 h-3.5 text-rose-400" />
              <span>{activeStory.viewsCount}</span>
            </button>

            {/* Delete Own Story Button */}
            {isOwnStory && (
              <button
                type="button"
                onClick={handleDeleteOwnStory}
                className="p-1.5 rounded-full bg-rose-500/80 hover:bg-rose-600 text-white transition"
                title="Delete your story"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Close Viewer Button */}
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-full bg-black/45 hover:bg-black/65 text-white transition"
              title="Close stories"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Story Canvas (Image / Video / Gradient Text) */}
        <div
          className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {activeStory.mediaType === 'video' && activeStory.mediaUrl ? (
            <video
              src={activeStory.mediaUrl}
              autoPlay
              playsInline
              loop
              className="w-full h-full object-cover"
            />
          ) : activeStory.mediaUrl ? (
            <img
              src={activeStory.mediaUrl}
              alt="Story"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${
                activeStory.backgroundGradient || 'from-purple-600 via-pink-600 to-rose-600'
              } flex items-center justify-center p-8`}
            >
              <p className="text-white text-xl sm:text-2xl font-extrabold text-center leading-relaxed drop-shadow-md">
                {activeStory.textOverlay}
              </p>
            </div>
          )}

          {/* Text Overlay on Photo/Video */}
          {activeStory.mediaUrl && activeStory.textOverlay && (
            <div className="absolute bottom-20 inset-x-4 p-3.5 bg-black/55 backdrop-blur-md rounded-2xl border border-white/10 z-20 pointer-events-none">
              <p className="text-white text-sm font-semibold text-center leading-snug">
                {activeStory.textOverlay}
              </p>
            </div>
          )}

          {/* Stickers (Location, Music, Mention) */}
          {activeStory.stickers && activeStory.stickers.length > 0 && (
            <div className="absolute top-20 left-4 z-20 space-y-2 pointer-events-none">
              {activeStory.stickers.map((st, i) => (
                <div
                  key={i}
                  className="px-3 py-1.5 rounded-full bg-white/95 text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-xs"
                >
                  {st.type === 'location' && <MapPin className="w-3.5 h-3.5 text-rose-500" />}
                  {st.type === 'music' && <Music className="w-3.5 h-3.5 text-indigo-500" />}
                  <span>{st.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reply Sent Toast */}
          {replySentFeedback && (
            <div className="absolute top-24 inset-x-8 z-30 py-2 px-4 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg">
              <Check className="w-4 h-4" />
              <span>Reply sent to {activeStory.author.displayName}</span>
            </div>
          )}

          {/* Tap Zones: Left 35% = Previous, Right 65% = Next */}
          <div
            className="absolute inset-y-0 left-0 w-[35%] z-10 cursor-pointer"
            onClick={handlePrev}
            aria-label="Previous story tap zone"
          />
          <div
            className="absolute inset-y-0 right-0 w-[65%] z-10 cursor-pointer"
            onClick={handleNext}
            aria-label="Next story tap zone"
          />
        </div>

        {/* Interactive Story Viewers Bottom Sheet */}
        {showViewersSheet && (
          <div className="absolute inset-x-0 bottom-0 z-40 bg-slate-900/98 backdrop-blur-xl border-t border-slate-800 rounded-t-3xl p-4 max-h-[60%] flex flex-col animate-in slide-in-from-bottom-4 duration-150">
            <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white">
                <Eye className="w-4 h-4 text-rose-500" />
                <h4 className="text-xs font-bold">
                  Story Viewers ({activeStory.viewsCount})
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowViewersSheet(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 py-2">
              {viewersList.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  {activeStory.viewsCount > 0
                    ? `${activeStory.viewsCount} viewer(s) have seen this story.`
                    : 'No viewers recorded yet.'}
                </p>
              ) : (
                viewersList.map((v) => (
                  <div key={v.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={v.avatar}
                        alt={v.displayName}
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{v.displayName}</p>
                        <p className="text-[10px] text-slate-400 truncate">@{v.username}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(v.viewedAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Bottom Reply / Viewers Bar */}
        <form
          onSubmit={handleSendStoryReply}
          className="p-3 bg-black/85 backdrop-blur-md z-30 flex items-center gap-2 border-t border-white/10"
        >
          {isOwnStory ? (
            <button
              type="button"
              onClick={() => setShowViewersSheet((prev) => !prev)}
              className="flex-1 py-2 px-4 rounded-full bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-rose-400" />
                <span>Viewed by {activeStory.viewsCount} people</span>
              </span>
              <span className="text-[11px] text-rose-400 font-bold">See list</span>
            </button>
          ) : (
            <>
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                placeholder={`Reply to ${activeStory.author.displayName.split(' ')[0]}...`}
                className="flex-1 px-4 py-2 bg-white/10 text-white placeholder:text-white/50 text-xs rounded-full border border-white/20 focus:outline-none focus:border-rose-500"
              />
              <button
                type="button"
                onClick={() => setLiked(!liked)}
                className={`p-2 rounded-full transition-transform active:scale-125 ${
                  liked ? 'text-rose-500' : 'text-white'
                }`}
                aria-label="Like story"
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-rose-500' : ''}`} />
              </button>
              {replyText.trim() && (
                <button
                  type="submit"
                  className="p-2 bg-gradient-to-r from-rose-500 to-indigo-600 text-white rounded-full text-xs font-semibold shadow-md"
                  aria-label="Send story reply"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
};
