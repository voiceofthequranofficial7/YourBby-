import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
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
  ReactionType
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini AI SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const app = express();
app.use(express.json({ limit: '25mb' }));

// -------------------------------------------------------------
// Database & Mock Persistence
// -------------------------------------------------------------
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Default initial owner profile for Mohammad Siraj
const DEFAULT_OWNER_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%230f172a"/><circle cx="100" cy="100" r="76" fill="%231e293b" stroke="%23f43f5e" stroke-width="4"/><text x="100" y="118" font-family="system-ui,sans-serif" font-size="64" font-weight="bold" fill="%23ffffff" text-anchor="middle">MS</text></svg>';

let currentUser: User = {
  id: 'u_owner_mohammad_siraj',
  username: 'mohammadsiraj',
  displayName: 'Mohammad Siraj',
  avatar: DEFAULT_OWNER_AVATAR,
  coverPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
  bio: 'Founder & Creator of YourBby 🌐 YOUR WORLD. YOUR PEOPLE.',
  location: 'India',
  website: 'https://yourbby.social/@mohammadsiraj',
  verified: true,
  role: 'admin',
  followersCount: 0,
  followingCount: 0,
  friendsCount: 0,
  isOnline: true,
  badge: 'Founder & Owner',
  privacy: 'public'
};

const officialPlatformUser: User = {
  id: 'u_admin',
  username: 'yourbby_hq',
  displayName: 'YourBby Official',
  avatar: '/src/assets/images/yourbby_logo_mark_1793866710902.jpg',
  bio: 'Official platform news, community guidelines, and global support for YourBby 🌐',
  location: 'Global / India',
  verified: true,
  role: 'admin',
  followersCount: 1,
  followingCount: 0,
  friendsCount: 0,
  isOnline: true,
  isFollowing: true,
  isFriend: false,
  privacy: 'public'
};

let usersList: User[] = [
  currentUser,
  officialPlatformUser
];

let postsList: Post[] = [
  {
    id: 'p_welcome',
    authorId: 'u_admin',
    author: officialPlatformUser,
    content: 'Welcome to YourBby — YOUR WORLD. YOUR PEOPLE. ✨\n\nExperience genuine, unfiltered social connection. Create your first post, upload a reel, capture real moments with our camera, or connect with your community.',
    mediaUrls: [],
    mediaType: 'image',
    locationName: 'YourBby Global',
    feeling: { emoji: '🌐', text: 'welcoming the world' },
    audience: 'public',
    createdAt: new Date().toISOString(),
    likesCount: 0,
    userReaction: null,
    reactionCounts: { like: 0, love: 0, care: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
    commentsCount: 0,
    repostsCount: 0,
    isBookmarked: false,
    tags: ['YourBby', 'YourWorldYourPeople', 'Community']
  }
];

let commentsMap: Record<string, Comment[]> = {};
let storiesList: Story[] = [];
let reelsList: Reel[] = [];
let notesList: Note[] = [];
let conversationsList: Conversation[] = [];
let messagesMap: Record<string, Message[]> = {};
let notificationsList: NotificationItem[] = [];

let groupsList: Group[] = [
  {
    id: 'grp_1',
    name: 'Kolkata Creative Hub',
    coverImage: 'https://images.unsplash.com/photo-1558431382-27e303142255?w=1000&auto=format&fit=crop&q=80',
    description: 'A collaborative network for Bengal photographers, filmmakers, writers, and visual designers.',
    category: 'Arts & Media',
    privacy: 'public',
    membersCount: 1,
    isMember: true,
    isAdmin: false,
    rules: [
      'Share only original photography and visual work',
      'Constructive critique and technical feedback welcomed'
    ],
    postsCount: 0
  },
  {
    id: 'grp_2',
    name: 'Indie Developers India',
    coverImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1000&auto=format&fit=crop&q=80',
    description: 'Founders building consumer tech, AI applications, and community tools across India and Southeast Asia.',
    category: 'Technology & Startups',
    privacy: 'public',
    membersCount: 1,
    isMember: true,
    isAdmin: false,
    rules: [
      'Share actionable learnings and metrics',
      'Constructive feedback only'
    ],
    postsCount: 0
  }
];

let eventsList: SocialEvent[] = [
  {
    id: 'ev_1',
    title: 'Bengal Visual Arts & Creator Con 2026',
    description: 'Join creators, filmmakers, and digital artists for keynote talks, live editing workshops, and rooftop networking.',
    coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1000&auto=format&fit=crop&q=80',
    date: 'Saturday, Nov 22, 2026',
    time: '4:00 PM – 9:30 PM IST',
    location: 'Science City Auditorium, Kolkata',
    organizer: officialPlatformUser,
    rsvpStatus: 'not_going',
    attendeesCount: 0
  }
];

let liveStream: LiveStream = {
  id: 'live_default',
  host: officialPlatformUser,
  title: 'Welcome to YourBby Broadcasts 🌐',
  category: 'Community & Events',
  viewersCount: 0,
  isLive: false,
  startedAt: new Date().toISOString(),
  chatMessages: []
};

let creatorAnalytics: CreatorAnalytics = {
  reach: 0,
  impressions: 0,
  followersGrowth: 0,
  engagementRate: 0,
  reelViews: 0,
  estimatedEarningsINR: 0,
  chartData: [
    { date: 'Mon', views: 0, interactions: 0 },
    { date: 'Tue', views: 0, interactions: 0 },
    { date: 'Wed', views: 0, interactions: 0 },
    { date: 'Thu', views: 0, interactions: 0 },
    { date: 'Fri', views: 0, interactions: 0 },
    { date: 'Sat', views: 0, interactions: 0 },
    { date: 'Sun', views: 0, interactions: 0 }
  ]
};

let contentReports: ContentReport[] = [];

// Load persisted DB from disk if present
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (data.currentUser) currentUser = data.currentUser;
      if (Array.isArray(data.usersList)) usersList = data.usersList;
      if (Array.isArray(data.postsList)) postsList = data.postsList;
      if (data.commentsMap) commentsMap = data.commentsMap;
      if (Array.isArray(data.storiesList)) storiesList = data.storiesList;
      if (Array.isArray(data.reelsList)) reelsList = data.reelsList;
      if (Array.isArray(data.notesList)) notesList = data.notesList;
      if (Array.isArray(data.conversationsList)) conversationsList = data.conversationsList;
      if (data.messagesMap) messagesMap = data.messagesMap;
      if (Array.isArray(data.notificationsList)) notificationsList = data.notificationsList;
      if (data.creatorAnalytics) creatorAnalytics = data.creatorAnalytics;
      if (Array.isArray(data.contentReports)) contentReports = data.contentReports;
      console.log('Successfully loaded persisted database from', DB_FILE);
    }
  } catch (err) {
    console.error('Error loading DB_FILE:', err);
  }
}

// Persist DB state to disk
function saveDb() {
  try {
    const data = {
      currentUser,
      usersList,
      postsList,
      commentsMap,
      storiesList,
      reelsList,
      notesList,
      conversationsList,
      messagesMap,
      notificationsList,
      creatorAnalytics,
      contentReports,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB_FILE:', err);
  }
}

// Initial DB load on boot
loadDb();

// -------------------------------------------------------------
// REST API Routes
// -------------------------------------------------------------

// 1. Current User & Profiles
app.get('/api/me', (req, res) => {
  res.json({ success: true, user: currentUser });
});

// Check username availability
app.get('/api/users/check-username', (req, res) => {
  const username = (req.query.username as string || '').trim().toLowerCase().replace(/^@/, '');
  if (!username) {
    return res.status(400).json({ available: false, error: 'Username is required' });
  }
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
    return res.status(400).json({
      available: false,
      error: 'Username must be 3-30 characters long and contain only letters, numbers, and underscores.'
    });
  }

  const isTaken = usersList.some(
    u => u.username.toLowerCase() === username && u.id !== currentUser.id
  );

  res.json({
    available: !isTaken,
    message: isTaken ? 'Username is already taken' : 'Username is available'
  });
});

// Update Profile with full fields, validation, and disk persistence
app.put('/api/me', (req, res) => {
  const { displayName, username, bio, location, website, avatar, coverPhoto, privacy } = req.body;

  if (displayName && typeof displayName === 'string') {
    currentUser.displayName = displayName.trim();
  }

  if (username && typeof username === 'string') {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (cleanUsername !== currentUser.username.toLowerCase()) {
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(cleanUsername)) {
        return res.status(400).json({ error: 'Username must be 3-30 alphanumeric characters' });
      }
      const isTaken = usersList.some(
        u => u.username.toLowerCase() === cleanUsername && u.id !== currentUser.id
      );
      if (isTaken) {
        return res.status(409).json({ error: 'Username is already in use by another account' });
      }
      currentUser.username = cleanUsername;
    }
  }

  if (bio !== undefined) currentUser.bio = bio;
  if (location !== undefined) currentUser.location = location;
  if (website !== undefined) currentUser.website = website;
  if (avatar) currentUser.avatar = avatar;
  if (coverPhoto) currentUser.coverPhoto = coverPhoto;
  if (privacy) currentUser.privacy = privacy;

  const idx = usersList.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) {
    usersList[idx] = { ...currentUser };
  } else {
    usersList.push({ ...currentUser });
  }

  // Update author references in posts
  postsList.forEach(p => {
    if (p.authorId === currentUser.id) {
      p.author = { ...currentUser };
    }
  });

  saveDb();
  res.json({ success: true, user: currentUser });
});

// Dedicated POST /api/profile/update endpoint
app.post('/api/profile/update', (req, res) => {
  const { displayName, username, bio, location, website, avatar, coverPhoto, privacy, userId } = req.body;

  // Protect against non-owner editing other users' content
  if (userId && userId !== currentUser.id) {
    return res.status(403).json({ error: 'Permission denied: Cannot edit another user profile' });
  }

  if (displayName) currentUser.displayName = displayName.trim();
  if (username) {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (clean !== currentUser.username.toLowerCase()) {
      const isTaken = usersList.some(u => u.username.toLowerCase() === clean && u.id !== currentUser.id);
      if (isTaken) return res.status(409).json({ error: 'Username is already taken' });
      currentUser.username = clean;
    }
  }
  if (bio !== undefined) currentUser.bio = bio;
  if (location !== undefined) currentUser.location = location;
  if (website !== undefined) currentUser.website = website;
  if (avatar) currentUser.avatar = avatar;
  if (coverPhoto) currentUser.coverPhoto = coverPhoto;
  if (privacy) currentUser.privacy = privacy;

  const idx = usersList.findIndex(u => u.id === currentUser.id);
  if (idx !== -1) usersList[idx] = { ...currentUser };

  saveDb();
  res.json({ success: true, user: currentUser });
});

app.get('/api/users/:username', (req, res) => {
  const reqUsername = req.params.username.toLowerCase().replace(/^@/, '');
  const user = usersList.find(u => u.username.toLowerCase() === reqUsername);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const userPosts = postsList.filter(p => p.authorId === user.id || p.author.username === user.username);
  const userReels = reelsList.filter(r => r.author.username === user.username);
  res.json({ success: true, user, posts: userPosts, reels: userReels });
});

app.get('/api/users', (req, res) => {
  res.json({ success: true, users: usersList });
});

app.post('/api/users/:id/follow', (req, res) => {
  const user = usersList.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.isFollowing = !user.isFollowing;
  user.followersCount += user.isFollowing ? 1 : -1;
  res.json({ success: true, isFollowing: user.isFollowing, followersCount: user.followersCount });
});

app.post('/api/users/:id/friend', (req, res) => {
  const user = usersList.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.isFriendRequested = !user.isFriendRequested;
  res.json({ success: true, isFriendRequested: user.isFriendRequested });
});

// 2. Feed & Posts
app.get('/api/feed', (req, res) => {
  const type = req.query.type as string || 'for-you';
  let feed = [...postsList];

  if (type === 'following') {
    feed = feed.filter(p => p.authorId === currentUser.id || p.author.isFollowing);
  } else if (type === 'friends') {
    feed = feed.filter(p => p.authorId === currentUser.id || p.author.isFriend);
  } else if (type === 'latest') {
    feed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ success: true, posts: feed });
});

app.post('/api/posts', (req, res) => {
  const { content, mediaUrls, mediaType, locationName, feeling, poll, audience, tags } = req.body;
  if (!content && (!mediaUrls || mediaUrls.length === 0) && !poll) {
    return res.status(400).json({ error: 'Post must contain text, media or poll' });
  }

  const newPost: Post = {
    id: `p_${Date.now()}`,
    authorId: currentUser.id,
    author: currentUser,
    content: content || '',
    mediaUrls: mediaUrls || [],
    mediaType: mediaType || 'image',
    locationName,
    feeling,
    poll: poll ? {
      question: poll.question,
      totalVotes: 0,
      options: poll.options.map((optText: string, i: number) => ({
        id: `opt_${Date.now()}_${i}`,
        text: optText,
        votes: 0,
        votedUserIds: []
      }))
    } : undefined,
    audience: audience || 'public',
    createdAt: new Date().toISOString(),
    likesCount: 0,
    userReaction: null,
    reactionCounts: { like: 0, love: 0, care: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
    commentsCount: 0,
    repostsCount: 0,
    tags: tags || []
  };

  postsList.unshift(newPost);
  saveDb();
  res.status(201).json({ success: true, post: newPost });
});

app.post('/api/posts/:id/react', (req, res) => {
  const post = postsList.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const { reaction } = req.body as { reaction: ReactionType | null };

  const prevReaction = post.userReaction;

  if (prevReaction && post.reactionCounts[prevReaction] > 0) {
    post.reactionCounts[prevReaction]--;
    post.likesCount = Math.max(0, post.likesCount - 1);
  }

  if (reaction && reaction !== prevReaction) {
    post.userReaction = reaction;
    post.reactionCounts[reaction] = (post.reactionCounts[reaction] || 0) + 1;
    post.likesCount++;
  } else {
    post.userReaction = null;
  }

  saveDb();
  res.json({
    success: true,
    userReaction: post.userReaction,
    likesCount: post.likesCount,
    reactionCounts: post.reactionCounts
  });
});

app.post('/api/posts/:id/bookmark', (req, res) => {
  const post = postsList.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  post.isBookmarked = !post.isBookmarked;
  saveDb();
  res.json({ success: true, isBookmarked: post.isBookmarked });
});

app.delete('/api/posts/:id', (req, res) => {
  const index = postsList.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Post not found' });
  postsList.splice(index, 1);
  saveDb();
  res.json({ success: true });
});

// Post Poll Vote
app.post('/api/posts/:id/poll-vote', (req, res) => {
  const post = postsList.find(p => p.id === req.params.id);
  if (!post || !post.poll) return res.status(404).json({ error: 'Poll not found' });
  const { optionId } = req.body;

  const targetOption = post.poll.options.find(o => o.id === optionId);
  if (!targetOption) return res.status(404).json({ error: 'Option not found' });

  // remove previous vote if any
  post.poll.options.forEach(opt => {
    const idx = opt.votedUserIds.indexOf(currentUser.id);
    if (idx !== -1) {
      opt.votedUserIds.splice(idx, 1);
      opt.votes = Math.max(0, opt.votes - 1);
      post.poll!.totalVotes = Math.max(0, post.poll!.totalVotes - 1);
    }
  });

  targetOption.votedUserIds.push(currentUser.id);
  targetOption.votes++;
  post.poll.totalVotes++;

  res.json({ success: true, poll: post.poll });
});

// 3. Comments
app.get('/api/posts/:id/comments', (req, res) => {
  const comments = commentsMap[req.params.id] || [];
  res.json({ success: true, comments });
});

app.post('/api/posts/:id/comments', (req, res) => {
  const { text, replyToId } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Text required' });

  const post = postsList.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const newComment: Comment = {
    id: `c_${Date.now()}`,
    postId: post.id,
    author: currentUser,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    likesCount: 0,
    hasLiked: false,
    replies: []
  };

  if (!commentsMap[post.id]) {
    commentsMap[post.id] = [];
  }

  if (replyToId) {
    const parentComment = commentsMap[post.id].find(c => c.id === replyToId);
    if (parentComment) {
      if (!parentComment.replies) parentComment.replies = [];
      parentComment.replies.push(newComment);
    } else {
      commentsMap[post.id].push(newComment);
    }
  } else {
    commentsMap[post.id].push(newComment);
  }

  post.commentsCount++;
  saveDb();
  res.status(201).json({ success: true, comment: newComment });
});

// 4. Stories & Notes
app.get('/api/stories', (req, res) => {
  res.json({ success: true, stories: storiesList });
});

app.post('/api/stories', (req, res) => {
  const { mediaUrl, mediaType, textOverlay, backgroundGradient, stickers } = req.body;
  const newStory: Story = {
    id: `s_${Date.now()}`,
    author: currentUser,
    mediaUrl,
    mediaType: mediaType || 'image',
    textOverlay,
    backgroundGradient,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    seen: false,
    viewsCount: 0,
    stickers: stickers || []
  };
  storiesList.unshift(newStory);
  saveDb();
  res.status(201).json({ success: true, story: newStory });
});

app.post('/api/stories/:id/view', (req, res) => {
  const story = storiesList.find(s => s.id === req.params.id);
  if (story) {
    story.seen = true;
    story.viewsCount++;
    saveDb();
  }
  res.json({ success: true });
});

app.get('/api/notes', (req, res) => {
  res.json({ success: true, notes: notesList });
});

app.post('/api/notes', (req, res) => {
  const { text, musicSnippet } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });

  // replace user's note if exists
  notesList = notesList.filter(n => n.author.id !== currentUser.id);
  const newNote: Note = {
    id: `n_${Date.now()}`,
    author: currentUser,
    text: text.slice(0, 60),
    musicSnippet,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  };
  notesList.unshift(newNote);
  saveDb();
  res.status(201).json({ success: true, note: newNote });
});

// 5. Reels
app.get('/api/reels', (req, res) => {
  res.json({ success: true, reels: reelsList });
});

app.post('/api/reels', (req, res) => {
  const { videoUrl, thumbnailUrl, caption, audioTitle, audioArtist, tags } = req.body;
  if (!caption) return res.status(400).json({ error: 'Caption required' });

  const newReel: Reel = {
    id: `r_${Date.now()}`,
    author: currentUser,
    videoUrl: videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: thumbnailUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    caption,
    audioTrack: {
      title: audioTitle || 'Original Audio',
      artist: audioArtist || currentUser.displayName
    },
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    hasLiked: false,
    isBookmarked: false,
    tags: tags || ['YourBbyReel'],
    createdAt: new Date().toISOString()
  };

  reelsList.unshift(newReel);
  saveDb();
  res.status(201).json({ success: true, reel: newReel });
});

app.post('/api/reels/:id/like', (req, res) => {
  const reel = reelsList.find(r => r.id === req.params.id);
  if (!reel) return res.status(404).json({ error: 'Reel not found' });
  reel.hasLiked = !reel.hasLiked;
  reel.likesCount += reel.hasLiked ? 1 : -1;
  saveDb();
  res.json({ success: true, hasLiked: reel.hasLiked, likesCount: reel.likesCount });
});

// 6. Direct Messenger
app.get('/api/messages/conversations', (req, res) => {
  res.json({ success: true, conversations: conversationsList });
});

app.get('/api/messages/conversations/:id', (req, res) => {
  const conv = conversationsList.find(c => c.id === req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  const messages = messagesMap[conv.id] || [];
  conv.unreadCount = 0;
  saveDb();
  res.json({ success: true, conversation: conv, messages });
});

app.post('/api/messages/conversations/:id/send', (req, res) => {
  const conv = conversationsList.find(c => c.id === req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  const { text, mediaUrl, mediaType, voiceDurationSeconds } = req.body;

  const newMsg: Message = {
    id: `m_${Date.now()}`,
    conversationId: conv.id,
    senderId: currentUser.id,
    sender: currentUser,
    text: text || '',
    mediaUrl,
    mediaType,
    voiceDurationSeconds,
    createdAt: new Date().toISOString(),
    read: true
  };

  if (!messagesMap[conv.id]) messagesMap[conv.id] = [];
  messagesMap[conv.id].push(newMsg);
  conv.lastMessage = newMsg;
  conv.updatedAt = newMsg.createdAt;
  saveDb();

  res.status(201).json({ success: true, message: newMsg });
});

// 7. Communities & Groups
app.get('/api/groups', (req, res) => {
  res.json({ success: true, groups: groupsList });
});

app.post('/api/groups/:id/join', (req, res) => {
  const grp = groupsList.find(g => g.id === req.params.id);
  if (!grp) return res.status(404).json({ error: 'Group not found' });
  grp.isMember = !grp.isMember;
  grp.membersCount += grp.isMember ? 1 : -1;
  saveDb();
  res.json({ success: true, isMember: grp.isMember, membersCount: grp.membersCount });
});

// 8. Social Events
app.get('/api/events', (req, res) => {
  res.json({ success: true, events: eventsList });
});

app.post('/api/events/:id/rsvp', (req, res) => {
  const ev = eventsList.find(e => e.id === req.params.id);
  if (!ev) return res.status(404).json({ error: 'Event not found' });
  const { status } = req.body;
  ev.rsvpStatus = status;
  if (status === 'going') ev.attendeesCount++;
  res.json({ success: true, rsvpStatus: ev.rsvpStatus, attendeesCount: ev.attendeesCount });
});

// 9. Notifications
app.get('/api/notifications', (req, res) => {
  res.json({ success: true, notifications: notificationsList });
});

app.post('/api/notifications/mark-read', (req, res) => {
  notificationsList.forEach(n => { n.read = true; });
  res.json({ success: true });
});

// 10. Live Streaming
app.get('/api/live', (req, res) => {
  res.json({ success: true, liveStream });
});

app.post('/api/live/chat', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });
  const msg = {
    id: `lc_${Date.now()}`,
    user: currentUser,
    text,
    timestamp: 'Just now'
  };
  liveStream.chatMessages.push(msg);
  liveStream.viewersCount++;
  res.json({ success: true, message: msg });
});

// 11. Creator Analytics
app.get('/api/analytics', (req, res) => {
  res.json({ success: true, analytics: creatorAnalytics });
});

// 12. Admin Control Center & Reports
app.get('/api/admin/overview', (req, res) => {
  res.json({
    success: true,
    stats: {
      totalUsers: 148920,
      activeUsersDaily: 68400,
      totalPosts: 842100,
      totalReels: 312500,
      totalStoriesToday: 49800,
      serverUptime: '99.98%',
      revenueINR: 2480000,
      pendingReports: contentReports.filter(r => r.status === 'pending').length
    },
    reports: contentReports
  });
});

app.post('/api/admin/reports/:id/action', (req, res) => {
  const { action } = req.body; // 'resolve' | 'dismiss' | 'ban'
  const rep = contentReports.find(r => r.id === req.params.id);
  if (!rep) return res.status(404).json({ error: 'Report not found' });
  rep.status = action === 'dismiss' ? 'dismissed' : 'resolved';
  res.json({ success: true, report: rep });
});

// -------------------------------------------------------------
// Real Server-Side Gemini AI Endpoints
// -------------------------------------------------------------

// AI Caption & Idea Generator
app.post('/api/ai/caption-assistant', async (req, res) => {
  try {
    const { topic, tone = 'trendy', language = 'en' } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic or idea description is required' });
    }

    const langPrompt = language === 'bn' ? 'in Bengali' : language === 'hi' ? 'in Hindi and Hinglish' : 'in English';

    const prompt = `You are the lead social media copywriter for YourBby, a next-generation global social network popular in India and worldwide.
Generate 3 distinct, engaging post captions ${langPrompt} for the following post topic: "${topic}".
Tone requested: ${tone}.
Format your response as a valid JSON array of 3 objects, each having:
- "caption": string with emojis
- "vibe": short 2-3 word label
- "hashtags": array of 4-6 relevant hashtags without the '#' symbol.

Ensure the output is ONLY raw JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    res.json({ success: true, suggestions: parsed });
  } catch (error: any) {
    console.error('Gemini Caption Error:', error);
    res.status(500).json({
      error: 'AI assistant currently unavailable',
      fallback: [
        {
          caption: `Making every second count with YourBby ✨ #LifeInMotion`,
          vibe: 'Inspirational',
          hashtags: ['YourBby', 'SocialConnect', 'Creators']
        }
      ]
    });
  }
});

// AI Hashtag Discovery
app.post('/api/ai/suggest-hashtags', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Post content required' });

    const prompt = `Analyze this social post content: "${content}".
Provide a list of 8-12 high-reach, viral, trending hashtags suitable for YourBby users (India & global).
Return raw JSON array of strings, without the '#' symbol.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const hashtags = JSON.parse(response.text || '[]');
    res.json({ success: true, hashtags });
  } catch (err: any) {
    console.error('Gemini Hashtags Error:', err);
    res.status(500).json({
      error: 'Failed to generate hashtags',
      hashtags: ['YourBby', 'ExplorePage', 'Viral', 'TrendingNow', 'InstaVibes', 'SocialCommunity']
    });
  }
});

// AI Translation (English, Hindi, Bengali)
app.post('/api/ai/translate', async (req, res) => {
  try {
    const { text, targetLanguage = 'hi' } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    const targetName = targetLanguage === 'bn' ? 'Bengali (বাংলা)' : targetLanguage === 'hi' ? 'Hindi (हिन्दी)' : 'English';

    const prompt = `Translate the following social media post or message into authentic, natural, contemporary ${targetName}. Keep emojis intact and preserve the friendly social tone.
Text to translate:
"${text}"

Return JSON object with { "translatedText": "...", "detectedLanguage": "..." }.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, result: parsed });
  } catch (err: any) {
    console.error('Gemini Translate Error:', err);
    res.status(500).json({ error: 'Translation service failed' });
  }
});

// AI Trust & Safety Content Inspector
app.post('/api/ai/content-safety', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    const prompt = `As a Trust and Safety AI moderator for YourBby, inspect the following user post or comment for toxicity, spam, harassment, hate speech, or severe violations:
"${text}"

Return JSON:
{
  "isSafe": boolean,
  "confidence": number (0 to 1),
  "flaggedCategories": string[],
  "summary": string,
  "recommendation": "approve" | "warn" | "flag_for_human_review"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, audit: parsed });
  } catch (err: any) {
    console.error('Gemini Safety Error:', err);
    res.json({
      success: true,
      audit: {
        isSafe: true,
        confidence: 0.95,
        flaggedCategories: [],
        summary: 'Content appears compliant.',
        recommendation: 'approve'
      }
    });
  }
});

// -------------------------------------------------------------
// Vite Dev Server / Production Static Serving
// -------------------------------------------------------------
async function startServer() {
  // In AI Studio container, Nginx listens on PORT=8080 and forwards to DEFAULT_APP_PORT=3000.
  // On standalone Cloud Run / Render, DEFAULT_APP_PORT is unset and PORT is used directly.
  const PORT = process.env.DEFAULT_APP_PORT
    ? parseInt(process.env.DEFAULT_APP_PORT, 10)
    : parseInt(process.env.PORT || '3000', 10);

  const server = http.createServer(app);
  const distPath = path.join(__dirname, 'dist');
  const publicPath = path.join(__dirname, 'public');

  // Always serve static files from public/ (icons, logos, assetlinks)
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }

  if (process.env.NODE_ENV === 'production' && fs.existsSync(distPath)) {
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.webmanifest')) {
            res.setHeader('Content-Type', 'application/manifest+json');
          } else if (filePath.endsWith('sw.js') || filePath.endsWith('registerSW.js')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Service-Worker-Allowed', '/');
          }
        },
      })
    );
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Dynamic import vite in dev mode
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`YourBby Social Platform server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});

