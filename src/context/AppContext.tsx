import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  User,
  Post,
  Comment,
  Story,
  Reel,
  Note,
  Conversation,
  Message,
  Group,
  SocialEvent,
  NotificationItem,
  LiveStream,
  CreatorAnalytics,
  ContentReport,
  ReactionType,
  SupportedLanguage
} from '../types/index.ts';

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

  // Current User
  currentUser: User | null;
  updateCurrentUserProfile: (data: Partial<User>) => Promise<void>;

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
  sendMessage: (convId: string, text: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'voice' | 'file') => Promise<void>;
  startChatWithUser: (user: User) => void;

  // Call simulator
  activeCall: { user: User; type: 'video' | 'audio'; isIncoming?: boolean } | null;
  startCall: (user: User, type: 'video' | 'audio') => void;
  endCall: () => void;

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

// Simple dictionary for translations
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
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('yourbby_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark'; // Default to modern sleek dark mode
  });

  // Language state
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

  // Sync theme with DOM documentElement
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

  // Data states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
  const [activeCall, setActiveCall] = useState<{ user: User; type: 'video' | 'audio'; isIncoming?: boolean } | null>(null);

  const openCreateModal = (tab: 'post' | 'story' | 'reel' | 'live' | 'note' = 'post') => {
    setCreateModalInitialTab(tab);
    setIsCreateModalOpen(true);
  };

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, feedRes, storiesRes, reelsRes, notesRes, convsRes, groupsRes, eventsRes, notifsRes, liveRes, anaRes, adminRes] = await Promise.all([
          fetch('/api/me').then(r => r.json()),
          fetch('/api/feed?type=for-you').then(r => r.json()),
          fetch('/api/stories').then(r => r.json()),
          fetch('/api/reels').then(r => r.json()),
          fetch('/api/notes').then(r => r.json()),
          fetch('/api/messages/conversations').then(r => r.json()),
          fetch('/api/groups').then(r => r.json()),
          fetch('/api/events').then(r => r.json()),
          fetch('/api/notifications').then(r => r.json()),
          fetch('/api/live').then(r => r.json()),
          fetch('/api/analytics').then(r => r.json()),
          fetch('/api/admin/overview').then(r => r.json()),
        ]);

        if (meRes.success) setCurrentUser(meRes.user);
        if (feedRes.success) setPosts(feedRes.posts);
        if (storiesRes.success) setStories(storiesRes.stories);
        if (reelsRes.success) setReels(reelsRes.reels);
        if (notesRes.success) setNotes(notesRes.notes);
        if (convsRes.success) setConversations(convsRes.conversations);
        if (groupsRes.success) setGroups(groupsRes.groups);
        if (eventsRes.success) setEvents(eventsRes.events);
        if (notifsRes.success) setNotifications(notifsRes.notifications);
        if (liveRes.success) setLiveStream(liveRes.liveStream);
        if (anaRes.success) setAnalytics(anaRes.analytics);
        if (adminRes.success) setAdminOverview(adminRes);
      } catch (err) {
        console.error('Initial load error:', err);
      }
    }
    loadData();
  }, []);

  // Reload feed on feedType change
  useEffect(() => {
    fetch(`/api/feed?type=${feedType}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setPosts(data.posts);
      })
      .catch(console.error);
  }, [feedType]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) {
      setActiveConversationMessages([]);
      return;
    }
    fetch(`/api/messages/conversations/${activeConversation.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setActiveConversationMessages(data.messages);
        }
      })
      .catch(console.error);
  }, [activeConversation]);

  // Profile update
  const updateCurrentUserProfile = async (data: Partial<User>) => {
    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setCurrentUser(json.user);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Posts operations
  const createPost = async (postData: any): Promise<Post> => {
    const res = await fetch('/api/posts', {
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
    // Optimistic update
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
      await fetch(`/api/posts/${postId}/react`, {
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
      await fetch(`/api/posts/${postId}/bookmark`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const deletePost = async (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    try {
      await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  };

  const votePoll = async (postId: string, optionId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/posts/${postId}/poll-vote`, {
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
      const res = await fetch(`/api/posts/${postId}/comments`, {
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
      const res = await fetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      return data.success ? data.comments : [];
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // Stories
  const createStory = async (storyData: any) => {
    const res = await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storyData),
    });
    const data = await res.json();
    if (data.success) {
      setStories(prev => [data.story, ...prev]);
    }
  };

  const markStorySeen = async (storyId: string) => {
    setStories(prev => prev.map(s => s.id === storyId ? { ...s, seen: true } : s));
    fetch(`/api/stories/${storyId}/view`, { method: 'POST' }).catch(console.error);
  };

  // Reels
  const createReel = async (reelData: any) => {
    const res = await fetch('/api/reels', {
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
    fetch(`/api/reels/${reelId}/like`, { method: 'POST' }).catch(console.error);
  };

  // Notes
  const createNote = async (text: string, musicSnippet?: string) => {
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, musicSnippet }),
    });
    const data = await res.json();
    if (data.success) {
      setNotes(prev => [data.note, ...prev.filter(n => n.author.id !== currentUser?.id)]);
    }
  };

  // Messages
  const sendMessage = async (convId: string, text: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'voice' | 'file') => {
    const res = await fetch(`/api/messages/conversations/${convId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mediaUrl, mediaType }),
    });
    const data = await res.json();
    if (data.success) {
      setActiveConversationMessages(prev => [...prev, data.message]);
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, lastMessage: data.message, updatedAt: data.message.createdAt } : c));
    }
  };

  const startChatWithUser = (user: User) => {
    // Check if conversation already exists
    let existing = conversations.find(c => !c.isGroup && c.participants.some(p => p.id === user.id));
    if (existing) {
      setActiveConversation(existing);
      setActiveTab('messages');
      return;
    }

    // create new client-side conversation
    const newConv: Conversation = {
      id: `conv_${Date.now()}`,
      isGroup: false,
      participants: [currentUser!, user],
      unreadCount: 0,
      updatedAt: new Date().toISOString()
    };
    setConversations(prev => [newConv, ...prev]);
    setActiveConversation(newConv);
    setActiveTab('messages');
  };

  // Calls
  const startCall = (user: User, type: 'video' | 'audio') => {
    setActiveCall({ user, type, isIncoming: false });
  };

  const endCall = () => {
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
    fetch(`/api/groups/${groupId}/join`, { method: 'POST' }).catch(console.error);
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
    fetch(`/api/events/${eventId}/rsvp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(console.error);
  };

  // Notifications
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const markAllNotificationsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    fetch('/api/notifications/mark-read', { method: 'POST' }).catch(console.error);
  };

  // Live
  const sendLiveChatMessage = async (text: string) => {
    if (!currentUser) return;
    const res = await fetch('/api/live/chat', {
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
    const res = await fetch(`/api/admin/reports/${reportId}/action`, {
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
    fetch(`/api/users/${userId}/follow`, { method: 'POST' }).catch(console.error);
  };

  const toggleFriendRequest = async (userId: string) => {
    fetch(`/api/users/${userId}/friend`, { method: 'POST' }).catch(console.error);
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
        currentUser,
        updateCurrentUserProfile,
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
        sendMessage,
        startChatWithUser,
        activeCall,
        startCall,
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
