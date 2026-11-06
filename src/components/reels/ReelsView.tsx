import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Volume2,
  VolumeX,
  Music,
  ChevronUp,
  ChevronDown,
  UserPlus,
  Check,
  Send,
  X
} from 'lucide-react';

export const ReelsView: React.FC = () => {
  const {
    reels,
    likeReel,
    toggleFollowUser,
    setViewingProfileUsername,
    setActiveTab,
    currentUser
  } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [reelComments, setReelComments] = useState<{ id: string; user: string; avatar: string; text: string }[]>([
    {
      id: 'rc_1',
      user: 'Priya Sen',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
      text: 'The edit pace on this reel is pure fire! 🔥'
    },
    {
      id: 'rc_2',
      user: 'Aarav Sharma',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
      text: 'Adding this track to my workout playlist immediately 🙌'
    }
  ]);
  const [newComment, setNewComment] = useState('');

  const currentReel = reels[currentIndex] || reels[0];
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    setReelComments([
      ...reelComments,
      {
        id: `rc_${Date.now()}`,
        user: currentUser.displayName,
        avatar: currentUser.avatar,
        text: newComment.trim()
      }
    ]);
    setNewComment('');
  };

  if (!currentReel) {
    return (
      <div className="py-20 text-center text-slate-500">
        <p>No Reels found. Be the first to publish a Reel!</p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm sm:max-w-md mx-auto h-[calc(100vh-8rem)] min-h-[550px] bg-black rounded-3xl overflow-hidden shadow-2xl flex flex-col my-2">
      {/* Video element */}
      <div className="relative flex-1 w-full h-full bg-slate-950 flex items-center justify-center cursor-pointer" onClick={togglePlay}>
        <video
          ref={videoRef}
          src={currentReel.videoUrl}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Play/Pause indicator icon when paused */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-black/60 text-white flex items-center justify-center text-xl font-bold">
              ▶
            </div>
          </div>
        )}
      </div>

      {/* Top Controls: Sound Mute & Progress */}
      <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between text-white">
        <span className="text-xs font-bold uppercase tracking-wider bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
          YourBby Reels
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className="p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-xs text-white"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Up/Down Scroll arrows */}
      <div className="absolute right-4 top-1/2 -translate-y-24 z-20 hidden sm:flex flex-col gap-2">
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center"
            title="Previous Reel"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
        {currentIndex < reels.length - 1 && (
          <button
            onClick={handleNext}
            className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center"
            title="Next Reel"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Right Action Rail */}
      <div className="absolute right-3 bottom-16 z-20 flex flex-col items-center gap-4 text-white">
        {/* Like */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => likeReel(currentReel.id)}
            className={`p-3 rounded-full bg-black/40 backdrop-blur-xs hover:bg-black/60 transition-transform active:scale-125 ${
              currentReel.hasLiked ? 'text-rose-500' : 'text-white'
            }`}
          >
            <Heart className={`w-6 h-6 ${currentReel.hasLiked ? 'fill-rose-500' : ''}`} />
          </button>
          <span className="text-xs font-bold mt-1 drop-shadow-md">
            {currentReel.likesCount}
          </span>
        </div>

        {/* Comment */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => setShowComments(true)}
            className="p-3 rounded-full bg-black/40 backdrop-blur-xs hover:bg-black/60 text-white"
          >
            <MessageCircle className="w-6 h-6" />
          </button>
          <span className="text-xs font-bold mt-1 drop-shadow-md">
            {reelComments.length}
          </span>
        </div>

        {/* Share */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
            }}
            className="p-3 rounded-full bg-black/40 backdrop-blur-xs hover:bg-black/60 text-white"
          >
            <Share2 className="w-6 h-6" />
          </button>
          <span className="text-xs font-bold mt-1 drop-shadow-md">
            {currentReel.sharesCount}
          </span>
        </div>

        {/* Rotating Music Disc */}
        <div className="w-10 h-10 rounded-full bg-slate-900 border-2 border-white/60 p-1 flex items-center justify-center animate-spin">
          <Music className="w-4 h-4 text-rose-500" />
        </div>
      </div>

      {/* Bottom Creator & Caption Info */}
      <div className="absolute bottom-4 left-4 right-16 z-20 text-white space-y-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              setViewingProfileUsername(currentReel.author.username);
              setActiveTab('profile');
            }}
            className="flex items-center gap-2"
          >
            <img
              src={currentReel.author.avatar}
              alt={currentReel.author.displayName}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white/60"
            />
            <span className="font-bold text-sm drop-shadow-md">
              {currentReel.author.displayName}
            </span>
          </button>

          <button
            onClick={() => toggleFollowUser(currentReel.author.id)}
            className="px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xs text-xs font-semibold flex items-center gap-1"
          >
            {currentReel.author.isFollowing ? (
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> Following
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <UserPlus className="w-3 h-3" /> Follow
              </span>
            )}
          </button>
        </div>

        <p className="text-xs text-white/90 line-clamp-2 drop-shadow-md pointer-events-auto">
          {currentReel.caption}
        </p>

        {/* Audio tag */}
        <div className="flex items-center gap-1.5 text-[11px] text-white/80 bg-black/30 px-2.5 py-1 rounded-full w-fit backdrop-blur-xs">
          <Music className="w-3 h-3 text-rose-400" />
          <span className="truncate max-w-[200px]">
            {currentReel.audioTrack.title} · {currentReel.audioTrack.artist}
          </span>
        </div>
      </div>

      {/* Comments Drawer Modal */}
      {showComments && (
        <div className="absolute inset-x-0 bottom-0 top-1/3 bg-white dark:bg-slate-900 rounded-t-3xl p-4 z-40 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Comments ({reelComments.length})
            </span>
            <button
              onClick={() => setShowComments(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-3">
            {reelComments.map((c) => (
              <div key={c.id} className="flex items-start gap-2.5 text-xs">
                <img
                  src={c.avatar}
                  alt={c.user}
                  className="w-7 h-7 rounded-full object-cover shrink-0"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white mr-1.5">
                    {c.user}
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">{c.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Comment composer */}
          <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment to this reel..."
              className="flex-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs rounded-full focus:outline-none"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="p-2 bg-rose-500 text-white rounded-full disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
