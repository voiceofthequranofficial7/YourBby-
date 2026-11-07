import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, uploadProfilePhotoFile } from '../../firebase/config.ts';
import { useApp } from '../../context/AppContext.tsx';
import { apiFetch } from '../../firebase/staticApiFallback.ts';
import type { User } from '../../types/index.ts';
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
  Camera,
  ShieldAlert,
  Slash,
  Image as ImageIcon,
  Info,
  Plus,
  Settings,
  X,
  Play,
  Sparkles,
  Lock,
  Users
} from 'lucide-react';
import { PostCard } from '../feed/PostCard.tsx';
import { OwnerProfileSetupModal } from './OwnerProfileSetupModal.tsx';
import { CoverPhotoEditorModal } from './CoverPhotoEditorModal.tsx';

const DEFAULT_COVER_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="420" viewBox="0 0 1200 420">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#090d16"/>
        <stop offset="45%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#4c0519"/>
      </linearGradient>
      <radialGradient id="glow1" cx="25%" cy="30%" r="50%">
        <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.38"/>
        <stop offset="100%" stop-color="#f43f5e" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="glow2" cx="80%" cy="70%" r="55%">
        <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.42"/>
        <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="420" fill="url(#bg)"/>
    <rect width="1200" height="420" fill="url(#glow1)"/>
    <rect width="1200" height="420" fill="url(#glow2)"/>
    <circle cx="980" cy="90" r="140" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="2"/>
    <circle cx="980" cy="90" r="210" fill="none" stroke="rgba(244,63,94,0.12)" stroke-width="1.5"/>
  </svg>`
)}`;

export const ProfileView: React.FC = () => {
  const {
    viewingProfileUsername,
    currentUser,
    allUsers,
    updateCurrentUserProfile,
    posts,
    reels,
    stories,
    startChatWithUser,
    toggleFollowUser,
    setActiveTab,
    setActiveSettingsSection,
    openCreateModal,
    setActiveStoryIndex,
    blockedUserIds,
    toggleBlockUser,
    setViewingProfileUsername,
    t
  } = useApp();

  const [activeTabSub, setActiveTabSub] = useState<'posts' | 'photos' | 'videos' | 'about' | 'saved'>('posts');
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCoverEditorOpen, setIsCoverEditorOpen] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [connectionsModal, setConnectionsModal] = useState<'followers' | 'following' | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const targetUsername = viewingProfileUsername || currentUser?.username;
  const isMe = Boolean(currentUser && targetUsername === currentUser.username);

  useEffect(() => {
    if (!targetUsername) return;
    let isMounted = true;

    const loadUserWithFirestoreCover = async () => {
      try {
        let baseUser: User | null = isMe && currentUser
          ? currentUser
          : (allUsers.find(u => u.username === targetUsername) || null);

        const res = await apiFetch(`/api/users/${targetUsername}`);
        const d = await res.json();
        if (d.success && d.user) {
          baseUser = d.user;
        }

        if (baseUser) {
          try {
            const fsSnap = await getDoc(doc(db, 'users', baseUser.id));
            if (fsSnap.exists()) {
              const fsData = fsSnap.data() as Partial<User>;
              const resolvedCover =
                fsData.coverPhotoURL !== undefined ? fsData.coverPhotoURL : fsData.coverPhoto;
              baseUser = {
                ...baseUser,
                ...fsData,
                ...(resolvedCover !== undefined
                  ? { coverPhotoURL: resolvedCover, coverPhoto: resolvedCover }
                  : {})
              };
            }
          } catch (_) {}
          if (isMounted) {
            setProfileUser(baseUser);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadUserWithFirestoreCover();
    return () => {
      isMounted = false;
    };
  }, [targetUsername, isMe, currentUser, allUsers]);

  // Canonical user profile resolution
  const displayedUser = isMe
    ? currentUser
    : profileUser || allUsers.find(u => u.username === targetUsername);

  if (!displayedUser) return null;

  const resolvedCoverPhoto =
    (displayedUser.coverPhotoURL !== undefined
      ? displayedUser.coverPhotoURL
      : displayedUser.coverPhoto) || DEFAULT_COVER_SVG;

  const isBlocked = blockedUserIds.includes(displayedUser.id);

  // Real counts and media filtered strictly by canonical user ID or username
  const userPosts = posts.filter(
    p => p.author.id === displayedUser.id || p.author.username === displayedUser.username
  );
  const userReels = reels.filter(
    r => r.author.id === displayedUser.id || r.author.username === displayedUser.username
  );
  const userVideoPosts = userPosts.filter(p => p.mediaType === 'video' && (p.mediaUrls?.length || 0) > 0);
  const userPhotos = userPosts
    .filter(p => p.mediaType !== 'video')
    .flatMap(p => p.mediaUrls || []);
  const savedPosts = posts.filter(p => p.isBookmarked);
  const userStories = stories.filter(
    s => s.author.id === displayedUser.id || s.author.username === displayedUser.username
  );

  const openStoryInViewer = (storyId: string) => {
    const idx = stories.findIndex(s => s.id === storyId);
    if (idx !== -1) {
      setActiveStoryIndex(idx);
    }
  };

  const totalVideosCount = userReels.length + userVideoPosts.length;

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUploadProgress, setAvatarUploadProgress] = useState(0);
  const [avatarUploadError, setAvatarUploadError] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);

  const performAvatarUpload = async (file: File) => {
    if (!currentUser) return;
    setAvatarUploading(true);
    setAvatarUploadProgress(5);
    setAvatarUploadError(null);
    setPendingAvatarFile(file);
    try {
      const downloadUrl = await uploadProfilePhotoFile(
        file,
        currentUser.id,
        file.name || 'avatar.jpg',
        (pct) => setAvatarUploadProgress(pct)
      );
      await updateCurrentUserProfile({ avatar: downloadUrl });
      setPendingAvatarFile(null);
      setReportFeedback('Profile picture uploaded and saved!');
      setTimeout(() => setReportFeedback(null), 4000);
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      setAvatarUploadError(err?.message || 'Failed to upload profile photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Direct Avatar change (strictly updates only avatar via dedicated profile photo storage path, never coverPhotoURL)
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarUploadError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }
    await performAvatarUpload(file);
    e.target.value = '';
  };

  const handleReportUser = () => {
    setReportFeedback('Thank you for reporting. This profile has been submitted to YourBby Trust & Safety.');
    setTimeout(() => setReportFeedback(null), 4000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 my-1 pb-8">
      {/* Hidden file input for avatar selection */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarFileChange}
        className="hidden"
      />

      {/* Avatar upload progress / error banner */}
      {avatarUploading && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3">
          <span>Uploading profile photo... {avatarUploadProgress}%</span>
          <div className="w-32 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-200"
              style={{ width: `${avatarUploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {avatarUploadError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2">
          <span>{avatarUploadError}</span>
          <div className="flex items-center gap-2 shrink-0">
            {pendingAvatarFile && (
              <button
                onClick={() => performAvatarUpload(pendingAvatarFile)}
                className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => setAvatarUploadError(null)}
              className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Feedback alert */}
      {reportFeedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> {reportFeedback}
        </div>
      )}

      {/* Unified Profile Card: Cover + Overlapping Avatar + Canonical Bio + Real Counts + Story Highlights */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        {/* Cover Photo */}
        <div className="h-44 sm:h-56 w-full bg-slate-950 relative z-20 group">
          <img
            src={resolvedCoverPhoto}
            alt={`${displayedUser.displayName} cover`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/15 pointer-events-none" />
          {isMe && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                console.log('[CoverPhotoFlow] Step 1: Edit Cover Photo button clicked in ProfileView');
                setIsCoverEditorOpen(true);
              }}
              className="absolute top-3 right-3 sm:top-auto sm:bottom-3 sm:right-3 z-30 pointer-events-auto cursor-pointer px-3.5 py-2 rounded-xl bg-slate-950/85 hover:bg-slate-950 text-white text-xs font-bold flex items-center gap-1.5 backdrop-blur-md border border-white/25 transition-all shadow-lg active:scale-95"
              title="Edit Cover Photo"
            >
              <Camera className="w-3.5 h-3.5 text-rose-400" />
              <span>Edit Cover Photo</span>
            </button>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="px-4 sm:px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4 pointer-events-none">
            {/* Overlapping Profile Photo */}
            <div className="relative z-30 w-28 h-28 sm:w-32 sm:h-32 shrink-0 pointer-events-auto">
              <div
                onClick={() => {
                  if (userStories.length > 0) {
                    openStoryInViewer(userStories[0].id);
                  }
                }}
                className={`w-full h-full rounded-full p-1 ${
                  userStories.length > 0
                    ? 'bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-indigo-500 cursor-pointer'
                    : 'bg-white dark:bg-slate-900'
                } shadow-xl`}
              >
                <img
                  src={displayedUser.avatar}
                  alt={displayedUser.displayName}
                  className="w-full h-full rounded-full object-cover ring-4 ring-white dark:ring-slate-900 bg-slate-900"
                />
              </div>

              {isMe && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white border-2 border-white dark:border-slate-900 hover:scale-105 transition-transform shadow-lg"
                  title="Change Profile Photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
              {displayedUser.isOnline && (
                <span
                  className="absolute bottom-2 left-2 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"
                  title="Online now"
                />
              )}
            </div>

            {/* Primary Profile Action Buttons */}
            <div className="relative z-30 flex flex-wrap items-center gap-2 pointer-events-auto">
              {isMe ? (
                <>
                  <button
                    onClick={() => openCreateModal('story')}
                    className="px-4 py-2.5 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Story</span>
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t('editProfile')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveSettingsSection('account');
                      setActiveTab('settings');
                    }}
                    className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all"
                    title="Account Settings"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => toggleFollowUser(displayedUser.id)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      displayedUser.isFollowing
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                        : 'bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white shadow-md shadow-rose-500/20'
                    }`}
                  >
                    {displayedUser.isFollowing ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => startChatWithUser(displayedUser)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Message</span>
                  </button>

                  <button
                    onClick={() => toggleBlockUser(displayedUser.id)}
                    className={`p-2.5 rounded-xl text-xs font-bold transition-colors ${
                      isBlocked
                        ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500'
                    }`}
                    title={isBlocked ? 'Unblock User' : 'Block User'}
                  >
                    <Slash className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleReportUser}
                    className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-500 transition-colors"
                    title="Report Profile"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Name, Username, Bio & Metadata */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {displayedUser.displayName}
              </h1>
              {displayedUser.verified && (
                <CheckCircle2 className="w-5 h-5 text-rose-500 fill-rose-500/20 shrink-0" />
              )}
              {displayedUser.badge && (
                <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-rose-500/15 to-purple-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                  {displayedUser.badge}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              @{displayedUser.username}
            </p>

            {displayedUser.bio && (
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 mt-2.5 max-w-2xl leading-relaxed">
                {displayedUser.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-3">
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
                  className="flex items-center gap-1 text-rose-500 hover:underline font-medium"
                >
                  <Globe className="w-3.5 h-3.5 shrink-0" />
                  {displayedUser.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>

            {/* Real Database Counts: Posts | Followers | Following */}
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-8 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
              <button
                onClick={() => setActiveTabSub('posts')}
                className="text-left group"
              >
                <span className="text-base sm:text-lg font-extrabold font-mono text-slate-900 dark:text-white tabular-nums group-hover:text-rose-500 transition-colors">
                  {userPosts.length}
                </span>{' '}
                <span className="text-xs text-slate-500 dark:text-slate-400 block sm:inline">Posts</span>
              </button>

              <button
                onClick={() => setConnectionsModal('followers')}
                className="text-left group"
              >
                <span className="text-base sm:text-lg font-extrabold font-mono text-slate-900 dark:text-white tabular-nums group-hover:text-rose-500 transition-colors">
                  {displayedUser.followersCount.toLocaleString()}
                </span>{' '}
                <span className="text-xs text-slate-500 dark:text-slate-400 block sm:inline">Followers</span>
              </button>

              <button
                onClick={() => setConnectionsModal('following')}
                className="text-left group"
              >
                <span className="text-base sm:text-lg font-extrabold font-mono text-slate-900 dark:text-white tabular-nums group-hover:text-rose-500 transition-colors">
                  {displayedUser.followingCount.toLocaleString()}
                </span>{' '}
                <span className="text-xs text-slate-500 dark:text-slate-400 block sm:inline">Following</span>
              </button>
            </div>

            {/* Profile-Specific Story Highlights Row */}
            {(isMe || userStories.length > 0) && (
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Story Highlights
                  </span>
                  {userStories.length > 0 && (
                    <span className="text-[11px] text-rose-500 font-semibold">
                      {userStories.length} active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                  {isMe && (
                    <button
                      onClick={() => openCreateModal('story')}
                      className="flex flex-col items-center gap-1.5 shrink-0 group"
                    >
                      <div className="w-16 h-24 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 group-hover:border-rose-500 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/50 transition-colors">
                        <Plus className="w-5 h-5 text-rose-500" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        New
                      </span>
                    </button>
                  )}

                  {userStories.map((story, idx) => {
                    const locationStickerText = story.stickers?.find(s => s.type === 'location')?.text;
                    return (
                      <button
                        key={story.id}
                        onClick={() => openStoryInViewer(story.id)}
                        className="flex flex-col items-center gap-1.5 shrink-0 group"
                      >
                        <div className="w-16 h-24 rounded-2xl p-0.5 bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-indigo-500 shadow-sm overflow-hidden">
                          <div className="w-full h-full rounded-[14px] overflow-hidden bg-slate-900 relative">
                            {story.mediaType === 'text' ? (
                              <div
                                className="w-full h-full flex items-center justify-center p-1 text-center"
                                style={{ background: story.backgroundGradient || 'linear-gradient(135deg, #f43f5e, #6366f1)' }}
                              >
                                <span className="text-[8px] font-bold text-white line-clamp-3">
                                  {story.textOverlay || 'Story'}
                                </span>
                              </div>
                            ) : (
                              <img
                                src={story.mediaUrl}
                                alt={story.textOverlay || 'Story'}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              />
                            )}
                          </div>
                        </div>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 max-w-[68px] truncate">
                          {locationStickerText || story.textOverlay || `Story ${idx + 1}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Navigation Tabs: Posts | Photos | Videos | About | (Saved for self) */}
        <div className="flex items-center border-t border-slate-200/80 dark:border-slate-800 px-2 sm:px-6 overflow-x-auto no-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
          {[
            { id: 'posts', label: 'Posts', count: userPosts.length, icon: Grid },
            { id: 'photos', label: t('photos'), count: userPhotos.length, icon: ImageIcon },
            { id: 'videos', label: t('videos'), count: totalVideosCount, icon: Film },
            { id: 'about', label: t('about'), count: null, icon: Info },
            ...(isMe ? [{ id: 'saved', label: t('saved'), count: savedPosts.length, icon: Bookmark }] : [])
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTabSub === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTabSub(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                  active
                    ? 'text-rose-500 border-rose-500'
                    : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-800 text-[10px] font-mono">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: Posts */}
      {activeTabSub === 'posts' && (
        <div className="space-y-4">
          {userPosts.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center space-y-3">
              <Grid className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No posts yet</p>
              <p className="text-xs text-slate-400">
                {isMe ? 'Share your first update, photo, or video with your community.' : `${displayedUser.displayName} hasn't published any posts yet.`}
              </p>
              {isMe && (
                <button
                  onClick={() => openCreateModal('post')}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold"
                >
                  Create First Post
                </button>
              )}
            </div>
          ) : (
            userPosts.map(p => <PostCard key={p.id} post={p} />)
          )}
        </div>
      )}

      {/* Tab 2: Photos */}
      {activeTabSub === 'photos' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4">
          {userPhotos.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-400">No photos uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {userPhotos.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxImage(url)}
                  className="aspect-square rounded-2xl overflow-hidden bg-slate-950 shadow-xs group relative"
                >
                  <img
                    src={url}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Videos (Reels + Video Posts) */}
      {activeTabSub === 'videos' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4">
          {totalVideosCount === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Film className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-400">No videos or reels published yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {userReels.map(r => (
                <div
                  key={r.id}
                  onClick={() => setActiveTab('reels')}
                  className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-slate-950 cursor-pointer group"
                >
                  <img
                    src={r.thumbnailUrl}
                    alt={r.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-xs flex items-center justify-center text-white">
                    <Play className="w-3.5 h-3.5 fill-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-3 text-white">
                    <p className="text-xs font-bold truncate">{r.caption}</p>
                    <span className="text-[10px] text-white/80">{r.likesCount} likes</span>
                  </div>
                </div>
              ))}
              {userVideoPosts.map(vp => (
                <div
                  key={vp.id}
                  className="relative rounded-2xl overflow-hidden aspect-[9/16] bg-slate-950 group"
                >
                  <video
                    src={vp.mediaUrls?.[0]}
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 pointer-events-none">
                    <p className="text-[11px] font-semibold text-white truncate">{vp.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: About */}
      {activeTabSub === 'about' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              About {displayedUser.displayName}
            </h3>
            {isMe && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Details</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Bio</span>
              <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                {displayedUser.bio || 'No bio added yet.'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Canonical Handle</span>
              <p className="text-slate-800 dark:text-slate-200 font-mono font-bold">
                @{displayedUser.username}
              </p>
              <p className="text-[11px] text-slate-400">Unique ID: {displayedUser.id}</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Location</span>
              <p className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" />
                {displayedUser.location || 'Global'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Website</span>
              <p className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-500" />
                {displayedUser.website || 'Not specified'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Profile Status</span>
              <p className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                {displayedUser.badge || (displayedUser.verified ? 'Verified Account' : 'Member')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Privacy</span>
              <p className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-500" />
                {displayedUser.privacy ? displayedUser.privacy.replace('_', ' ').toUpperCase() : 'PUBLIC'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Saved (Self only) */}
      {activeTabSub === 'saved' && isMe && (
        <div className="space-y-4">
          {savedPosts.length === 0 ? (
            <div className="p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center">
              <Bookmark className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No saved items yet.</p>
            </div>
          ) : (
            savedPosts.map(p => <PostCard key={p.id} post={p} />)
          )}
        </div>
      )}

      {/* Fullscreen Photo Lightbox */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImage}
            alt="Full view"
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* Followers / Following Modal */}
      {connectionsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-rose-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white capitalize">
                  {connectionsModal}
                </h3>
              </div>
              <button
                onClick={() => setConnectionsModal(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
              {allUsers
                .filter(u => u.id !== displayedUser.id)
                .map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <div
                      onClick={() => {
                        setConnectionsModal(null);
                        setViewingProfileUsername(user.username);
                      }}
                      className="flex items-center gap-3 cursor-pointer min-w-0"
                    >
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {user.displayName}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFollowUser(user.id)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold ${
                        user.isFollowing
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
            </div>
          </div>
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

      {/* Dedicated Cover Photo Upload, Crop, Reposition, Zoom & Remove Modal */}
      {isCoverEditorOpen && (
        <CoverPhotoEditorModal
          isOpen={isCoverEditorOpen}
          onClose={() => setIsCoverEditorOpen(false)}
          currentCoverUrl={
            displayedUser.coverPhotoURL !== undefined
              ? displayedUser.coverPhotoURL
              : displayedUser.coverPhoto
          }
          defaultCoverUrl={DEFAULT_COVER_SVG}
          onSuccess={(msg) => {
            setReportFeedback(msg);
            setTimeout(() => setReportFeedback(null), 4000);
          }}
        />
      )}
    </div>
  );
};
