import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { collection, doc, getDoc, getDocs, onSnapshot, query, orderBy, setDoc } from 'firebase/firestore';
import { db, auth, compressImageDataUrl, sanitizeUserForFirestore } from '../firebase/config.ts';
import { apiFetch } from '../firebase/staticApiFallback.ts';
import type {
  User,
  Post,
  Comment,
  Story,
  Reel,
  Note,
  Conversation,
  Message,
  CallSession,
  Group,
  SocialEvent,
  NotificationItem,
  LiveStream,
  CreatorAnalytics,
  ContentReport,
  ReactionType,
  SupportedLanguage
} from '../types/index.ts';

export interface SendMessageOptions {
  mediaUrls?: string[];
  fileName?: string;
  fileSize?: number;
  voiceDurationSeconds?: number;
  voiceWaveform?: number[];
  replyTo?: Message['replyTo'];
}

interface AppContextType {
  // Theme & Language
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  viewingProfileUsername: string | null;
  setViewingProfileUsername: (username: string | null) => void;
  activeSettingsSection: string;
  setActiveSettingsSection: (section: string) => void;

  // Current User & Accounts
  currentUser: User | null;
  allUsers: User[];
  updateCurrentUserProfile: (data: Partial<User>) => Promise<void>;
  switchUserAccount: (userId: string) => Promise<void>;
  registerUserAccount: (data: Partial<User>) => Promise<User>;
  blockedUserIds: string[];
  toggleBlockUser: (userId: string) => void;

  // Feed & Posts
  posts: Post[];
  feedType: 'for-you' | 'following' | 'friends' | 'latest';
  setFeedType: (type: 'for-you' | 'following' | 'friends' | 'latest') => void;
  createPost: (postData: any) => Promise<Post>;
  reactToPost: (postId: string, reaction: ReactionType | null) => Promise<void>;
  bookmarkPost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  votePoll: (postId: string, optionId: string) => Promise<void>;
  addComment: (postId: string, text: string, replyToId?: string) => Promise<void>;
  getCommentsForPost: (postId: string) => Promise<Comment[]>;

  // Stories
  stories: Story[];
  createStory: (storyData: any) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
  activeStoryIndex: number | null;
  setActiveStoryIndex: (index: number | null) => void;
  markStorySeen: (storyId: string) => Promise<void>;

  // Reels
  reels: Reel[];
  createReel: (reelData: any) => Promise<void>;
  likeReel: (reelId: string) => Promise<void>;
  activeReelModal: Reel | null;
  setActiveReelModal: (reel: Reel | null) => void;

  // Notes
  notes: Note[];
  createNote: (text: string, musicSnippet?: string) => Promise<void>;

  // Messaging
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setActiveConversation: (conv: Conversation | null) => void;
  activeConversationMessages: Message[];
  totalUnreadMessagesCount: number;
  sendMessage: (
    convId: string,
    text: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video' | 'voice' | 'file',
    options?: SendMessageOptions
  ) => Promise<Message | null>;
  editMessage: (convId: string, msgId: string, newText: string) => Promise<void>;
  deleteMessage: (convId: string, msgId: string) => Promise<void>;
  reactToMessage: (convId: string, msgId: string, emoji: string) => Promise<void>;
  setTypingStatus: (convId: string, isTyping: boolean) => Promise<void>;
  togglePinConversation: (convId: string) => Promise<void>;
  toggleMuteConversation: (convId: string) => Promise<void>;
  toggleArchiveConversation: (convId: string) => Promise<void>;
  deleteConversation: (convId: string) => Promise<void>;
  startChatWithUser: (user: User) => Promise<Conversation | null>;

  // Real-Time WebRTC Voice & Video Calling
  activeCall: {
    user: User;
    type: 'video' | 'audio';
    isIncoming?: boolean;
    callSession?: CallSession;
  } | null;
  callHistory: CallSession[];
  startCall: (user: User, type: 'video' | 'audio', conversationId?: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => Promise<void>;

  // Groups & Events
  groups: Group[];
  toggleJoinGroup: (groupId: string) => Promise<void>;
  events: SocialEvent[];
  rsvpEvent: (eventId: string, status: 'going' | 'interested' | 'not_going') => Promise<void>;

  // Notifications
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  markAllNotificationsRead: () => Promise<void>;

  // Live Stream
  liveStream: LiveStream | null;
  isLiveModalOpen: boolean;
  setIsLiveModalOpen: (open: boolean) => void;
  sendLiveChatMessage: (text: string) => Promise<void>;

  // Creator & Admin
  analytics: CreatorAnalytics | null;
  adminOverview: { stats: any; reports: ContentReport[] } | null;
  handleReportAction: (reportId: string, action: 'resolve' | 'dismiss' | 'ban') => Promise<void>;

  // Modals
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  createModalInitialTab?: 'post' | 'story' | 'reel' | 'live' | 'note';
  openCreateModal: (tab?: 'post' | 'story' | 'reel' | 'live' | 'note') => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  // Global Follow / Friend
  toggleFollowUser: (userId: string) => Promise<void>;
  toggleFriendRequest: (userId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const translations: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    home: 'Home',
    explore: 'Explore',
    reels: 'Reels',
    messages: 'Messages',
    communities: 'Communities',
    events: 'Events',
    saved: 'Saved',
    memories: 'Memories',
    creatorStudio: 'Creator Studio',
    adminCenter: 'Admin Center',
    settings: 'Settings',
    profile: 'Profile',
    create: 'Create',
    forYou: 'For You',
    following: 'Following',
    friends: 'Friends',
    latest: 'Latest',
    whatsOnYourMind: "What's happening in your world?",
    sharePost: 'Post',
    like: 'Like',
    comment: 'Comment',
    share: 'Share',
    save: 'Save',
    searchPlaceholder: 'Search YourBby (creators, reels, tags...)',
    activeNow: 'Active Contacts',
    trending: 'Trending Now',
    suggestedForYou: 'Suggested for you',
    follow: 'Follow',
    viewAll: 'View all',
    createStory: 'Create story',
    yourStory: 'Your story',
    photos: 'Photos',
    videos: 'Videos',
    about: 'About',
    editProfile: 'Edit Profile',
  },
  hi: {
    home: 'होम',
    explore: 'खोजें',
    reels: 'रील्स',
    messages: 'संदेश',
    communities: 'समुदाय',
    events: 'इवेंट्स',
    saved: 'सहेजे गए',
    memories: 'यादें',
    creatorStudio: 'क्रिएटर स्टूडियो',
    adminCenter: 'एडमिन केंद्र',
    settings: 'सेटिंग्स',
    profile: 'प्रोफ़ाइल',
    create: 'बनाएं',
    forYou: 'आपके लिए',
    following: 'फॉलोइंग',
    friends: 'मित्र',
    latest: 'ताज़ा',
    whatsOnYourMind: 'आपकी दुनिया में क्या नया है?',
    sharePost: 'पोस्ट करें',
    like: 'पसंद',
    comment: 'टिप्पणी',
    share: 'शेयर',
    save: 'सेव',
    searchPlaceholder: 'YourBby पर खोजें (क्रिएटर, रील्स, टैग्स...)',
    activeNow: 'सक्रिय संपर्क',
    trending: 'ट्रेंडिंग',
    suggestedForYou: 'आपके लिए सुझाव',
    follow: 'फॉलो करें',
    viewAll: 'सभी देखें',
    createStory: 'स्टोरी बनाएं',
    yourStory: 'आपकी स्टोरी',
    photos: 'फ़ोटो',
    videos: 'वीडियो',
    about: 'परिचय',
    editProfile: 'प्रोफ़ाइल संपादित करें',
  },
  bn: {
    home: 'হোম',
    explore: 'অন্বেষণ',
    reels: 'রিলস',
    messages: 'মেসেজ',
    communities: 'কমিউনিটি',
    events: 'ইভেন্ট',
    saved: 'সংরক্ষিত',
    memories: 'স্মৃতি',
    creatorStudio: 'ক্রিয়েটর স্টুডিও',
    adminCenter: 'এডমিন সেন্টার',
    settings: 'সেটিংস',
    profile: 'প্রোফাইল',
    create: 'তৈরি করুন',
    forYou: 'আপনার জন্য',
    following: 'অনুসরণ করছেন',
    friends: 'বন্ধু',
    latest: 'সাম্প্রতিক',
    whatsOnYourMind: 'আপনার জগতে নতুন কী ঘটছে?',
    sharePost: 'পোস্ট করুন',
    like: 'পছন্দ',
    comment: 'মন্তব্য',
    share: 'শেয়ার',
    save: 'সংরক্ষণ',
    searchPlaceholder: 'YourBby-তে খুঁজুন (ক্রিয়েটর, রিল, ট্যাগ...)',
    activeNow: 'সক্রিয় পরিচিতি',
    trending: 'চলতি ট্রেন্ড',
    suggestedForYou: 'আপনার জন্য প্রস্তাবিত',
    follow: 'অনুসরণ',
    viewAll: 'সব দেখুন',
    createStory: 'স্টোরি তৈরি করুন',
    yourStory: 'আপনার স্টোরি',
    photos: 'ছবি',
    videos: 'ভিডিও',
    about: 'সম্পর্কে',
    editProfile: 'প্রোফাইল সম্পাদনা',
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('yourbby_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark';
  });

  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('yourbby_lang') as SupportedLanguage;
    return saved || 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('yourbby_lang', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('yourbby_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [viewingProfileUsername, setViewingProfileUsername] = useState<string | null>(null);
  const [activeSettingsSection, setActiveSettingsSection] = useState<string>('account');
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('yourbby_blocked_users');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const toggleBlockUser = (userId: string) => {
    setBlockedUserIds(prev => {
      const next = prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId];
      localStorage.setItem('yourbby_blocked_users', JSON.stringify(next));
      return next;
    });
  };

  // Data states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [feedType, setFeedType] = useState<'for-you' | 'following' | 'friends' | 'latest'>('for-you');
  const [stories, setStories] = useState<Story[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [reels, setReels] = useState<Reel[]>([]);
  const [activeReelModal, setActiveReelModal] = useState<Reel | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeConversationMessages, setActiveConversationMessages] = useState<Message[]>([]);
  const [callHistory, setCallHistory] = useState<CallSession[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [events, setEvents] = useState<SocialEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [liveStream, setLiveStream] = useState<LiveStream | null>(null);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
  const [adminOverview, setAdminOverview] = useState<{ stats: any; reports: ContentReport[] } | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialTab, setCreateModalInitialTab] = useState<'post' | 'story' | 'reel' | 'live' | 'note'>('post');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    user: User;
    type: 'video' | 'audio';
    isIncoming?: boolean;
    callSession?: CallSession;
  } | null>(null);

  const lastNotifiedMessageIdRef = useRef<string | null>(null);
  const activeConversationRef = useRef<Conversation | null>(null);
  activeConversationRef.current = activeConversation;

  const openCreateModal = (tab: 'post' | 'story' | 'reel' | 'live' | 'note' = 'post') => {
    setCreateModalInitialTab(tab);
    setIsCreateModalOpen(true);
  };

  // Load all initial data
  const loadAllData = useCallback(async () => {
    try {
      const [
        meRes,
        usersRes,
        feedRes,
        storiesRes,
        reelsRes,
        notesRes,
        convsRes,
        callsRes,
        groupsRes,
        eventsRes,
        notifsRes,
        liveRes,
        anaRes,
        adminRes
      ] = await Promise.all([
        apiFetch('/api/me').then(r => r.json()),
        apiFetch('/api/users').then(r => r.json()),
        apiFetch('/api/feed?type=for-you').then(r => r.json()),
        apiFetch('/api/stories').then(r => r.json()),
        apiFetch('/api/reels').then(r => r.json()),
        apiFetch('/api/notes').then(r => r.json()),
        apiFetch('/api/messages/conversations').then(r => r.json()),
        apiFetch('/api/calls').then(r => r.json()).catch(() => ({ success: false })),
        apiFetch('/api/groups').then(r => r.json()),
        apiFetch('/api/events').then(r => r.json()),
        apiFetch('/api/notifications').then(r => r.json()),
        apiFetch('/api/live').then(r => r.json()),
        apiFetch('/api/analytics').then(r => r.json()),
        apiFetch('/api/admin/overview').then(r => r.json()),
      ]);

      // Merge saved Firestore user profiles (including coverPhotoURL) on boot, refresh, and login
      const firestoreUsersMap = new Map<string, Partial<User>>();
      try {
        const snap = await getDocs(collection(db, 'users'));
        snap.forEach(d => {
          const data = d.data() as Partial<User>;
          const id = data.id || d.id;
          const resolvedCover =
            data.coverPhotoURL !== undefined ? data.coverPhotoURL : data.coverPhoto;
          firestoreUsersMap.set(id, {
            ...data,
            id,
            ...(resolvedCover !== undefined
              ? { coverPhotoURL: resolvedCover, coverPhoto: resolvedCover }
              : {})
          });
        });
      } catch (fsErr) {
        console.warn('Firestore users load notice:', fsErr);
      }

      if (meRes.success && meRes.user) {
        const fsMe = firestoreUsersMap.get(meRes.user.id);
        const mergedMe: User = fsMe ? { ...meRes.user, ...fsMe } : meRes.user;
        let resolvedCover =
          mergedMe.coverPhotoURL !== undefined
            ? mergedMe.coverPhotoURL
            : (mergedMe.coverPhoto ?? '');

        let needsCompactSync = false;
        if (
          typeof mergedMe.avatar === 'string' &&
          mergedMe.avatar.startsWith('data:image/') &&
          mergedMe.avatar.length > 120000
        ) {
          mergedMe.avatar = await compressImageDataUrl(mergedMe.avatar, 320, 320, 110000);
          needsCompactSync = true;
        }
        if (
          typeof resolvedCover === 'string' &&
          resolvedCover.startsWith('data:image/') &&
          resolvedCover.length > 240000
        ) {
          resolvedCover = await compressImageDataUrl(resolvedCover, 1200, 400, 220000);
          needsCompactSync = true;
        }

        mergedMe.coverPhotoURL = resolvedCover;
        mergedMe.coverPhoto = resolvedCover;
        setCurrentUser(mergedMe);
        sessionStorage.setItem('yourbby_active_user_id', mergedMe.id);

        // Ensure backend memory/disk is in sync if Firestore had a newer coverPhotoURL or legacy image was compacted
        if (
          needsCompactSync ||
          (fsMe && fsMe.coverPhotoURL !== undefined && fsMe.coverPhotoURL !== meRes.user.coverPhoto)
        ) {
          apiFetch('/api/me', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              avatar: mergedMe.avatar,
              coverPhotoURL: resolvedCover,
              coverPhoto: resolvedCover
            })
          }).catch(() => {});
        }
      }

      if (usersRes.success) {
        const mergedUsers = (usersRes.users || []).map((u: User) => {
          const fsU = firestoreUsersMap.get(u.id);
          const merged = fsU ? { ...u, ...fsU } : u;
          const resolvedCover =
            merged.coverPhotoURL !== undefined ? merged.coverPhotoURL : (merged.coverPhoto ?? '');
          return {
            ...merged,
            coverPhotoURL: resolvedCover,
            coverPhoto: resolvedCover
          };
        });
        setAllUsers(mergedUsers);
      }
      if (feedRes.success) setPosts(feedRes.posts);
      if (storiesRes.success) setStories(storiesRes.stories);
      if (reelsRes.success) setReels(reelsRes.reels);
      if (notesRes.success) setNotes(notesRes.notes);
      if (convsRes.success) {
        const convList: Conversation[] = convsRes.conversations || [];
        setConversations(convList);
        if ( convList.length > 0 && convList[0].lastMessage ) {
          lastNotifiedMessageIdRef.current = convList[0].lastMessage.id;
        }
      }
      if (callsRes.success && Array.isArray(callsRes.calls)) {
        setCallHistory(callsRes.calls);
      }
      if (groupsRes.success) setGroups(groupsRes.groups);
      if (eventsRes.success) setEvents(eventsRes.events);
      if (notifsRes.success) setNotifications(notifsRes.notifications);
      if (liveRes.success) setLiveStream(liveRes.liveStream);
      if (anaRes.success) setAnalytics(anaRes.analytics);
      if (adminRes.success) setAdminOverview(adminRes);
    } catch (err) {
      console.error('Initial load error:', err);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Real-time synchronization loop for conversations, active chat messages, presence, and incoming calls
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(async () => {
      try {
        const [convsRes, usersRes, callsRes] = await Promise.all([
          apiFetch('/api/messages/conversations').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/users').then(r => r.json()).catch(() => ({ success: false })),
          apiFetch('/api/calls').then(r => r.json()).catch(() => ({ success: false }))
        ]);

        if (usersRes.success && Array.isArray(usersRes.users)) {
          setAllUsers(prev =>
            usersRes.users.map((u: User) => {
              const existing = prev.find(p => p.id === u.id);
              const resolvedCover =
                u.coverPhotoURL !== undefined
                  ? u.coverPhotoURL
                  : (u.coverPhoto ?? existing?.coverPhotoURL ?? existing?.coverPhoto ?? '');
              return {
                ...u,
                coverPhotoURL: resolvedCover,
                coverPhoto: resolvedCover
              };
            })
          );
        }

        if (convsRes.success && Array.isArray(convsRes.conversations)) {
          const updatedConvs: Conversation[] = convsRes.conversations;
          setConversations(updatedConvs);

          // Update activeConversation metadata (e.g., typingUserIds, online status, mute/pin state)
          const currentActive = activeConversationRef.current;
          if (currentActive) {
            const matched = updatedConvs.find(c => c.id === currentActive.id);
            if (matched) {
              setActiveConversation(matched);
            }
          }

          // Check for new incoming message to trigger browser notification if not muted
          const newestWithUnread = updatedConvs.find(
            c => c.unreadCount > 0 && c.lastMessage && c.lastMessage.senderId !== currentUser.id
          );
          if (
            newestWithUnread &&
            newestWithUnread.lastMessage &&
            newestWithUnread.lastMessage.id !== lastNotifiedMessageIdRef.current
          ) {
            lastNotifiedMessageIdRef.current = newestWithUnread.lastMessage.id;
            const notificationsEnabled = localStorage.getItem('yourbby_msg_notifications') !== 'false';
            if (
              notificationsEnabled &&
              !newestWithUnread.isMuted &&
              typeof window !== 'undefined' &&
              'Notification' in window &&
              Notification.permission === 'granted'
            ) {
              try {
                new Notification(`New message from ${newestWithUnread.lastMessage.sender.displayName}`, {
                  body: newestWithUnread.lastMessage.text || 'Sent an attachment',
                  icon: newestWithUnread.lastMessage.sender.avatar
                });
              } catch (_) {}
            }
          }
        }

        // Sync active conversation messages
        const currentActive = activeConversationRef.current;
        if (currentActive) {
          const msgRes = await apiFetch(`/api/messages/conversations/${currentActive.id}`).then(r => r.json()).catch(() => ({ success: false }));
          if (msgRes.success && Array.isArray(msgRes.messages)) {
            setActiveConversationMessages(msgRes.messages);
          }
        }

        // Check incoming WebRTC call or call history updates
        if (callsRes.success) {
          if (Array.isArray(callsRes.calls)) {
            setCallHistory(callsRes.calls);
          }
          if (callsRes.incomingCall && !activeCall) {
            const inc: CallSession = callsRes.incomingCall;
            setActiveCall({
              user: inc.caller,
              type: inc.type,
              isIncoming: true,
              callSession: inc
            });
          }
        }
      } catch (_) {}
    }, 2000);

    return () => clearInterval(interval);
  }, [currentUser, activeCall]);

  // Firestore real-time listener when activeConversation is selected and Firebase Auth is active
  useEffect(() => {
    if (!activeConversation) {
      setActiveConversationMessages([]);
      return;
    }

    apiFetch(`/api/messages/conversations/${activeConversation.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.messages)) {
          setActiveConversationMessages(data.messages);
          setConversations(prev =>
            prev.map(c => (c.id === activeConversation.id ? { ...c, unreadCount: 0 } : c))
          );
        }
      })
      .catch(console.error);

    if (auth.currentUser) {
      const q = query(
        collection(db, 'conversations', activeConversation.id, 'messages'),
        orderBy('createdAt', 'asc')
      );
      const unsub = onSnapshot(
        q,
        snap => {
          if (!snap.empty) {
            const fsMsgs: Message[] = [];
            snap.forEach(d => fsMsgs.push(d.data() as Message));
            setActiveConversationMessages(prev => {
              const map = new Map<string, Message>();
              prev.forEach(m => map.set(m.id, m));
              fsMsgs.forEach(m => map.set(m.id, m));
              return Array.from(map.values()).sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
              );
            });
          }
        },
        () => {}
      );
      return () => unsub();
    }
  }, [activeConversation?.id]);

  // Reload feed on feedType change
  useEffect(() => {
    apiFetch(`/api/feed?type=${feedType}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setPosts(data.posts);
      })
      .catch(console.error);
  }, [feedType]);

  // Profile update — One User, One Profile canonical state propagation + Firestore persistence
  const updateCurrentUserProfile = async (data: Partial<User>) => {
    const payload: Partial<User> = { ...data };

    // Compress avatar if it is an oversized Data URL
    if (
      typeof payload.avatar === 'string' &&
      payload.avatar.startsWith('data:image/') &&
      payload.avatar.length > 120000
    ) {
      payload.avatar = await compressImageDataUrl(payload.avatar, 320, 320, 110000);
    }

    if (payload.coverPhotoURL !== undefined || payload.coverPhoto !== undefined) {
      let resolvedCover =
        payload.coverPhotoURL !== undefined ? payload.coverPhotoURL : payload.coverPhoto;
      if (
        typeof resolvedCover === 'string' &&
        resolvedCover.startsWith('data:image/') &&
        resolvedCover.length > 240000
      ) {
        resolvedCover = await compressImageDataUrl(resolvedCover, 1200, 400, 220000);
      }
      payload.coverPhotoURL = resolvedCover ?? '';
      payload.coverPhoto = resolvedCover ?? '';
    }

    const res = await apiFetch('/api/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success || !json.user) {
      throw new Error(json.error || 'Failed to update profile');
    }

    const updatedUser: User = {
      ...json.user,
      coverPhotoURL:
        json.user.coverPhotoURL !== undefined
          ? json.user.coverPhotoURL
          : (json.user.coverPhoto ?? ''),
      coverPhoto:
        json.user.coverPhoto !== undefined
          ? json.user.coverPhoto
          : (json.user.coverPhotoURL ?? '')
    };

    // Persist to Firestore users/{userId} document with sanitized size (< 1 MiB) and dedicated coverPhotoURL field
    const targetDocId = updatedUser.id;
    const firestorePayload = await sanitizeUserForFirestore(updatedUser);
    await setDoc(doc(db, 'users', targetDocId), firestorePayload, { merge: true });

    // If sanitizeUserForFirestore compressed a legacy oversized avatar or coverPhotoURL in currentUser, sync it
    if (typeof firestorePayload.avatar === 'string') {
      updatedUser.avatar = firestorePayload.avatar;
    }
    if (typeof firestorePayload.coverPhotoURL === 'string') {
      updatedUser.coverPhotoURL = firestorePayload.coverPhotoURL;
      updatedUser.coverPhoto = firestorePayload.coverPhotoURL;
    }

    // Verify Firestore document update
    const verifySnap = await getDoc(doc(db, 'users', targetDocId));
    if (verifySnap.exists()) {
      const fsUser = verifySnap.data() as User;
      if (fsUser.coverPhotoURL !== undefined) {
        updatedUser.coverPhotoURL = fsUser.coverPhotoURL;
        updatedUser.coverPhoto = fsUser.coverPhotoURL;
      }
    }

    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
    setPosts(prev =>
      prev.map(p =>
        p.authorId === updatedUser.id || p.author.id === updatedUser.id
          ? { ...p, author: updatedUser }
          : p
      )
    );
    setStories(prev =>
      prev.map(s => (s.author.id === updatedUser.id ? { ...s, author: updatedUser } : s))
    );
    setReels(prev =>
      prev.map(r => (r.author.id === updatedUser.id ? { ...r, author: updatedUser } : r))
    );
    setConversations(prev =>
      prev.map(c => ({
        ...c,
        participants: c.participants.map(p => (p.id === updatedUser.id ? updatedUser : p)),
      }))
    );
  };

  // Switch between real accounts (e.g. Owner Mohammad Siraj vs Second User Account)
  const switchUserAccount = async (userId: string) => {
    sessionStorage.setItem('yourbby_active_user_id', userId);
    localStorage.setItem('yourbby_active_user_id', userId);
    const res = await apiFetch('/api/auth/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();
    if (data.success && data.user) {
      setCurrentUser(data.user);
      setActiveConversation(null);
      setActiveConversationMessages([]);
      await loadAllData();
    }
  };

  // Register a new persistent user account
  const registerUserAccount = async (userData: Partial<User>): Promise<User> => {
    const res = await apiFetch('/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to register user account');
    }
    sessionStorage.setItem('yourbby_active_user_id', data.user.id);
    localStorage.setItem('yourbby_active_user_id', data.user.id);
    setCurrentUser(data.user);
    if (Array.isArray(data.users)) {
      setAllUsers(data.users);
    }
    setActiveConversation(null);
    setActiveConversationMessages([]);
    await loadAllData();
    return data.user;
  };

  // Posts operations
  const createPost = async (postData: any): Promise<Post> => {
    const res = await apiFetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    });
    const json = await res.json();
    if (json.success && json.post) {
      setPosts(prev => [json.post, ...prev]);
      return json.post;
    }
    throw new Error(json.error || 'Failed to create post');
  };

  const reactToPost = async (postId: string, reaction: ReactionType | null) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const prevReaction = p.userReaction;
      const newCounts = { ...p.reactionCounts };
      let newLikes = p.likesCount;

      if (prevReaction && newCounts[prevReaction] > 0) {
        newCounts[prevReaction]--;
        newLikes = Math.max(0, newLikes - 1);
      }

      if (reaction && reaction !== prevReaction) {
        newCounts[reaction] = (newCounts[reaction] || 0) + 1;
        newLikes++;
      }

      return {
        ...p,
        userReaction: reaction === prevReaction ? null : reaction,
        reactionCounts: newCounts,
        likesCount: newLikes
      };
    }));

    try {
      await apiFetch(`/api/posts/${postId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const bookmarkPost = async (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p));
    try {
      await apiFetch(`/api/posts/${postId}/bookmark`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const deletePost = async (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  const votePoll = async (postId: string, optionId: string) => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(`/api/posts/${postId}/poll-vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optionId }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, poll: data.poll } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addComment = async (postId: string, text: string, replyToId?: string) => {
    try {
      const res = await apiFetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, replyToId }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getCommentsForPost = async (postId: string): Promise<Comment[]> => {
    try {
      const res = await apiFetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      return data.success ? data.comments : [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // Stories
  const createStory = async (storyData: any) => {
    const res = await apiFetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storyData),
    });
    const data = await res.json();
    if (data.success && data.story) {
      setStories(prev => [data.story, ...prev]);
      if (auth.currentUser) {
        setDoc(doc(db, 'stories', data.story.id), data.story, { merge: true }).catch(() => {});
      }
    }
  };

  const deleteStory = async (storyId: string) => {
    setStories(prev => prev.filter(s => s.id !== storyId));
    try {
      await apiFetch(`/api/stories/${storyId}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  const markStorySeen = async (storyId: string) => {
    setStories(prev =>
      prev.map(s => {
        if (s.id !== storyId) return s;
        const viewerIds = Array.isArray(s.viewerIds) ? [...s.viewerIds] : [];
        const viewers = Array.isArray(s.viewers) ? [...s.viewers] : [];
        if (currentUser && !viewerIds.includes(currentUser.id)) {
          viewerIds.push(currentUser.id);
          viewers.unshift({
            id: currentUser.id,
            displayName: currentUser.displayName,
            username: currentUser.username,
            avatar: currentUser.avatar,
            viewedAt: new Date().toISOString(),
          });
        }
        return {
          ...s,
          seen: true,
          viewerIds,
          viewers,
          viewsCount: Math.max(s.viewsCount + (s.seen ? 0 : 1), viewerIds.length),
        };
      })
    );
    apiFetch(`/api/stories/${storyId}/view`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data?.success && data.story) {
          setStories(prev => prev.map(s => (s.id === storyId ? data.story : s)));
        }
      })
      .catch(() => {});
  };

  // Reels
  const createReel = async (reelData: any) => {
    const res = await apiFetch('/api/reels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reelData),
    });
    const data = await res.json();
    if (data.success) {
      setReels(prev => [data.reel, ...prev]);
    }
  };

  const likeReel = async (reelId: string) => {
    setReels(prev => prev.map(r => {
      if (r.id !== reelId) return r;
      const nextLiked = !r.hasLiked;
      return {
        ...r,
        hasLiked: nextLiked,
        likesCount: r.likesCount + (nextLiked ? 1 : -1)
      };
    }));
    apiFetch(`/api/reels/${reelId}/like`, { method: 'POST' }).catch(console.error);
  };

  // Notes
  const createNote = async (text: string, musicSnippet?: string) => {
    const res = await apiFetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, musicSnippet }),
    });
    const data = await res.json();
    if (data.success) {
      setNotes(prev => [data.note, ...prev.filter(n => n.author.id !== currentUser?.id)]);
    }
  };

  // -------------------------------------------------------------
  // Complete Real-Time Messaging Operations
  // -------------------------------------------------------------
  const totalUnreadMessagesCount = conversations.reduce(
    (sum, c) => sum + (c.isArchived ? 0 : c.unreadCount || 0),
    0
  );

  const sendMessage = async (
    convId: string,
    text: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video' | 'voice' | 'file',
    options?: SendMessageOptions
  ): Promise<Message | null> => {
    const res = await apiFetch(`/api/messages/conversations/${convId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        mediaUrl,
        mediaType,
        mediaUrls: options?.mediaUrls,
        fileName: options?.fileName,
        fileSize: options?.fileSize,
        voiceDurationSeconds: options?.voiceDurationSeconds,
        voiceWaveform: options?.voiceWaveform,
        replyTo: options?.replyTo
      }),
    });
    const data = await res.json();
    if (data.success && data.message) {
      const msg: Message = data.message;
      setActiveConversationMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setConversations(prev => {
        const exists = prev.some(c => c.id === convId);
        if (!exists && data.conversation) {
          return [data.conversation, ...prev];
        }
        return prev.map(c =>
          c.id === convId
            ? { ...(data.conversation || c), lastMessage: msg, updatedAt: msg.createdAt }
            : c
        );
      });

      // Mirror to Firestore if signed in
      if (auth.currentUser) {
        const targetConv = conversations.find(c => c.id === convId) || data.conversation;
        if (targetConv) {
          setDoc(doc(db, 'conversations', convId), targetConv, { merge: true }).catch(() => {});
        }
        setDoc(doc(db, 'conversations', convId, 'messages', msg.id), msg, { merge: true }).catch(() => {});
      }

      return msg;
    }
    return null;
  };

  const editMessage = async (convId: string, msgId: string, newText: string) => {
    const res = await apiFetch(`/api/messages/${convId}/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newText }),
    });
    const data = await res.json();
    if (data.success && data.message) {
      setActiveConversationMessages(prev =>
        prev.map(m => (m.id === msgId ? data.message : m))
      );
      setConversations(prev =>
        prev.map(c =>
          c.id === convId && c.lastMessage?.id === msgId
            ? { ...c, lastMessage: data.message }
            : c
        )
      );
      if (auth.currentUser) {
        setDoc(doc(db, 'conversations', convId, 'messages', msgId), data.message, { merge: true }).catch(() => {});
      }
    }
  };

  const deleteMessage = async (convId: string, msgId: string) => {
    const res = await apiFetch(`/api/messages/${convId}/${msgId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (data.success && data.message) {
      setActiveConversationMessages(prev =>
        prev.map(m => (m.id === msgId ? data.message : m))
      );
      setConversations(prev =>
        prev.map(c =>
          c.id === convId && c.lastMessage?.id === msgId
            ? { ...c, lastMessage: data.message }
            : c
        )
      );
      if (auth.currentUser) {
        setDoc(doc(db, 'conversations', convId, 'messages', msgId), data.message, { merge: true }).catch(() => {});
      }
    }
  };

  const reactToMessage = async (convId: string, msgId: string, emoji: string) => {
    const res = await apiFetch(`/api/messages/${convId}/${msgId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reactionEmoji: emoji }),
    });
    const data = await res.json();
    if (data.success && data.message) {
      setActiveConversationMessages(prev =>
        prev.map(m => (m.id === msgId ? data.message : m))
      );
      if (auth.currentUser) {
        setDoc(doc(db, 'conversations', convId, 'messages', msgId), data.message, { merge: true }).catch(() => {});
      }
    }
  };

  const setTypingStatus = async (convId: string, isTyping: boolean) => {
    apiFetch(`/api/messages/conversations/${convId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isTyping }),
    }).catch(() => {});
  };

  const togglePinConversation = async (convId: string) => {
    const res = await apiFetch(`/api/messages/conversations/${convId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pin' }),
    });
    const data = await res.json();
    if (data.success && data.conversation) {
      setConversations(prev =>
        prev
          .map(c => (c.id === convId ? data.conversation : c))
          .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          })
      );
      if (activeConversation?.id === convId) {
        setActiveConversation(data.conversation);
      }
    }
  };

  const toggleMuteConversation = async (convId: string) => {
    const res = await apiFetch(`/api/messages/conversations/${convId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'mute' }),
    });
    const data = await res.json();
    if (data.success && data.conversation) {
      setConversations(prev => prev.map(c => (c.id === convId ? data.conversation : c)));
      if (activeConversation?.id === convId) {
        setActiveConversation(data.conversation);
      }
    }
  };

  const toggleArchiveConversation = async (convId: string) => {
    const res = await apiFetch(`/api/messages/conversations/${convId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'archive' }),
    });
    const data = await res.json();
    if (data.success && data.conversation) {
      setConversations(prev => prev.map(c => (c.id === convId ? data.conversation : c)));
      if (activeConversation?.id === convId) {
        setActiveConversation(data.conversation);
      }
    }
  };

  const deleteConversation = async (convId: string) => {
    const res = await apiFetch(`/api/messages/conversations/${convId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConversation?.id === convId) {
        setActiveConversation(null);
        setActiveConversationMessages([]);
      }
    }
  };

  const startChatWithUser = async (user: User): Promise<Conversation | null> => {
    try {
      const res = await apiFetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId: user.id, participant: user }),
      });
      const data = await res.json();
      if (data.success && data.conversation) {
        const conv: Conversation = data.conversation;
        setConversations(prev => {
          const exists = prev.some(c => c.id === conv.id);
          return exists ? prev.map(c => (c.id === conv.id ? conv : c)) : [conv, ...prev];
        });
        setActiveConversation(conv);
        if (Array.isArray(data.messages)) {
          setActiveConversationMessages(data.messages);
        }
        setActiveTab('messages');
        return conv;
      }
    } catch (e) {
      console.error('Failed to start conversation:', e);
    }
    return null;
  };

  // -------------------------------------------------------------
  // Real-Time WebRTC Voice & Video Calls
  // -------------------------------------------------------------
  const startCall = async (user: User, type: 'video' | 'audio', conversationId?: string) => {
    try {
      const res = await apiFetch('/api/calls/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calleeId: user.id,
          callee: user,
          type,
          conversationId: conversationId || activeConversation?.id
        }),
      });
      const data = await res.json();
      if (data.success && data.call) {
        setActiveCall({
          user,
          type,
          isIncoming: false,
          callSession: data.call
        });
        setCallHistory(prev => [data.call, ...prev]);
        if (auth.currentUser) {
          setDoc(doc(db, 'calls', data.call.id), data.call, { merge: true }).catch(() => {});
        }
        return;
      }
    } catch (e) {
      console.error('Call initiation error:', e);
    }
    setActiveCall({ user, type, isIncoming: false });
  };

  const acceptCall = async () => {
    if (!activeCall?.callSession) return;
    try {
      const res = await apiFetch(`/api/calls/${activeCall.callSession.id}/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'connected' }),
      });
      const data = await res.json();
      if (data.success && data.call) {
        setActiveCall(prev => (prev ? { ...prev, isIncoming: false, callSession: data.call } : null));
        setCallHistory(prev => prev.map(c => (c.id === data.call.id ? data.call : c)));
      }
    } catch (e) {
      console.error('Error accepting call:', e);
    }
  };

  const rejectCall = async () => {
    if (activeCall?.callSession) {
      try {
        const res = await apiFetch(`/api/calls/${activeCall.callSession.id}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'rejected' }),
        });
        const data = await res.json();
        if (data.success && data.call) {
          setCallHistory(prev => prev.map(c => (c.id === data.call.id ? data.call : c)));
        }
      } catch (_) {}
    }
    setActiveCall(null);
  };

  const endCall = async () => {
    if (activeCall?.callSession) {
      try {
        const res = await apiFetch(`/api/calls/${activeCall.callSession.id}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'ended' }),
        });
        const data = await res.json();
        if (data.success && data.call) {
          setCallHistory(prev => prev.map(c => (c.id === data.call.id ? data.call : c)));
        }
      } catch (_) {}
    }
    setActiveCall(null);
  };

  // Groups & Events
  const toggleJoinGroup = async (groupId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const nextMember = !g.isMember;
      return {
        ...g,
        isMember: nextMember,
        membersCount: g.membersCount + (nextMember ? 1 : -1)
      };
    }));
    apiFetch(`/api/groups/${groupId}/join`, { method: 'POST' }).catch(console.error);
  };

  const rsvpEvent = async (eventId: string, status: 'going' | 'interested' | 'not_going') => {
    setEvents(prev => prev.map(e => {
      if (e.id !== eventId) return e;
      const prevGoing = e.rsvpStatus === 'going';
      const nowGoing = status === 'going';
      let count = e.attendeesCount;
      if (!prevGoing && nowGoing) count++;
      if (prevGoing && !nowGoing) count = Math.max(0, count - 1);
      return { ...e, rsvpStatus: status, attendeesCount: count };
    }));
    apiFetch(`/api/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(console.error);
  };

  // Notifications
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const markAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    apiFetch('/api/notifications/mark-read', { method: 'POST' }).catch(console.error);
  };

  // Live
  const sendLiveChatMessage = async (text: string) => {
    if (!currentUser) return;
    const res = await apiFetch('/api/live/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (data.success && liveStream) {
      setLiveStream({
        ...liveStream,
        chatMessages: [...liveStream.chatMessages, data.message],
        viewersCount: liveStream.viewersCount + 1
      });
    }
  };

  // Admin Reports
  const handleReportAction = async (reportId: string, action: 'resolve' | 'dismiss' | 'ban') => {
    const res = await apiFetch(`/api/admin/reports/${reportId}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    const data = await res.json();
    if (data.success && adminOverview) {
      setAdminOverview({
        ...adminOverview,
        reports: adminOverview.reports.map(r => r.id === reportId ? data.report : r)
      });
    }
  };

  // Follow / Friend
  const toggleFollowUser = async (userId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.author.id === userId) {
        return { ...p, author: { ...p.author, isFollowing: !p.author.isFollowing } };
      }
      return p;
    }));
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const next = !u.isFollowing;
        return { ...u, isFollowing: next, followersCount: Math.max(0, u.followersCount + (next ? 1 : -1)) };
      }
      return u;
    }));
    apiFetch(`/api/users/${userId}/follow`, { method: 'POST' }).catch(console.error);
  };

  const toggleFriendRequest = async (userId: string) => {
    apiFetch(`/api/users/${userId}/friend`, { method: 'POST' }).catch(console.error);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        language,
        setLanguage,
        t,
        activeTab,
        setActiveTab,
        viewingProfileUsername,
        setViewingProfileUsername,
        activeSettingsSection,
        setActiveSettingsSection,
        currentUser,
        allUsers,
        updateCurrentUserProfile,
        switchUserAccount,
        registerUserAccount,
        blockedUserIds,
        toggleBlockUser,
        posts,
        feedType,
        setFeedType,
        createPost,
        reactToPost,
        bookmarkPost,
        deletePost,
        votePoll,
        addComment,
        getCommentsForPost,
        stories,
        createStory,
        deleteStory,
        activeStoryIndex,
        setActiveStoryIndex,
        markStorySeen,
        reels,
        createReel,
        likeReel,
        activeReelModal,
        setActiveReelModal,
        notes,
        createNote,
        conversations,
        activeConversation,
        setActiveConversation,
        activeConversationMessages,
        totalUnreadMessagesCount,
        sendMessage,
        editMessage,
        deleteMessage,
        reactToMessage,
        setTypingStatus,
        togglePinConversation,
        toggleMuteConversation,
        toggleArchiveConversation,
        deleteConversation,
        startChatWithUser,
        activeCall,
        callHistory,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        groups,
        toggleJoinGroup,
        events,
        rsvpEvent,
        notifications,
        unreadNotifsCount,
        markAllNotificationsRead,
        liveStream,
        isLiveModalOpen,
        setIsLiveModalOpen,
        sendLiveChatMessage,
        analytics,
        adminOverview,
        handleReportAction,
        isCreateModalOpen,
        setIsCreateModalOpen,
        createModalInitialTab,
        openCreateModal,
        isAuthModalOpen,
        setIsAuthModalOpen,
        toggleFollowUser,
        toggleFriendRequest,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
