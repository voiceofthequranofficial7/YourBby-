/**
 * Core type definitions for YourBby Social Network
 */

export type ReactionType = 'like' | 'love' | 'care' | 'haha' | 'wow' | 'sad' | 'angry';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  coverPhoto?: string;
  coverPhotoURL?: string;
  bio?: string;
  location?: string;
  website?: string;
  verified: boolean;
  role: 'user' | 'creator' | 'admin';
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  isOnline: boolean;
  isFollowing?: boolean;
  isFriend?: boolean;
  isFriendRequested?: boolean;
  isCloseFriend?: boolean;
  badge?: string;
  privacy?: 'public' | 'followers_only' | 'private';
  lastSeen?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
  votedUserIds: string[];
}

export interface Poll {
  question: string;
  options: PollOption[];
  totalVotes: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  text: string;
  createdAt: string;
  likesCount: number;
  hasLiked?: boolean;
  replies?: Comment[];
}

export interface Post {
  id: string;
  authorId: string;
  author: User;
  content: string;
  mediaUrls?: string[];
  mediaType?: 'image' | 'video';
  poll?: Poll;
  feeling?: {
    emoji: string;
    text: string;
  };
  locationName?: string;
  audience: 'public' | 'friends' | 'close_friends' | 'only_me';
  createdAt: string;
  likesCount: number;
  userReaction?: ReactionType | null;
  reactionCounts: Record<ReactionType, number>;
  commentsCount: number;
  repostsCount: number;
  isBookmarked?: boolean;
  isPinned?: boolean;
  tags?: string[];
}

export interface StoryViewerEntry {
  id: string;
  displayName: string;
  username: string;
  avatar: string;
  viewedAt: string;
}

export interface Story {
  id: string;
  author: User;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'text';
  textOverlay?: string;
  backgroundGradient?: string;
  privacy?: 'public' | 'friends' | 'close_friends';
  createdAt: string;
  expiresAt: string;
  seen: boolean;
  viewsCount: number;
  viewerIds?: string[];
  viewers?: StoryViewerEntry[];
  stickers?: {
    type: 'poll' | 'location' | 'mention' | 'music';
    text?: string;
    data?: any;
  }[];
}

export type SettingsSectionId =
  | 'account'
  | 'privacy'
  | 'notifications'
  | 'messages_calls'
  | 'audience_story'
  | 'saved_items'
  | 'language_appearance'
  | 'accessibility'
  | 'data_storage'
  | 'blocked_users'
  | 'help_support'
  | 'about_yourbby';

export interface Reel {
  id: string;
  author: User;
  videoUrl: string;
  thumbnailUrl: string;
  caption: string;
  audioTrack: {
    title: string;
    artist: string;
  };
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  hasLiked?: boolean;
  isBookmarked?: boolean;
  tags?: string[];
  createdAt: string;
}

export interface Note {
  id: string;
  author: User;
  text: string;
  musicSnippet?: string;
  createdAt: string;
  expiresAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: User;
  text: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  mediaType?: 'image' | 'video' | 'voice' | 'file';
  fileName?: string;
  fileSize?: number;
  voiceDurationSeconds?: number;
  voiceWaveform?: number[];
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  read: boolean;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  reactions?: {
    emoji: string;
    userId: string;
    userName?: string;
  }[];
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
    mediaType?: 'image' | 'video' | 'voice' | 'file';
  };
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name?: string;
  avatar?: string;
  participants: User[];
  participantIds?: string[];
  lastMessage?: Message;
  unreadCount: number;
  unreadCounts?: Record<string, number>;
  isPinned?: boolean;
  pinnedBy?: string[];
  isMuted?: boolean;
  mutedBy?: string[];
  isArchived?: boolean;
  archivedBy?: string[];
  deletedBy?: string[];
  typingUserIds?: string[];
  updatedAt: string;
}

export interface CallSession {
  id: string;
  conversationId?: string;
  callerId: string;
  caller: User;
  calleeId: string;
  callee: User;
  type: 'audio' | 'video';
  status: 'ringing' | 'connected' | 'rejected' | 'ended' | 'missed';
  startedAt: string;
  connectedAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  offer?: any;
  answer?: any;
  callerCandidates?: any[];
  calleeCandidates?: any[];
}

export interface Group {
  id: string;
  name: string;
  coverImage: string;
  description: string;
  category: string;
  privacy: 'public' | 'private';
  membersCount: number;
  isMember: boolean;
  isAdmin?: boolean;
  rules: string[];
  pinnedAnnouncement?: string;
  postsCount: number;
}

export interface SocialEvent {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  date: string;
  time: string;
  location: string;
  organizer: User;
  rsvpStatus?: 'going' | 'interested' | 'not_going' | null;
  attendeesCount: number;
}

export interface NotificationItem {
  id: string;
  type: 'like' | 'love' | 'care' | 'haha' | 'wow' | 'sad' | 'angry' | 'comment' | 'follow' | 'friend_request' | 'mention' | 'repost' | 'live' | 'admin' | 'message' | 'call';
  actor: User;
  postId?: string;
  reelId?: string;
  conversationId?: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface LiveStream {
  id: string;
  host: User;
  title: string;
  category: string;
  viewersCount: number;
  isLive: boolean;
  startedAt: string;
  chatMessages: {
    id: string;
    user: User;
    text: string;
    timestamp: string;
  }[];
}

export interface CreatorAnalytics {
  reach: number;
  impressions: number;
  followersGrowth: number;
  engagementRate: number;
  reelViews: number;
  estimatedEarningsINR: number;
  chartData: {
    date: string;
    views: number;
    interactions: number;
  }[];
}

export interface ContentReport {
  id: string;
  targetType: 'post' | 'user' | 'reel' | 'comment';
  targetId: string;
  targetPreview: string;
  reportedBy: User;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  timestamp: string;
}

export type SupportedLanguage = 'en' | 'hi' | 'bn';
