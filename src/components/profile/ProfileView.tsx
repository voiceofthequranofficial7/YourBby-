import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import type { User, Post, Reel } from '../../types/index.ts';
import {
  CheckCircle2,
  MapPin,
  Globe,
  Grid,
  Film,
  Bookmark,
  Edit3,
  UserPlus,
  Check,
  MessageCircle,
  X,
  Save,
  Camera,
  ShieldAlert,
  Slash,
  MoreVertical,
  Image as ImageIcon
} from 'lucide-react';
import { PostCard } from '../feed/PostCard.tsx';
import { OwnerProfileSetupModal } from './OwnerProfileSetupModal.tsx';

export const ProfileView: React.FC = () => {
  const {
    viewingProfileUsername,
    currentUser,
    updateCurrentUserProfile,
    posts,
    reels,
    startChatWithUser,
    toggleFollowUser,
    setActiveTab
  } = useApp();

  const [activeTabSub, setActiveTabSub] = useState<'posts' | 'reels' | 'photos' | 'saved'>('posts');
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const targetUsername = viewingProfileUsername || currentUser?.username;
  const isMe = currentUser?.username === targetUsername;

  useEffect(() => {
    if (!targetUsername) return;
    fetch(`/api/users/${targetUsername}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setProfileUser(d.user);
        }
      })
      .catch(console.error);
  }, [targetUsername, currentUser]);

  const userPosts = posts.filter(p => p.author.username === targetUsername);
  const userReels = reels.filter(r => r.author.username === targetUsername);
  const userPhotos = userPosts.flatMap(p => p.mediaUrls || []);
  const savedPosts = posts.filter(p => p.isBookmarked);

  // Direct Avatar change
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const res = event.target?.result as string;
      if (res) {
        await updateCurrentUserProfile({ avatar: res });
      }
    };
    reader.readAsDataURL(file);
  };

  // Direct Cover change
  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const res = event.target?.result as string;
      if (res) {
        await updateCurrentUserProfile({ coverPhoto: res });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleReportUser = () => {
    setReportFeedback('Thank you for reporting. This profile has been submitted to the Trust & Safety team.');
    setTimeout(() => setReportFeedback(null), 4000);
  };

  const displayedUser = isMe ? currentUser : profileUser;
  if (!displayedUser) return null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 my-2">
      {/* Hidden file inputs for avatar & cover photo selection */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarFileChange}
        className="hidden"
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        onChange={handleCoverFileChange}
        className="hidden"
      />

      {/* Report Feedback alert */}
      {reportFeedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> {reportFeedback}
        </div>
      )}

      {/* Cover and Profile Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        {/* Cover Photo */}
        <div className="h-44 sm:h-60 w-full bg-slate-950 relative group">
          <img
            src={displayedUser.coverPhoto || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          {isMe && (
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 text-white text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs transition-all shadow-md"
              title="Upload Cover Photo"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change Cover</span>
            </button>
          )}
        </div>

        {/* Profile Info Row */}
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20 mb-4">
            {/* Avatar with Camera Icon */}
            <div className="relative group/avatar">
              <img
                src={displayedUser.avatar}
                alt={displayedUser.displayName}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-xl"
              />
              {isMe && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2 rounded-full bg-rose-500 text-white border-2 border-white dark:border-slate-900 hover:scale-110 transition-transform shadow-lg"
                  title="Upload Personal Profile Picture"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
              {displayedUser.isOnline && (
                <span className="absolute bottom-1 left-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {isMe ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={() => toggleFollowUser(displayedUser.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      displayedUser.isFollowing
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        : 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
                    }`}
                  >
                    {displayedUser.isFollowing ? (
                      <span className="flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Following
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <UserPlus className="w-3.5 h-3.5" /> Follow
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => startChatWithUser(displayedUser)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Message
                  </button>

                  <button
                    onClick={handleReportUser}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-amber-500"
                    title="Report Profile"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name & Bio */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {displayedUser.displayName}
              </h1>
              {displayedUser.verified && (
                <CheckCircle2 className="w-5 h-5 text-rose-500 fill-rose-500/20 shrink-0" />
              )}
              {displayedUser.badge && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                  {displayedUser.badge}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">@{displayedUser.username}</p>

            {displayedUser.bio && (
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 mt-2 max-w-xl">
                {displayedUser.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-3">
              {displayedUser.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  {displayedUser.location}
                </span>
              )}
              {displayedUser.website && (
                <a
                  href={displayedUser.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-indigo-500 hover:underline"
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  {displayedUser.website.replace('https://', '')}
                </a>
              )}
            </div>

            {/* Social Counts */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
              <div>
                <span className="font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                  {userPosts.length}
                </span>{' '}
                <span className="text-slate-500">posts</span>
              </div>
              <div>
                <span className="font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                  {displayedUser.followersCount.toLocaleString()}
                </span>{' '}
                <span className="text-slate-500">followers</span>
              </div>
              <div>
                <span className="font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                  {displayedUser.followingCount}
                </span>{' '}
                <span className="text-slate-500">following</span>
              </div>
              <div>
                <span className="font-extrabold font-mono text-slate-900 dark:text-white tabular-nums">
                  {displayedUser.friendsCount}
                </span>{' '}
                <span className="text-slate-500">friends</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Posts | Reels | Photos | Saved */}
      <div className="flex items-center justify-center gap-6 sm:gap-8 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTabSub('posts')}
          className={`flex items-center gap-2 pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTabSub === 'posts'
              ? 'text-rose-500 border-b-2 border-rose-500'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Grid className="w-4 h-4" /> Posts ({userPosts.length})
        </button>
        <button
          onClick={() => setActiveTabSub('reels')}
          className={`flex items-center gap-2 pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTabSub === 'reels'
              ? 'text-rose-500 border-b-2 border-rose-500'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Film className="w-4 h-4" /> Reels ({userReels.length})
        </button>
        <button
          onClick={() => setActiveTabSub('photos')}
          className={`flex items-center gap-2 pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${
            activeTabSub === 'photos'
              ? 'text-rose-500 border-b-2 border-rose-500'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ImageIcon className="w-4 h-4" /> Photos ({userPhotos.length})
        </button>
        {isMe && (
          <button
            onClick={() => setActiveTabSub('saved')}
            className={`flex items-center gap-2 pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${
              activeTabSub === 'saved'
                ? 'text-rose-500 border-b-2 border-rose-500'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Bookmark className="w-4 h-4" /> Saved ({savedPosts.length})
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTabSub === 'posts' && (
        <div className="space-y-4">
          {userPosts.length === 0 ? (
            <p className="py-12 text-center text-xs text-slate-400">No posts shared yet.</p>
          ) : (
            userPosts.map(p => <PostCard key={p.id} post={p} />)
          )}
        </div>
      )}

      {activeTabSub === 'reels' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {userReels.length === 0 ? (
            <p className="col-span-3 py-12 text-center text-xs text-slate-400">No reels published yet.</p>
          ) : (
            userReels.map(r => (
              <div
                key={r.id}
                onClick={() => setActiveTab('reels')}
                className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-slate-950 cursor-pointer group"
              >
                <img src={r.thumbnailUrl} alt={r.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                  <p className="text-xs font-bold truncate">{r.caption}</p>
                  <span className="text-[10px] text-white/80">{r.likesCount} likes</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTabSub === 'photos' && (
        <div className="grid grid-cols-3 gap-2">
          {userPhotos.length === 0 ? (
            <p className="col-span-3 py-12 text-center text-xs text-slate-400">No photos uploaded yet.</p>
          ) : (
            userPhotos.map((url, i) => (
              <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-slate-950 shadow-xs">
                <img src={url} alt="Photo" className="w-full h-full object-cover hover:scale-105 transition-transform" />
              </div>
            ))
          )}
        </div>
      )}

      {activeTabSub === 'saved' && (
        <div className="space-y-4">
          {savedPosts.length === 0 ? (
            <p className="py-12 text-center text-xs text-slate-400">No saved posts found.</p>
          ) : (
            savedPosts.map(p => <PostCard key={p.id} post={p} />)
          )}
        </div>
      )}

      {/* Comprehensive Profile Setup / Edit Modal */}
      {isEditing && (
        <OwnerProfileSetupModal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          initialMode="edit"
        />
      )}
    </div>
  );
};
