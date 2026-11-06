import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { X, ChevronLeft, ChevronRight, Heart, Send, Eye, MapPin, Music } from 'lucide-react';

export const StoryViewerModal: React.FC = () => {
  const {
    stories,
    activeStoryIndex,
    setActiveStoryIndex,
    markStorySeen,
    currentUser
  } = useApp();

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(false);

  const activeStory = activeStoryIndex !== null && stories[activeStoryIndex] ? stories[activeStoryIndex] : null;

  useEffect(() => {
    if (activeStory) {
      markStorySeen(activeStory.id);
      setProgress(0);
      setLiked(false);
    }
  }, [activeStoryIndex]);

  // Story timer
  useEffect(() => {
    if (!activeStory || isPaused) return;

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
  }, [activeStory, isPaused, activeStoryIndex]);

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
    }
  };

  const handleClose = () => {
    setActiveStoryIndex(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4 select-none">
      {/* Navigation arrows for desktop */}
      {activeStoryIndex > 0 && (
        <button
          onClick={handlePrev}
          className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white items-center justify-center cursor-pointer z-20"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {activeStoryIndex < stories.length - 1 && (
        <button
          onClick={handleNext}
          className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white items-center justify-center cursor-pointer z-20"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Main Story Container */}
      <div className="relative w-full max-w-sm h-[85vh] sm:h-[88vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
        {/* Progress Bars */}
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

        {/* Story Header */}
        <div className="absolute top-6 left-3 right-3 z-30 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <img
              src={activeStory.author.avatar}
              alt={activeStory.author.displayName}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white/50"
            />
            <div>
              <p className="text-xs font-bold leading-tight drop-shadow-md">
                {activeStory.author.displayName}
              </p>
              <span className="text-[10px] text-white/80">Story</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[11px] text-white/80 bg-black/40 px-2 py-0.5 rounded-full">
              <Eye className="w-3 h-3" />
              <span>{activeStory.viewsCount}</span>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-full bg-black/40 hover:bg-black/60 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media / Content */}
        <div
          className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {activeStory.mediaUrl ? (
            <img
              src={activeStory.mediaUrl}
              alt="Story"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600 flex items-center justify-center p-6">
              <p className="text-white text-xl font-bold text-center">{activeStory.textOverlay}</p>
            </div>
          )}

          {/* Text Overlay if present */}
          {activeStory.mediaUrl && activeStory.textOverlay && (
            <div className="absolute bottom-20 inset-x-4 p-3 bg-black/40 backdrop-blur-xs rounded-2xl">
              <p className="text-white text-sm font-semibold text-center">
                {activeStory.textOverlay}
              </p>
            </div>
          )}

          {/* Stickers */}
          {activeStory.stickers && activeStory.stickers.length > 0 && (
            <div className="absolute top-20 left-4 z-20 space-y-1.5">
              {activeStory.stickers.map((st, i) => (
                <div key={i} className="px-3 py-1 rounded-full bg-white/90 text-slate-900 text-xs font-bold shadow-lg flex items-center gap-1.5 backdrop-blur-xs">
                  {st.type === 'location' && <MapPin className="w-3.5 h-3.5 text-rose-500" />}
                  {st.type === 'music' && <Music className="w-3.5 h-3.5 text-indigo-500" />}
                  <span>{st.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tap Zones: Left 30% = prev, Right 70% = next */}
          <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={handlePrev} />
          <div className="absolute inset-y-0 right-0 w-2/3 z-10" onClick={handleNext} />
        </div>

        {/* Bottom Reply Bar */}
        <div className="p-3 bg-black/80 backdrop-blur-md z-30 flex items-center gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Reply to ${activeStory.author.displayName.split(' ')[0]}...`}
            className="flex-1 px-4 py-2 bg-white/10 text-white placeholder:text-white/50 text-xs rounded-full border border-white/20 focus:outline-none focus:border-rose-500"
          />
          <button
            onClick={() => setLiked(!liked)}
            className={`p-2 rounded-full transition-transform active:scale-125 ${
              liked ? 'text-rose-500' : 'text-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-rose-500' : ''}`} />
          </button>
          {replyText.trim() && (
            <button
              onClick={() => setReplyText('')}
              className="p-2 bg-rose-500 text-white rounded-full text-xs font-semibold"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
