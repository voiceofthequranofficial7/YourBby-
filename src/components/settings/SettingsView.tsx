import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import type { SettingsSectionId, SupportedLanguage } from '../../types/index.ts';
import {
  Settings,
  User,
  Lock,
  Bell,
  PhoneCall,
  Eye,
  Bookmark,
  Globe,
  Sliders,
  Database,
  UserX,
  HelpCircle,
  Info,
  LogOut,
  Check,
  Sun,
  Moon,
  Camera,
  Mic,
  Download,
  Trash2,
  Send,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton.tsx';
import { PostCard } from '../feed/PostCard.tsx';

export const SettingsView: React.FC = () => {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    currentUser,
    allUsers,
    updateCurrentUserProfile,
    posts,
    notifications,
    markAllNotificationsRead,
    activeSettingsSection,
    setActiveSettingsSection,
    blockedUserIds,
    toggleBlockUser,
    setIsAuthModalOpen,
    setActiveTab,
    setViewingProfileUsername
  } = useApp();

  // Account & Profile state
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [location, setLocation] = useState(currentUser?.location || '');
  const [website, setWebsite] = useState(currentUser?.website || '');

  // Privacy & Security state
  const [accountPrivacy, setAccountPrivacy] = useState<'public' | 'followers_only' | 'private'>(
    currentUser?.privacy || 'public'
  );
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  // Notifications state
  const [pushNotifs, setPushNotifs] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [storyReactionAlerts, setStoryReactionAlerts] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  // Messages & Calls state
  const [readReceipts, setReadReceipts] = useState(true);
  const [typingIndicators, setTypingIndicators] = useState(true);
  const [callPermissionWho, setCallPermissionWho] = useState<'everyone' | 'following' | 'nobody'>('everyone');
  const [deviceDiagnosticMsg, setDeviceDiagnosticMsg] = useState<string | null>(null);

  // Audience & Story Privacy state
  const [defaultPostAudience, setDefaultPostAudience] = useState<'public' | 'followers' | 'friends'>('public');
  const [defaultStoryPrivacy, setDefaultStoryPrivacy] = useState<'public' | 'friends' | 'close_friends'>('public');
  const [allowStorySharing, setAllowStorySharing] = useState(true);

  // Accessibility state
  const [textScale, setTextScale] = useState<'default' | 'large'>('default');
  const [reduceMotion, setReduceMotion] = useState(false);
  const [autoPlayVideos, setAutoPlayVideos] = useState(true);

  // Help & Support state
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');

  // Feedback banner
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setUsername(currentUser.username || '');
      setBio(currentUser.bio || '');
      setLocation(currentUser.location || '');
      setWebsite(currentUser.website || '');
      setAccountPrivacy(currentUser.privacy || 'public');
    }
  }, [currentUser]);

  const showSavedToast = (msg: string) => {
    setFeedbackBanner(msg);
    setTimeout(() => setFeedbackBanner(null), 3500);
  };

  const handleSaveAccountProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !username.trim()) return;
    await updateCurrentUserProfile({
      displayName: displayName.trim(),
      username: username.trim().replace(/^@/, ''),
      bio: bio.trim(),
      location: location.trim(),
      website: website.trim()
    });
    showSavedToast('Canonical account profile updated across YourBby.');
  };

  const handleSavePrivacy = async () => {
    await updateCurrentUserProfile({ privacy: accountPrivacy });
    showSavedToast('Privacy and security settings saved.');
  };

  const handleTestHardware = async (kind: 'camera' | 'microphone') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === 'camera' ? { video: true } : { audio: true }
      );
      stream.getTracks().forEach(t => t.stop());
      setDeviceDiagnosticMsg(`${kind === 'camera' ? 'Camera' : 'Microphone'} permission is active and verified.`);
    } catch (err: any) {
      setDeviceDiagnosticMsg(`${kind === 'camera' ? 'Camera' : 'Microphone'} access denied or unavailable: ${err?.message || 'Permission blocked'}`);
    }
  };

  const handleExportProfileData = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      platform: 'YourBby Global Social Network',
      user: currentUser,
      postsCount: posts.filter(p => p.author.id === currentUser?.id).length,
      savedCount: posts.filter(p => p.isBookmarked).length
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yourbby-profile-${currentUser?.username || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showSavedToast('Profile data archive downloaded.');
  };

  const categories: Array<{
    id: SettingsSectionId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'account', label: 'Account and Profile', icon: User },
    { id: 'privacy', label: 'Privacy and Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'messages_calls', label: 'Messages and Calls', icon: PhoneCall },
    { id: 'audience_story', label: 'Audience and Story Privacy', icon: Eye },
    { id: 'saved_items', label: 'Saved Items', icon: Bookmark },
    { id: 'language_appearance', label: 'Language and Appearance', icon: Globe },
    { id: 'accessibility', label: 'Accessibility', icon: Sliders },
    { id: 'data_storage', label: 'Data and Storage', icon: Database },
    { id: 'blocked_users', label: 'Blocked Users', icon: UserX },
    { id: 'help_support', label: 'Help and Support', icon: HelpCircle },
    { id: 'about_yourbby', label: 'About YourBby', icon: Info }
  ];

  const savedPosts = posts.filter(p => p.isBookmarked);

  return (
    <div className="w-full max-w-4xl mx-auto my-2 pb-10 space-y-4">
      {/* Header Banner */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-rose-500" />
            <span>Settings & Preferences</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            One unified control center for your canonical profile, privacy, stories, calls, and app preferences.
          </p>
        </div>
        <button
          onClick={() => {
            setViewingProfileUsername(currentUser?.username || null);
            setActiveTab('profile');
          }}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2 self-start sm:self-auto"
        >
          <img
            src={currentUser?.avatar}
            alt={currentUser?.displayName}
            className="w-5 h-5 rounded-full object-cover"
          />
          <span>View My Profile</span>
        </button>
      </div>

      {feedbackBanner && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{feedbackBanner}</span>
        </div>
      )}

      {/* Master-Detail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Left Category Navigation */}
        <div className="md:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-2.5 space-y-1">
          {categories.map(cat => {
            const Icon = cat.icon;
            const active = activeSettingsSection === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveSettingsSection(cat.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-rose-500'}`} />
                  <span className="truncate">{cat.label}</span>
                </span>
                <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
              </button>
            );
          })}

          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <span className="flex items-center gap-2.5">
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Active Screen Content */}
        <div className="md:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs">
          {/* 1. ACCOUNT AND PROFILE */}
          {activeSettingsSection === 'account' && (
            <form onSubmit={handleSaveAccountProfile} className="space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Account and Profile
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Updates here immediately sync across your profile, posts, stories, and messages.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Username (@handle)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Website
                  </label>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Canonical User ID: {currentUser?.id}
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 text-white text-xs font-bold shadow-md shadow-rose-500/20"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}

          {/* 2. PRIVACY AND SECURITY */}
          {activeSettingsSection === 'privacy' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Privacy and Security
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control who can view your profile and safeguard your account with 2FA.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white block">
                  Profile Visibility
                </label>
                <select
                  value={accountPrivacy}
                  onChange={(e) => setAccountPrivacy(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="public">Public — Anyone on YourBby can view your posts</option>
                  <option value="followers_only">Followers Only — Only approved followers</option>
                  <option value="private">Private — Locked profile</option>
                </select>
              </div>

              {[
                {
                  title: 'Two-Factor Authentication (2FA)',
                  desc: 'Require a verification code when signing in from unrecognized devices.',
                  val: twoFactorAuth,
                  setVal: setTwoFactorAuth
                },
                {
                  title: 'Unrecognized Login Alerts',
                  desc: 'Receive instant alerts if someone signs into your account.',
                  val: loginAlerts,
                  setVal: setLoginAlerts
                },
                {
                  title: 'Active Online Status',
                  desc: 'Show when you are active or recently active in Messages.',
                  val: showOnlineStatus,
                  setVal: setShowOnlineStatus
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => item.setVal(!item.val)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      item.val ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        item.val ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}

              <div className="flex justify-end">
                <button
                  onClick={handleSavePrivacy}
                  className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold"
                >
                  Save Privacy Settings
                </button>
              </div>
            </div>
          )}

          {/* 3. NOTIFICATIONS */}
          {activeSettingsSection === 'notifications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Notifications
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure real-time push alerts for likes, comments, stories, and messages.
                  </p>
                </div>
                <button
                  onClick={() => {
                    markAllNotificationsRead();
                    showSavedToast('All notifications marked as read.');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-rose-500"
                >
                  Mark All Read ({notifications.filter(n => !n.read).length})
                </button>
              </div>

              {[
                {
                  title: 'Push Notifications',
                  desc: 'Receive native browser and mobile notifications.',
                  val: pushNotifs,
                  setVal: setPushNotifs
                },
                {
                  title: 'Direct Messages & Calls',
                  desc: 'Alerts for incoming messages, voice notes, and audio/video calls.',
                  val: messageAlerts,
                  setVal: setMessageAlerts
                },
                {
                  title: 'Story Views & Reactions',
                  desc: 'Notify when someone reacts or replies to your 24-hour story.',
                  val: storyReactionAlerts,
                  setVal: setStoryReactionAlerts
                },
                {
                  title: 'Weekly Community Digest',
                  desc: 'Summary of top posts from people you follow.',
                  val: emailDigest,
                  setVal: setEmailDigest
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      item.setVal(!item.val);
                      showSavedToast('Notification preference updated.');
                    }}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      item.val ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        item.val ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 4. MESSAGES AND CALLS */}
          {activeSettingsSection === 'messages_calls' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Messages and Calls
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage read receipts, typing indicators, WebRTC calling permissions, and camera/mic access.
                </p>
              </div>

              {[
                {
                  title: 'Read Receipts',
                  desc: 'Let others see when you have read their messages.',
                  val: readReceipts,
                  setVal: setReadReceipts
                },
                {
                  title: 'Live Typing Indicators',
                  desc: 'Show when you are typing a response in 1-to-1 conversations.',
                  val: typingIndicators,
                  setVal: setTypingIndicators
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => item.setVal(!item.val)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      item.val ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        item.val ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white block">
                  Who can call me (Audio & Video)
                </label>
                <select
                  value={callPermissionWho}
                  onChange={(e) => setCallPermissionWho(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="everyone">Everyone on YourBby</option>
                  <option value="following">People I Follow</option>
                  <option value="nobody">No one (Disable incoming calls)</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Hardware Permission Check
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleTestHardware('camera')}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5 text-rose-500" />
                    <span>Verify Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestHardware('microphone')}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5"
                  >
                    <Mic className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Verify Microphone</span>
                  </button>
                </div>
                {deviceDiagnosticMsg && (
                  <p className="text-[11px] font-semibold text-emerald-500">{deviceDiagnosticMsg}</p>
                )}
              </div>
            </div>
          )}

          {/* 5. AUDIENCE AND STORY PRIVACY */}
          {activeSettingsSection === 'audience_story' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Audience and Story Privacy
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure default audience rules for your 24-hour stories and feed posts.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white block">
                  Default Story Privacy
                </label>
                <select
                  value={defaultStoryPrivacy}
                  onChange={(e) => {
                    setDefaultStoryPrivacy(e.target.value as any);
                    showSavedToast('Default story privacy updated.');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="public">Public (All followers & visitors)</option>
                  <option value="friends">Friends Only</option>
                  <option value="close_friends">Close Friends</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white block">
                  Default Post Audience
                </label>
                <select
                  value={defaultPostAudience}
                  onChange={(e) => {
                    setDefaultPostAudience(e.target.value as any);
                    showSavedToast('Default post audience updated.');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers</option>
                  <option value="friends">Friends</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Allow Story Replies via Messenger
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Viewers can send direct replies and reactions to your active stories.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowStorySharing(!allowStorySharing)}
                  className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                    allowStorySharing ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      allowStorySharing ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* 6. SAVED ITEMS */}
          {activeSettingsSection === 'saved_items' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Saved Items ({savedPosts.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Private collection of posts and media you have bookmarked.
                </p>
              </div>
              {savedPosts.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No bookmarked items yet. Tap the bookmark icon on any post to save it here.
                </div>
              ) : (
                <div className="space-y-4">
                  {savedPosts.map(p => (
                    <PostCard key={p.id} post={p} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7. LANGUAGE AND APPEARANCE */}
          {activeSettingsSection === 'language_appearance' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Language and Appearance
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize YourBby’s dark navy & pink-purple theme or switch interface language.
                </p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Theme Mode</p>
                  <p className="text-[11px] text-slate-400">
                    Active theme: {theme === 'dark' ? 'YourBby Dark Navy (Default)' : 'Clean Light Mode'}
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-2"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Switch to Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-indigo-500" />
                      <span>Switch to Dark</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white block">
                  Display Language
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { code: 'en', label: 'English', sub: 'Default' },
                    { code: 'bn', label: 'বাংলা', sub: 'Bengali' },
                    { code: 'hi', label: 'हिन्दी', sub: 'Hindi' }
                  ].map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguage(lang.code as SupportedLanguage);
                        showSavedToast(`Language switched to ${lang.label}.`);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        language === lang.code
                          ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <p className="text-xs font-bold">{lang.label}</p>
                      <p className="text-[10px] text-slate-400">{lang.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 8. ACCESSIBILITY */}
          {activeSettingsSection === 'accessibility' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Accessibility
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Adjust readability, motion reduction, and media playback behavior.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2">
                <label className="text-xs font-bold text-slate-900 dark:text-white block">
                  Text Size Scaling
                </label>
                <div className="flex gap-2">
                  {(['default', 'large'] as const).map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        setTextScale(size);
                        document.documentElement.style.fontSize = size === 'large' ? '17px' : '16px';
                        showSavedToast(`Text size set to ${size}.`);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold capitalize border ${
                        textScale === size
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {[
                {
                  title: 'Reduce Motion & Animations',
                  desc: 'Minimize story transitions and UI animations.',
                  val: reduceMotion,
                  setVal: setReduceMotion
                },
                {
                  title: 'Auto-Play Feed & Story Videos',
                  desc: 'Automatically play videos when visible on screen.',
                  val: autoPlayVideos,
                  setVal: setAutoPlayVideos
                }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => item.setVal(!item.val)}
                    className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                      item.val ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        item.val ? 'right-1' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 9. DATA AND STORAGE */}
          {activeSettingsSection === 'data_storage' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Data and Storage
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Manage local cache, download your canonical profile archive, or install the YourBby PWA.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Export Canonical Profile Archive (JSON)
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Download a portable copy of your profile metadata and activity counts.
                  </p>
                </div>
                <button
                  onClick={handleExportProfileData}
                  className="px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Clear Temporary Media Cache
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Frees up browser memory while keeping your account and posts intact.
                  </p>
                </div>
                <button
                  onClick={() => showSavedToast('Temporary media cache cleared.')}
                  className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Clear Cache</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-indigo-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Install YourBby App
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Add YourBby to your home screen for instant launch and full-screen experience.
                  </p>
                </div>
                <PWAInstallButton variant="compact" />
              </div>
            </div>
          )}

          {/* 10. BLOCKED USERS */}
          {activeSettingsSection === 'blocked_users' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Blocked Users ({blockedUserIds.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Blocked accounts cannot message you, call you, or appear in your home feed.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {allUsers
                  .filter(u => u.id !== currentUser?.id)
                  .map(user => {
                    const isBlocked = blockedUserIds.includes(user.id);
                    return (
                      <div
                        key={user.id}
                        className="py-3 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
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
                          onClick={() => {
                            toggleBlockUser(user.id);
                            showSavedToast(
                              isBlocked
                                ? `Unblocked @${user.username}`
                                : `Blocked @${user.username}`
                            );
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold ${
                            isBlocked
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-500/15 hover:text-rose-500'
                          }`}
                        >
                          {isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 11. HELP AND SUPPORT */}
          {activeSettingsSection === 'help_support' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Help and Support
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Contact YourBby Support or submit a Trust & Safety ticket.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!supportMessage.trim()) return;
                  setSupportSubject('');
                  setSupportMessage('');
                  showSavedToast('Support request submitted. Our team will respond shortly.');
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    Topic / Subject
                  </label>
                  <input
                    type="text"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder="e.g., Account verification, media upload, privacy question"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-300 block mb-1">
                    How can we help?
                  </label>
                  <textarea
                    rows={3}
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Describe your question or issue..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Support Ticket</span>
                </button>
              </form>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <p className="font-bold text-slate-900 dark:text-white">Compliance & Grievance Redressal</p>
                <p>Support Desk: support@yourbby.social</p>
                <p>Digital Personal Data Protection (DPDP) Compliant • Kolkata & Mumbai, India</p>
              </div>
            </div>
          )}

          {/* 12. ABOUT YOURBBY */}
          {activeSettingsSection === 'about_yourbby' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 p-1.5 border border-slate-800">
                  <img
                    src="/src/assets/images/yourbby_logo_mark_1793866710902.jpg"
                    alt="YourBby"
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    YourBby Global Social Network
                  </h2>
                  <p className="text-xs text-rose-500 font-bold">Version 2.5 • Production Release</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                YourBby is a next-generation social networking platform built with real-time messaging, 24-hour portrait stories, WebRTC audio/video calling, creator monetization, and canonical single-profile identity.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Founder & Lead Architect</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">Mohammad Siraj (@mohammadsiraj)</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Security Architecture</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Firebase Auth + Firestore + WebRTC
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
