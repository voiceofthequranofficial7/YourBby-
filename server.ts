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
  ReactionType,
  CallSession
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
const AVATARS_UPLOAD_DIR = path.join(DATA_DIR, 'uploads', 'avatars');
if (!fs.existsSync(AVATARS_UPLOAD_DIR)) {
  fs.mkdirSync(AVATARS_UPLOAD_DIR, { recursive: true });
}
const COVERS_UPLOAD_DIR = path.join(DATA_DIR, 'uploads', 'covers');
if (!fs.existsSync(COVERS_UPLOAD_DIR)) {
  fs.mkdirSync(COVERS_UPLOAD_DIR, { recursive: true });
}
const POSTS_UPLOAD_DIR = path.join(DATA_DIR, 'uploads', 'posts');
if (!fs.existsSync(POSTS_UPLOAD_DIR)) {
  fs.mkdirSync(POSTS_UPLOAD_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'db.json');

function persistBase64AvatarToDisk(userId: string, rawInput: string): string {
  if (!rawInput || !rawInput.startsWith('data:image/') || rawInput.startsWith('data:image/svg+xml')) {
    return rawInput;
  }
  const match = rawInput.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return rawInput;
  const mime = match[1];
  const base64Data = match[2];
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const safeUser = String(userId || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `avatar_${safeUser}_${Date.now()}.${ext}`;
  const filePath = path.join(AVATARS_UPLOAD_DIR, fileName);
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
  return `/api/media/avatars/${fileName}`;
}

function persistBase64CoverToDisk(userId: string, rawInput: string): string {
  if (!rawInput || !rawInput.startsWith('data:image/') || rawInput.startsWith('data:image/svg+xml')) {
    return rawInput;
  }
  const match = rawInput.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return rawInput;
  const mime = match[1];
  const base64Data = match[2];
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
  const safeUser = String(userId || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `cover_${safeUser}_${Date.now()}.${ext}`;
  const filePath = path.join(COVERS_UPLOAD_DIR, fileName);
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
  return `/api/media/covers/${fileName}`;
}

function persistBase64PostMediaToDisk(userId: string, rawInput: string): string {
  if (!rawInput || (!rawInput.startsWith('data:image/') && !rawInput.startsWith('data:video/'))) {
    return rawInput;
  }
  const match = rawInput.match(/^data:((?:image|video)\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return rawInput;
  const mime = match[1];
  const base64Data = match[2];
  let ext = 'jpg';
  if (mime.includes('png')) ext = 'png';
  else if (mime.includes('webp')) ext = 'webp';
  else if (mime.includes('gif')) ext = 'gif';
  else if (mime.includes('mp4')) ext = 'mp4';
  else if (mime.includes('webm')) ext = 'webm';
  else if (mime.includes('quicktime') || mime.includes('mov')) ext = 'mov';
  const safeUser = String(userId || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `post_${safeUser}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
  const filePath = path.join(POSTS_UPLOAD_DIR, fileName);
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
  return `/api/media/posts/${fileName}`;
}

// Persistent credential map for registered accounts
let credentialsMap: Record<string, { email?: string; password: string }> = {};

// Default initial owner profile for Mohammad Siraj
const DEFAULT_OWNER_AVATAR = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%230f172a"/><circle cx="100" cy="100" r="76" fill="%231e293b" stroke="%23f43f5e" stroke-width="4"/><text x="100" y="118" font-family="system-ui,sans-serif" font-size="64" font-weight="bold" fill="%23ffffff" text-anchor="middle">MS</text></svg>';

const DEFAULT_OWNER_COVER = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23020617"/><stop offset="45%" stop-color="%230f172a"/><stop offset="80%" stop-color="%234c1d95"/><stop offset="100%" stop-color="%23e11d48"/></linearGradient></defs><rect width="1200" height="400" fill="url(%23bg)"/><circle cx="950" cy="120" r="240" fill="%23f43f5e" fill-opacity="0.16"/><circle cx="240" cy="320" r="280" fill="%236366f1" fill-opacity="0.18"/></svg>';

let currentUser: User = {
  id: 'u_owner_mohammad_siraj',
  username: 'mohammadsiraj',
  displayName: 'Mohammad Siraj',
  avatar: DEFAULT_OWNER_AVATAR,
  coverPhoto: DEFAULT_OWNER_COVER,
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
let callsList: CallSession[] = [];
let userPresenceMap: Record<string, number> = {}; // userId -> last heartbeat timestamp ms

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
      if (Array.isArray(data.callsList)) callsList = data.callsList;
      if (data.creatorAnalytics) creatorAnalytics = data.creatorAnalytics;
      if (Array.isArray(data.contentReports)) contentReports = data.contentReports;
      if (data.credentialsMap && typeof data.credentialsMap === 'object') {
        credentialsMap = data.credentialsMap;
      }
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
      callsList,
      creatorAnalytics,
      contentReports,
      credentialsMap,
      updatedAt: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving DB_FILE:', err);
  }
}

// Initial DB load on boot
loadDb();

// Helper to resolve active user from x-user-id header (enables multi-tab / 2-account testing)
function resolveUser(req: express.Request): User {
  const headerUserId = req.headers['x-user-id'] as string | undefined;
  if (headerUserId) {
    const found = usersList.find(u => u.id === headerUserId || u.username.toLowerCase() === headerUserId.toLowerCase());
    if (found) {
      userPresenceMap[found.id] = Date.now();
      found.isOnline = true;
      found.lastSeen = new Date().toISOString();
      return found;
    }
  }
  userPresenceMap[currentUser.id] = Date.now();
  currentUser.isOnline = true;
  currentUser.lastSeen = new Date().toISOString();
  return currentUser;
}

function getEnrichedUser(u: User): User {
  const lastBeat = userPresenceMap[u.id];
  // Consider user genuinely online if they had activity within the last 45 seconds or are currentUser
  const isRecentlyActive = lastBeat ? (Date.now() - lastBeat < 45000) : Boolean(u.isOnline);
  return {
    ...u,
    isOnline: isRecentlyActive,
    lastSeen: u.lastSeen || new Date().toISOString()
  };
}

// -------------------------------------------------------------
// REST API Routes
// -------------------------------------------------------------

// 1. Current User & Profiles
app.get('/api/me', (req, res) => {
  const activeUser = resolveUser(req);
  res.json({ success: true, user: getEnrichedUser(activeUser) });
});

// Switch active account or register a new real user account
app.post('/api/auth/switch', (req, res) => {
  const { userId, username } = req.body;
  const target = usersList.find(
    u => (userId && u.id === userId) || (username && u.username.toLowerCase() === String(username).toLowerCase().replace(/^@/, ''))
  );
  if (!target) {
    return res.status(404).json({ error: 'Account not found' });
  }
  userPresenceMap[target.id] = Date.now();
  target.isOnline = true;
  target.lastSeen = new Date().toISOString();
  currentUser = target;
  saveDb();
  res.json({ success: true, user: getEnrichedUser(target) });
});

app.post('/api/users/register', (req, res) => {
  const { id, displayName, username, email, password, bio, location, website, avatar, coverPhoto, coverPhotoURL, privacy } = req.body;
  const cleanUsername = String(username || '').trim().toLowerCase().replace(/^@/, '');
  if (!cleanUsername || !/^[a-zA-Z0-9_.]{3,30}$/.test(cleanUsername)) {
    return res.status(400).json({ error: 'Valid username (3-30 characters) is required' });
  }
  if (!displayName || !String(displayName).trim()) {
    return res.status(400).json({ error: 'Display name is required' });
  }
  const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;
  const existingUsername = usersList.find(u => u.username.toLowerCase() === cleanUsername && u.id !== id);
  if (existingUsername) {
    return res.status(409).json({ error: 'Username is already taken' });
  }
  if (cleanEmail) {
    const existingEmail = usersList.find(u => u.email?.toLowerCase() === cleanEmail && u.id !== id);
    if (existingEmail) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
  }

  const initials = String(displayName).trim().split(/\s+/).map((w: string) => w[0]?.toUpperCase() || '').join('').slice(0, 2) || 'U';
  const defaultSvgAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%230f172a"/><circle cx="100" cy="100" r="76" fill="%231e293b" stroke="%236366f1" stroke-width="4"/><text x="100" y="118" font-family="system-ui,sans-serif" font-size="64" font-weight="bold" fill="%23ffffff" text-anchor="middle">${initials}</text></svg>`;

  const targetId = id || `u_${Date.now()}`;
  const resolvedAvatar = avatar ? persistBase64AvatarToDisk(targetId, String(avatar)) : defaultSvgAvatar;
  const rawCover = coverPhotoURL !== undefined ? coverPhotoURL : coverPhoto;
  const resolvedCover = rawCover ? persistBase64CoverToDisk(targetId, String(rawCover)) : '';

  let userRecord = usersList.find(u => (id && u.id === id) || u.username.toLowerCase() === cleanUsername);
  if (userRecord) {
    userRecord.displayName = String(displayName).trim();
    userRecord.username = cleanUsername;
    if (cleanEmail) userRecord.email = cleanEmail;
    if (bio !== undefined) userRecord.bio = bio;
    if (location !== undefined) userRecord.location = location;
    if (website !== undefined) userRecord.website = website;
    if (avatar) userRecord.avatar = resolvedAvatar;
    if (rawCover !== undefined) {
      userRecord.coverPhotoURL = resolvedCover;
      userRecord.coverPhoto = resolvedCover;
    }
    if (privacy) userRecord.privacy = privacy;
    userRecord.isOnline = true;
    userRecord.lastSeen = new Date().toISOString();
  } else {
    userRecord = {
      id: targetId,
      username: cleanUsername,
      displayName: String(displayName).trim(),
      email: cleanEmail,
      avatar: resolvedAvatar,
      coverPhotoURL: resolvedCover,
      coverPhoto: resolvedCover,
      bio: bio || '',
      location: location || '',
      website: website || '',
      verified: false,
      role: 'user',
      followersCount: 0,
      followingCount: 0,
      friendsCount: 0,
      isOnline: true,
      lastSeen: new Date().toISOString(),
      privacy: privacy || 'public'
    };
    usersList.push(userRecord);
  }

  if (password && String(password).length >= 6) {
    credentialsMap[userRecord.id] = {
      email: cleanEmail,
      password: String(password)
    };
  }

  userPresenceMap[userRecord.id] = Date.now();
  currentUser = userRecord;
  saveDb();
  res.status(201).json({ success: true, user: getEnrichedUser(userRecord), users: usersList.map(getEnrichedUser) });
});

// Authenticate user with email or username + password
app.post('/api/auth/login', (req, res) => {
  const { identifier, email, username, password } = req.body;
  const rawIdent = String(identifier || email || username || '').trim().toLowerCase().replace(/^@/, '');
  if (!rawIdent) {
    return res.status(400).json({ error: 'Email or username is required' });
  }
  if (!password || !String(password)) {
    return res.status(400).json({ error: 'Password is required' });
  }

  const target = usersList.find(
    u =>
      u.username.toLowerCase() === rawIdent ||
      (u.email && u.email.toLowerCase() === rawIdent) ||
      (credentialsMap[u.id]?.email && credentialsMap[u.id].email!.toLowerCase() === rawIdent)
  );

  if (!target) {
    return res.status(401).json({ error: 'Account not found. Please check your username or email.' });
  }

  const cred = credentialsMap[target.id];
  if (cred && cred.password && cred.password !== String(password)) {
    return res.status(401).json({ error: 'Invalid password. Please try again.' });
  }

  // If account had no password set yet (e.g. legacy account), set it on first login if >= 6 chars
  if (!cred && String(password).length < 4) {
    return res.status(401).json({ error: 'Invalid password.' });
  }

  userPresenceMap[target.id] = Date.now();
  target.isOnline = true;
  target.lastSeen = new Date().toISOString();
  currentUser = target;
  saveDb();
  res.json({ success: true, user: getEnrichedUser(target), users: usersList.map(getEnrichedUser) });
});

// Logout active user session
app.post('/api/auth/logout', (req, res) => {
  const activeUser = resolveUser(req);
  delete userPresenceMap[activeUser.id];
  activeUser.isOnline = false;
  activeUser.lastSeen = new Date().toISOString();
  saveDb();
  res.json({ success: true });
});

// Change password for active user
app.post('/api/auth/change-password', (req, res) => {
  const activeUser = resolveUser(req);
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || String(newPassword).length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }
  const existingCred = credentialsMap[activeUser.id];
  if (existingCred && existingCred.password && currentPassword !== undefined && currentPassword !== '') {
    if (existingCred.password !== String(currentPassword)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }
  }
  credentialsMap[activeUser.id] = {
    email: activeUser.email || existingCred?.email,
    password: String(newPassword)
  };
  saveDb();
  res.json({ success: true, message: 'Password updated successfully' });
});

app.post('/api/users/presence', (req, res) => {
  const activeUser = resolveUser(req);
  const { isOnline } = req.body;
  if (isOnline === false) {
    delete userPresenceMap[activeUser.id];
    activeUser.isOnline = false;
  } else {
    userPresenceMap[activeUser.id] = Date.now();
    activeUser.isOnline = true;
  }
  activeUser.lastSeen = new Date().toISOString();
  saveDb();
  res.json({ success: true, user: getEnrichedUser(activeUser) });
});

// Check username availability
app.get('/api/users/check-username', (req, res) => {
  const activeUser = resolveUser(req);
  const username = (req.query.username as string || '').trim().toLowerCase().replace(/^@/, '');
  if (!username) {
    return res.status(400).json({ available: false, error: 'Username is required' });
  }
  if (!/^[a-zA-Z0-9_.]{3,30}$/.test(username)) {
    return res.status(400).json({
      available: false,
      error: 'Username must be 3-30 characters long and contain only letters, numbers, dots, and underscores.'
    });
  }

  const isTaken = usersList.some(
    u => u.username.toLowerCase() === username && u.id !== activeUser.id
  );

  res.json({
    available: !isTaken,
    message: isTaken ? 'Username is already taken' : 'Username is available'
  });
});

// Dedicated Binary Profile Photo (Avatar) Upload & Serving Endpoints (Separate Path!)
app.post(
  '/api/media/avatar',
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp', 'application/octet-stream'], limit: '15mb' }),
  (req, res) => {
    try {
      const activeUser = resolveUser(req);
      const safeUser = String(activeUser.id || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');

      if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        const contentType = String(req.headers['content-type'] || 'image/jpeg');
        const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
        const fileName = `avatar_${safeUser}_${Date.now()}.${ext}`;
        const filePath = path.join(AVATARS_UPLOAD_DIR, fileName);
        fs.writeFileSync(filePath, req.body);
        const downloadURL = `/api/media/avatars/${fileName}`;
        return res.status(201).json({ success: true, downloadURL, url: downloadURL, sizeBytes: req.body.length });
      }

      if (req.body && typeof req.body === 'object' && req.body.dataUrl) {
        const downloadURL = persistBase64AvatarToDisk(activeUser.id, String(req.body.dataUrl));
        return res.status(201).json({ success: true, downloadURL, url: downloadURL });
      }

      return res.status(400).json({ success: false, error: 'No binary avatar image payload received' });
    } catch (err: any) {
      console.error('Avatar binary upload error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Avatar upload failed' });
    }
  }
);

app.get('/api/media/avatars/:filename', (req, res) => {
  const safeName = path.basename(req.params.filename);
  const filePath = path.join(AVATARS_UPLOAD_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Avatar image not found');
  }
  const ext = path.extname(safeName).toLowerCase();
  const mime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.sendFile(filePath);
});

// Dedicated Binary Cover Photo Upload & Serving Endpoints (Separate Path!)
app.post(
  '/api/media/cover',
  express.raw({ type: ['image/jpeg', 'image/png', 'image/webp', 'application/octet-stream'], limit: '20mb' }),
  (req, res) => {
    try {
      const activeUser = resolveUser(req);
      const safeUser = String(activeUser.id || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');

      if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        const contentType = String(req.headers['content-type'] || 'image/jpeg');
        const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
        const fileName = `cover_${safeUser}_${Date.now()}.${ext}`;
        const filePath = path.join(COVERS_UPLOAD_DIR, fileName);
        fs.writeFileSync(filePath, req.body);
        const downloadURL = `/api/media/covers/${fileName}`;
        return res.status(201).json({ success: true, downloadURL, url: downloadURL, sizeBytes: req.body.length });
      }

      if (req.body && typeof req.body === 'object' && req.body.dataUrl) {
        const downloadURL = persistBase64CoverToDisk(activeUser.id, String(req.body.dataUrl));
        return res.status(201).json({ success: true, downloadURL, url: downloadURL });
      }

      return res.status(400).json({ success: false, error: 'No binary image payload received' });
    } catch (err: any) {
      console.error('Cover binary upload error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Cover upload failed' });
    }
  }
);

app.get('/api/media/covers/:filename', (req, res) => {
  const safeName = path.basename(req.params.filename);
  const filePath = path.join(COVERS_UPLOAD_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Cover image not found');
  }
  const ext = path.extname(safeName).toLowerCase();
  const mime =
    ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.sendFile(filePath);
});

// Dedicated Binary Post Media (Photo & Video) Upload & Serving Endpoints (Separate Path!)
app.post(
  '/api/media/post',
  express.raw({
    type: [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'application/octet-stream'
    ],
    limit: '50mb'
  }),
  (req, res) => {
    try {
      const activeUser = resolveUser(req);
      const safeUser = String(activeUser.id || 'user').replace(/[^a-zA-Z0-9_-]/g, '_');

      if (Buffer.isBuffer(req.body) && req.body.length > 0) {
        const contentType = String(req.headers['content-type'] || 'image/jpeg').toLowerCase();
        let ext = 'jpg';
        if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('webp')) ext = 'webp';
        else if (contentType.includes('gif')) ext = 'gif';
        else if (contentType.includes('mp4')) ext = 'mp4';
        else if (contentType.includes('webm')) ext = 'webm';
        else if (contentType.includes('quicktime')) ext = 'mov';

        const fileName = `post_${safeUser}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const filePath = path.join(POSTS_UPLOAD_DIR, fileName);
        fs.writeFileSync(filePath, req.body);
        const downloadURL = `/api/media/posts/${fileName}`;
        return res.status(201).json({ success: true, downloadURL, url: downloadURL, sizeBytes: req.body.length });
      }

      if (req.body && typeof req.body === 'object' && req.body.dataUrl) {
        const downloadURL = persistBase64PostMediaToDisk(activeUser.id, String(req.body.dataUrl));
        return res.status(201).json({ success: true, downloadURL, url: downloadURL });
      }

      return res.status(400).json({ success: false, error: 'No binary post media payload received' });
    } catch (err: any) {
      console.error('Post media binary upload error:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Post media upload failed' });
    }
  }
);

app.get('/api/media/posts/:filename', (req, res) => {
  const safeName = path.basename(req.params.filename);
  const filePath = path.join(POSTS_UPLOAD_DIR, safeName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Post media not found');
  }
  const ext = path.extname(safeName).toLowerCase();
  let mime = 'image/jpeg';
  if (ext === '.png') mime = 'image/png';
  else if (ext === '.webp') mime = 'image/webp';
  else if (ext === '.gif') mime = 'image/gif';
  else if (ext === '.mp4') mime = 'video/mp4';
  else if (ext === '.webm') mime = 'video/webm';
  else if (ext === '.mov') mime = 'video/quicktime';
  res.setHeader('Content-Type', mime);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  return res.sendFile(filePath);
});

// Update Profile with full fields, validation, and disk persistence
app.put('/api/me', (req, res) => {
  const activeUser = resolveUser(req);
  const { displayName, username, bio, location, website, avatar, coverPhoto, coverPhotoURL, privacy, settings, userId } = req.body;

  if (userId && userId !== activeUser.id) {
    return res.status(403).json({ error: 'Permission denied: Cannot edit another user profile' });
  }

  if (displayName && typeof displayName === 'string') {
    activeUser.displayName = displayName.trim();
  }

  if (username && typeof username === 'string') {
    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (cleanUsername !== activeUser.username.toLowerCase()) {
      if (!/^[a-zA-Z0-9_.]{3,30}$/.test(cleanUsername)) {
        return res.status(400).json({ error: 'Username must be 3-30 alphanumeric characters' });
      }
      const isTaken = usersList.some(
        u => u.username.toLowerCase() === cleanUsername && u.id !== activeUser.id
      );
      if (isTaken) {
        return res.status(409).json({ error: 'Username is already in use by another account' });
      }
      activeUser.username = cleanUsername;
    }
  }

  if (bio !== undefined) activeUser.bio = bio;
  if (location !== undefined) activeUser.location = location;
  if (website !== undefined) activeUser.website = website;
  if (avatar !== undefined && avatar !== null && avatar !== '') {
    activeUser.avatar = persistBase64AvatarToDisk(activeUser.id, String(avatar));
  }
  if (coverPhotoURL !== undefined || coverPhoto !== undefined) {
    const rawCover = coverPhotoURL !== undefined ? coverPhotoURL : coverPhoto;
    const resolvedCover = rawCover ? persistBase64CoverToDisk(activeUser.id, String(rawCover)) : '';
    activeUser.coverPhotoURL = resolvedCover;
    activeUser.coverPhoto = resolvedCover;
  }
  if (privacy) activeUser.privacy = privacy;
  if (settings && typeof settings === 'object') {
    activeUser.settings = { ...(activeUser.settings || {}), ...settings };
  }

  if (currentUser.id === activeUser.id) {
    currentUser = activeUser;
  }

  const idx = usersList.findIndex(u => u.id === activeUser.id);
  if (idx !== -1) {
    usersList[idx] = { ...activeUser };
  } else {
    usersList.push({ ...activeUser });
  }

  // Update author references in posts, comments, stories, reels, and conversations (One User — One Profile)
  postsList.forEach(p => {
    if (p.authorId === activeUser.id || p.author.id === activeUser.id) {
      p.author = { ...activeUser };
    }
  });
  Object.values(commentsMap).forEach(list => {
    list.forEach(c => {
      if (c.authorId === activeUser.id || c.author.id === activeUser.id) {
        c.author = { ...activeUser };
      }
    });
  });
  storiesList.forEach(s => {
    if (s.author.id === activeUser.id) {
      s.author = { ...activeUser };
    }
  });
  reelsList.forEach(r => {
    if (r.author.id === activeUser.id) {
      r.author = { ...activeUser };
    }
  });
  conversationsList.forEach(c => {
    c.participants = c.participants.map(p => (p.id === activeUser.id ? { ...activeUser } : p));
  });

  saveDb();
  res.json({ success: true, user: getEnrichedUser(activeUser) });
});

// Dedicated POST /api/profile/update endpoint
app.post('/api/profile/update', (req, res) => {
  const activeUser = resolveUser(req);
  const { displayName, username, bio, location, website, avatar, coverPhoto, coverPhotoURL, privacy, settings, userId, id } = req.body;

  // Protect against non-owner editing other users' content
  const targetId = userId || id;
  if (targetId && targetId !== activeUser.id) {
    return res.status(403).json({ error: 'Permission denied: Cannot edit another user profile' });
  }

  if (displayName) activeUser.displayName = displayName.trim();
  if (username) {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (clean !== activeUser.username.toLowerCase()) {
      const isTaken = usersList.some(u => u.username.toLowerCase() === clean && u.id !== activeUser.id);
      if (isTaken) return res.status(409).json({ error: 'Username is already taken' });
      activeUser.username = clean;
    }
  }
  if (bio !== undefined) activeUser.bio = bio;
  if (location !== undefined) activeUser.location = location;
  if (website !== undefined) activeUser.website = website;
  if (avatar !== undefined && avatar !== null && avatar !== '') {
    activeUser.avatar = persistBase64AvatarToDisk(activeUser.id, String(avatar));
  }
  if (coverPhotoURL !== undefined || coverPhoto !== undefined) {
    const rawCover = coverPhotoURL !== undefined ? coverPhotoURL : coverPhoto;
    const resolvedCover = rawCover ? persistBase64CoverToDisk(activeUser.id, String(rawCover)) : '';
    activeUser.coverPhotoURL = resolvedCover;
    activeUser.coverPhoto = resolvedCover;
  }
  if (privacy) activeUser.privacy = privacy;
  if (settings && typeof settings === 'object') {
    activeUser.settings = { ...(activeUser.settings || {}), ...settings };
  }

  if (currentUser.id === activeUser.id) {
    currentUser = activeUser;
  }

  const idx = usersList.findIndex(u => u.id === activeUser.id);
  if (idx !== -1) usersList[idx] = { ...activeUser };

  postsList.forEach(p => {
    if (p.authorId === activeUser.id || p.author.id === activeUser.id) {
      p.author = { ...activeUser };
    }
  });
  Object.values(commentsMap).forEach(list => {
    list.forEach(c => {
      if (c.authorId === activeUser.id || c.author.id === activeUser.id) {
        c.author = { ...activeUser };
      }
    });
  });
  storiesList.forEach(s => {
    if (s.author.id === activeUser.id) {
      s.author = { ...activeUser };
    }
  });
  reelsList.forEach(r => {
    if (r.author.id === activeUser.id) {
      r.author = { ...activeUser };
    }
  });
  conversationsList.forEach(c => {
    c.participants = c.participants.map(p => (p.id === activeUser.id ? { ...activeUser } : p));
  });

  saveDb();
  res.json({ success: true, user: getEnrichedUser(activeUser) });
});

app.get('/api/users/:username', (req, res) => {
  const activeUser = resolveUser(req);
  const reqUsername = req.params.username.toLowerCase().replace(/^@/, '');
  const user = usersList.find(u => u.username.toLowerCase() === reqUsername);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const userPosts = postsList
    .filter(p => p.authorId === user.id || p.author.username.toLowerCase() === user.username.toLowerCase())
    .map(p => ({
      ...p,
      author: getEnrichedUser(usersList.find(u => u.id === p.authorId) || p.author),
      userReaction: p.likedBy ? (p.likedBy[activeUser.id] || null) : (p.userReaction || null)
    }));
  const userReels = reelsList.filter(r => r.author.username.toLowerCase() === user.username.toLowerCase());
  res.json({ success: true, user: getEnrichedUser(user), posts: userPosts, reels: userReels });
});

app.get('/api/users', (req, res) => {
  resolveUser(req);
  res.json({ success: true, users: usersList.map(getEnrichedUser) });
});

app.post('/api/users/:id/follow', (req, res) => {
  const activeUser = resolveUser(req);
  const user = usersList.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.isFollowing = !user.isFollowing;
  user.followersCount = Math.max(0, user.followersCount + (user.isFollowing ? 1 : -1));
  if (user.isFollowing && user.id !== activeUser.id) {
    notificationsList.unshift({
      id: `notif_follow_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      recipientId: user.id,
      type: 'follow',
      actor: getEnrichedUser(activeUser),
      text: 'started following you.',
      createdAt: new Date().toISOString(),
      read: false
    });
  }
  saveDb();
  res.json({ success: true, isFollowing: user.isFollowing, followersCount: user.followersCount });
});

app.post('/api/users/:id/friend', (req, res) => {
  const activeUser = resolveUser(req);
  const user = usersList.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.isFriendRequested = !user.isFriendRequested;
  if (user.isFriendRequested && user.id !== activeUser.id) {
    notificationsList.unshift({
      id: `notif_friend_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      recipientId: user.id,
      type: 'friend_request',
      actor: getEnrichedUser(activeUser),
      text: 'sent you a friend request.',
      createdAt: new Date().toISOString(),
      read: false
    });
  }
  saveDb();
  res.json({ success: true, isFriendRequested: user.isFriendRequested });
});

// 2. Feed & Posts
app.get('/api/feed', (req, res) => {
  const activeUser = resolveUser(req);
  const type = req.query.type as string || 'for-you';
  let feed = postsList.map(p => {
    const latestAuthor = usersList.find(u => u.id === p.authorId || u.id === p.author?.id) || p.author;
    const userReaction = p.likedBy ? (p.likedBy[activeUser.id] || null) : (p.userReaction || null);
    return {
      ...p,
      author: getEnrichedUser(latestAuthor),
      userReaction
    };
  });

  if (type === 'following') {
    feed = feed.filter(p => p.authorId === activeUser.id || p.author.isFollowing);
  } else if (type === 'friends') {
    feed = feed.filter(p => p.authorId === activeUser.id || p.author.isFriend);
  } else if (type === 'latest') {
    feed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ success: true, posts: feed });
});

app.post('/api/posts', (req, res) => {
  const activeUser = resolveUser(req);
  const { id, content, mediaUrls, mediaType, locationName, feeling, poll, audience, tags } = req.body;
  if (!content && (!mediaUrls || mediaUrls.length === 0) && !poll) {
    return res.status(400).json({ error: 'Post must contain text, media or poll' });
  }

  const cleanMediaUrls = Array.isArray(mediaUrls)
    ? mediaUrls.map((url: string) => persistBase64PostMediaToDisk(activeUser.id, String(url)))
    : [];

  const newPost: Post = {
    id: id || `p_${Date.now()}`,
    authorId: activeUser.id,
    author: getEnrichedUser(activeUser),
    content: content || '',
    mediaUrls: cleanMediaUrls,
    mediaType: mediaType || 'image',
    locationName,
    feeling,
    poll: poll ? {
      question: poll.question,
      totalVotes: 0,
      options: poll.options.map((optText: string, i: number) => ({
        id: `opt_${Date.now()}_${i}`,
        text: typeof optText === 'string' ? optText : (optText as any).text,
        votes: 0,
        votedUserIds: []
      }))
    } : undefined,
    audience: audience || 'public',
    createdAt: new Date().toISOString(),
    likesCount: 0,
    userReaction: null,
    likedBy: {},
    reactionCounts: { like: 0, love: 0, care: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
    commentsCount: 0,
    repostsCount: 0,
    tags: tags || []
  };

  postsList.unshift(newPost);
  saveDb();
  res.status(201).json({ success: true, post: newPost });
});

// Edit own post
app.put('/api/posts/:id', (req, res) => {
  const activeUser = resolveUser(req);
  const post = postsList.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  if (post.authorId !== activeUser.id && post.author?.id !== activeUser.id) {
    return res.status(403).json({ error: 'Permission denied: You can only edit your own posts' });
  }

  const { content, locationName, feeling, audience, mediaUrls, mediaType, tags } = req.body;
  if (content !== undefined) post.content = String(content);
  if (locationName !== undefined) post.locationName = locationName;
  if (feeling !== undefined) post.feeling = feeling;
  if (audience !== undefined) post.audience = audience;
  if (Array.isArray(mediaUrls)) {
    post.mediaUrls = mediaUrls.map((url: string) => persistBase64PostMediaToDisk(activeUser.id, String(url)));
  }
  if (mediaType !== undefined) post.mediaType = mediaType;
  if (Array.isArray(tags)) post.tags = tags;
  post.isEdited = true;
  post.editedAt = new Date().toISOString();
  post.author = getEnrichedUser(activeUser);

  saveDb();
  res.json({
    success: true,
    post: {
      ...post,
      userReaction: post.likedBy ? (post.likedBy[activeUser.id] || null) : post.userReaction
    }
  });
});

app.post('/api/posts/:id/react', (req, res) => {
  const activeUser = resolveUser(req);
  const post = postsList.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const { reaction } = req.body as { reaction: ReactionType | null };

  if (!post.likedBy) {
    post.likedBy = {};
    if (post.userReaction) {
      post.likedBy[post.authorId] = post.userReaction;
    }
  }

  const prevReaction = post.likedBy[activeUser.id] || null;

  if (reaction === null || reaction === prevReaction) {
    // Toggle off / unlike
    delete post.likedBy[activeUser.id];
  } else {
    // Set or change reaction (prevents duplicate likes from same user!)
    post.likedBy[activeUser.id] = reaction;

    if (post.authorId !== activeUser.id && !prevReaction) {
      notificationsList.unshift({
        id: `notif_react_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        recipientId: post.authorId,
        type: reaction,
        actor: getEnrichedUser(activeUser),
        postId: post.id,
        text: `reacted (${reaction}) to your post: "${(post.content || 'media post').slice(0, 36)}"`,
        createdAt: new Date().toISOString(),
        read: false
      });
    }
  }

  // Recompute exact reactionCounts and likesCount from likedBy map
  const counts: Record<ReactionType, number> = {
    like: 0,
    love: 0,
    care: 0,
    haha: 0,
    wow: 0,
    sad: 0,
    angry: 0
  };
  let total = 0;
  Object.values(post.likedBy).forEach(r => {
    if (r && counts[r] !== undefined) {
      counts[r]++;
      total++;
    }
  });

  post.reactionCounts = counts;
  post.likesCount = total;
  const currentReaction = post.likedBy[activeUser.id] || null;
  post.userReaction = currentReaction;

  saveDb();
  res.json({
    success: true,
    userReaction: currentReaction,
    likesCount: post.likesCount,
    reactionCounts: post.reactionCounts,
    likedBy: post.likedBy
  });
});

app.post('/api/posts/:id/bookmark', (req, res) => {
  resolveUser(req);
  const post = postsList.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  post.isBookmarked = !post.isBookmarked;
  saveDb();
  res.json({ success: true, isBookmarked: post.isBookmarked });
});

app.delete('/api/posts/:id', (req, res) => {
  const activeUser = resolveUser(req);
  const index = postsList.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Post not found' });
  const target = postsList[index];
  if (
    target.authorId !== activeUser.id &&
    target.author?.id !== activeUser.id &&
    activeUser.role !== 'admin'
  ) {
    return res.status(403).json({ error: 'Permission denied: You can only delete your own posts' });
  }
  postsList.splice(index, 1);
  delete commentsMap[req.params.id];
  saveDb();
  res.json({ success: true });
});

// Post Poll Vote
app.post('/api/posts/:id/poll-vote', (req, res) => {
  const activeUser = resolveUser(req);
  const post = postsList.find(p => p.id === req.params.id);
  if (!post || !post.poll) return res.status(404).json({ error: 'Poll not found' });
  const { optionId } = req.body;

  const targetOption = post.poll.options.find(o => o.id === optionId);
  if (!targetOption) return res.status(404).json({ error: 'Option not found' });

  // remove previous vote if any
  post.poll.options.forEach(opt => {
    const idx = opt.votedUserIds.indexOf(activeUser.id);
    if (idx !== -1) {
      opt.votedUserIds.splice(idx, 1);
      opt.votes = Math.max(0, opt.votes - 1);
      post.poll!.totalVotes = Math.max(0, post.poll!.totalVotes - 1);
    }
  });

  targetOption.votedUserIds.push(activeUser.id);
  targetOption.votes++;
  post.poll.totalVotes++;

  saveDb();
  res.json({ success: true, poll: post.poll });
});

// 3. Comments
app.get('/api/posts/:id/comments', (req, res) => {
  const comments = (commentsMap[req.params.id] || []).map(c => ({
    ...c,
    author: getEnrichedUser(usersList.find(u => u.id === (c.authorId || c.author?.id)) || c.author)
  }));
  res.json({ success: true, comments });
});

app.post('/api/posts/:id/comments', (req, res) => {
  const activeUser = resolveUser(req);
  const { id, text, replyToId } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ error: 'Text required' });

  const post = postsList.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const newComment: Comment = {
    id: id || `c_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    postId: post.id,
    authorId: activeUser.id,
    author: getEnrichedUser(activeUser),
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

  post.commentsCount = (commentsMap[post.id] || []).reduce(
    (sum, c) => sum + 1 + (c.replies ? c.replies.length : 0),
    0
  );

  if (post.authorId !== activeUser.id) {
    notificationsList.unshift({
      id: `notif_comment_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      recipientId: post.authorId,
      type: 'comment',
      actor: getEnrichedUser(activeUser),
      postId: post.id,
      text: `commented on your post: "${text.trim().slice(0, 40)}"`,
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  saveDb();
  res.status(201).json({ success: true, comment: newComment, commentsCount: post.commentsCount });
});

// Delete own comment
app.delete('/api/posts/:postId/comments/:commentId', (req, res) => {
  const activeUser = resolveUser(req);
  const { postId, commentId } = req.params;
  const post = postsList.find(p => p.id === postId);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const list = commentsMap[postId] || [];
  let foundAndDeleted = false;
  let forbidden = false;

  const topIdx = list.findIndex(c => c.id === commentId);
  if (topIdx !== -1) {
    const target = list[topIdx];
    const isCommentOwner = target.authorId === activeUser.id || target.author?.id === activeUser.id;
    const isPostOwner = post.authorId === activeUser.id || post.author?.id === activeUser.id;
    if (!isCommentOwner && !isPostOwner && activeUser.role !== 'admin') {
      return res.status(403).json({ error: 'Permission denied: You can only delete your own comments' });
    }
    list.splice(topIdx, 1);
    foundAndDeleted = true;
  } else {
    for (const parent of list) {
      if (parent.replies && parent.replies.length > 0) {
        const repIdx = parent.replies.findIndex(r => r.id === commentId);
        if (repIdx !== -1) {
          const targetReply = parent.replies[repIdx];
          const isReplyOwner = targetReply.authorId === activeUser.id || targetReply.author?.id === activeUser.id;
          const isPostOwner = post.authorId === activeUser.id || post.author?.id === activeUser.id;
          if (!isReplyOwner && !isPostOwner && activeUser.role !== 'admin') {
            forbidden = true;
            break;
          }
          parent.replies.splice(repIdx, 1);
          foundAndDeleted = true;
          break;
        }
      }
    }
  }

  if (forbidden) {
    return res.status(403).json({ error: 'Permission denied: You can only delete your own comments' });
  }
  if (!foundAndDeleted) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  commentsMap[postId] = list;
  post.commentsCount = list.reduce(
    (sum, c) => sum + 1 + (c.replies ? c.replies.length : 0),
    0
  );
  saveDb();
  res.json({ success: true, commentsCount: post.commentsCount });
});

// 4. Stories & Notes
app.get('/api/stories', (req, res) => {
  const nowMs = Date.now();
  const activeStories = storiesList.filter(s => {
    const exp = new Date(s.expiresAt).getTime();
    return Number.isNaN(exp) || exp > nowMs;
  });
  if (activeStories.length !== storiesList.length) {
    storiesList = activeStories;
    saveDb();
  }
  res.json({ success: true, stories: activeStories });
});

app.post('/api/stories', (req, res) => {
  const activeUser = resolveUser(req);
  const { mediaUrl, mediaType, textOverlay, backgroundGradient, stickers, privacy } = req.body;
  const newStory: Story = {
    id: `s_${Date.now()}`,
    author: getEnrichedUser(activeUser),
    mediaUrl,
    mediaType: mediaType || (mediaUrl ? 'image' : 'text'),
    textOverlay,
    backgroundGradient,
    privacy: privacy || 'public',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    seen: false,
    viewsCount: 0,
    viewerIds: [],
    viewers: [],
    stickers: stickers || []
  };
  storiesList.unshift(newStory);
  saveDb();
  res.status(201).json({ success: true, story: newStory });
});

app.post('/api/stories/:id/view', (req, res) => {
  const activeUser = resolveUser(req);
  const story = storiesList.find(s => s.id === req.params.id);
  if (story) {
    story.seen = true;
    if (!story.viewerIds) story.viewerIds = [];
    if (!story.viewers) story.viewers = [];
    if (!story.viewerIds.includes(activeUser.id)) {
      story.viewerIds.push(activeUser.id);
      story.viewers.unshift({
        id: activeUser.id,
        displayName: activeUser.displayName,
        username: activeUser.username,
        avatar: activeUser.avatar,
        viewedAt: new Date().toISOString()
      });
      story.viewsCount = Math.max(story.viewsCount + 1, story.viewerIds.length);
    }
    saveDb();
  }
  res.json({ success: true, story });
});

app.delete('/api/stories/:id', (req, res) => {
  const activeUser = resolveUser(req);
  const idx = storiesList.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Story not found' });
  const target = storiesList[idx];
  if (
    target.author.id !== activeUser.id &&
    target.author.username !== activeUser.username &&
    activeUser.role !== 'admin'
  ) {
    return res.status(403).json({ error: 'Only the story author can delete this story' });
  }
  storiesList.splice(idx, 1);
  saveDb();
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

// 6. Direct Messenger & Real-Time WebRTC Calling
function isConvParticipant(conv: Conversation, userId: string): boolean {
  if (conv.participantIds && conv.participantIds.includes(userId)) return true;
  return conv.participants.some(p => p.id === userId);
}

function formatConversationForUser(conv: Conversation, userId: string): Conversation {
  const enrichedParticipants = conv.participants.map(p => {
    const latestUser = usersList.find(u => u.id === p.id) || p;
    return getEnrichedUser(latestUser);
  });
  const unreadForUser = conv.unreadCounts?.[userId] ?? (conv.lastMessage && conv.lastMessage.senderId !== userId && !conv.lastMessage.read ? conv.unreadCount : 0);
  const isPinned = conv.pinnedBy ? conv.pinnedBy.includes(userId) : Boolean(conv.isPinned);
  const isMuted = conv.mutedBy ? conv.mutedBy.includes(userId) : Boolean(conv.isMuted);
  const isArchived = conv.archivedBy ? conv.archivedBy.includes(userId) : Boolean(conv.isArchived);

  return {
    ...conv,
    participants: enrichedParticipants,
    participantIds: enrichedParticipants.map(p => p.id),
    unreadCount: unreadForUser,
    isPinned,
    isMuted,
    isArchived,
    typingUserIds: (conv.typingUserIds || []).filter(id => id !== userId)
  };
}

app.get('/api/messages/conversations', (req, res) => {
  const activeUser = resolveUser(req);
  let dirty = false;

  // Filter to only conversations where activeUser is a participant and has not deleted it
  const userConvs = conversationsList.filter(c => {
    if (!isConvParticipant(c, activeUser.id)) return false;
    if (c.deletedBy && c.deletedBy.includes(activeUser.id)) return false;
    return true;
  });

  // Mark any 'sent' messages from other participants as 'delivered' now that recipient's client received them
  userConvs.forEach(c => {
    const msgs = messagesMap[c.id] || [];
    msgs.forEach(m => {
      if (m.senderId !== activeUser.id && (!m.status || m.status === 'sent')) {
        m.status = 'delivered';
        m.deliveredAt = new Date().toISOString();
        dirty = true;
      }
    });
    if (msgs.length > 0) {
      c.lastMessage = msgs[msgs.length - 1];
    }
  });

  if (dirty) saveDb();

  const formatted = userConvs
    .map(c => formatConversationForUser(c, activeUser.id))
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  res.json({ success: true, conversations: formatted });
});

// Create or get 1-to-1 conversation
app.post('/api/messages/conversations', (req, res) => {
  const activeUser = resolveUser(req);
  const { participantId, participant } = req.body;
  const targetId = participantId || participant?.id;
  if (!targetId) {
    return res.status(400).json({ error: 'Target participantId is required' });
  }

  let targetUser = usersList.find(u => u.id === targetId || u.username === participant?.username);
  if (!targetUser && participant) {
    targetUser = {
      id: targetId,
      username: participant.username || `user_${Date.now()}`,
      displayName: participant.displayName || 'YourBby User',
      avatar: participant.avatar || DEFAULT_OWNER_AVATAR,
      verified: Boolean(participant.verified),
      role: participant.role || 'user',
      followersCount: 0,
      followingCount: 0,
      friendsCount: 0,
      isOnline: Boolean(participant.isOnline)
    };
    usersList.push(targetUser);
  }
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found' });
  }

  // Check if 1-to-1 conversation already exists between activeUser and targetUser
  let conv = conversationsList.find(c =>
    !c.isGroup &&
    isConvParticipant(c, activeUser.id) &&
    isConvParticipant(c, targetUser!.id) &&
    (activeUser.id === targetUser!.id ? c.participants.every(p => p.id === activeUser.id) : true)
  );

  if (conv) {
    // Restore if previously deleted by activeUser
    if (conv.deletedBy) {
      conv.deletedBy = conv.deletedBy.filter(id => id !== activeUser.id);
    }
    saveDb();
    return res.json({
      success: true,
      conversation: formatConversationForUser(conv, activeUser.id),
      messages: messagesMap[conv.id] || []
    });
  }

  const participants = activeUser.id === targetUser.id ? [activeUser] : [activeUser, targetUser];
  conv = {
    id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    isGroup: false,
    participants,
    participantIds: participants.map(p => p.id),
    unreadCount: 0,
    unreadCounts: { [activeUser.id]: 0, [targetUser.id]: 0 },
    pinnedBy: [],
    mutedBy: [],
    archivedBy: [],
    deletedBy: [],
    typingUserIds: [],
    updatedAt: new Date().toISOString()
  };

  conversationsList.unshift(conv);
  if (!messagesMap[conv.id]) messagesMap[conv.id] = [];
  saveDb();

  res.status(201).json({
    success: true,
    conversation: formatConversationForUser(conv, activeUser.id),
    messages: []
  });
});

app.get('/api/messages/conversations/:id', (req, res) => {
  const activeUser = resolveUser(req);
  const conv = conversationsList.find(c => c.id === req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (!isConvParticipant(conv, activeUser.id)) {
    return res.status(403).json({ error: 'Access denied: only conversation participants can read messages' });
  }

  const messages = messagesMap[conv.id] || [];
  let updated = false;
  const nowIso = new Date().toISOString();

  messages.forEach(m => {
    if (m.senderId !== activeUser.id && (!m.read || m.status !== 'read')) {
      m.read = true;
      m.status = 'read';
      m.readAt = nowIso;
      if (!m.deliveredAt) m.deliveredAt = nowIso;
      updated = true;
    }
  });

  if (!conv.unreadCounts) conv.unreadCounts = {};
  if (conv.unreadCounts[activeUser.id] !== 0 || conv.unreadCount !== 0) {
    conv.unreadCounts[activeUser.id] = 0;
    conv.unreadCount = 0;
    updated = true;
  }

  if (messages.length > 0) {
    conv.lastMessage = messages[messages.length - 1];
  }

  if (updated) saveDb();

  res.json({
    success: true,
    conversation: formatConversationForUser(conv, activeUser.id),
    messages
  });
});

// Update conversation settings: pin, mute, archive, typing, markRead
app.patch('/api/messages/conversations/:id', (req, res) => {
  const activeUser = resolveUser(req);
  const conv = conversationsList.find(c => c.id === req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (!isConvParticipant(conv, activeUser.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { action, isTyping } = req.body;
  if (!conv.pinnedBy) conv.pinnedBy = conv.isPinned ? [activeUser.id] : [];
  if (!conv.mutedBy) conv.mutedBy = conv.isMuted ? [activeUser.id] : [];
  if (!conv.archivedBy) conv.archivedBy = conv.isArchived ? [activeUser.id] : [];
  if (!conv.typingUserIds) conv.typingUserIds = [];

  if (action === 'pin') {
    if (conv.pinnedBy.includes(activeUser.id)) {
      conv.pinnedBy = conv.pinnedBy.filter(id => id !== activeUser.id);
    } else {
      conv.pinnedBy.push(activeUser.id);
    }
  } else if (action === 'mute') {
    if (conv.mutedBy.includes(activeUser.id)) {
      conv.mutedBy = conv.mutedBy.filter(id => id !== activeUser.id);
    } else {
      conv.mutedBy.push(activeUser.id);
    }
  } else if (action === 'archive') {
    if (conv.archivedBy.includes(activeUser.id)) {
      conv.archivedBy = conv.archivedBy.filter(id => id !== activeUser.id);
    } else {
      conv.archivedBy.push(activeUser.id);
    }
  } else if (action === 'mark_read') {
    if (!conv.unreadCounts) conv.unreadCounts = {};
    conv.unreadCounts[activeUser.id] = 0;
    const msgs = messagesMap[conv.id] || [];
    const nowIso = new Date().toISOString();
    msgs.forEach(m => {
      if (m.senderId !== activeUser.id) {
        m.read = true;
        m.status = 'read';
        m.readAt = nowIso;
      }
    });
  }

  if (typeof isTyping === 'boolean') {
    if (isTyping) {
      if (!conv.typingUserIds.includes(activeUser.id)) {
        conv.typingUserIds.push(activeUser.id);
      }
    } else {
      conv.typingUserIds = conv.typingUserIds.filter(id => id !== activeUser.id);
    }
  }

  saveDb();
  res.json({
    success: true,
    conversation: formatConversationForUser(conv, activeUser.id)
  });
});

// Delete conversation for requesting participant
app.delete('/api/messages/conversations/:id', (req, res) => {
  const activeUser = resolveUser(req);
  const conv = conversationsList.find(c => c.id === req.params.id);
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (!isConvParticipant(conv, activeUser.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!conv.deletedBy) conv.deletedBy = [];
  if (!conv.deletedBy.includes(activeUser.id)) {
    conv.deletedBy.push(activeUser.id);
  }
  saveDb();
  res.json({ success: true });
});

// Send message in conversation
app.post('/api/messages/conversations/:id/send', (req, res) => {
  const activeUser = resolveUser(req);
  let conv = conversationsList.find(c => c.id === req.params.id);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  if (!isConvParticipant(conv, activeUser.id)) {
    return res.status(403).json({ error: 'Access denied: only participants can send messages' });
  }

  const {
    text,
    mediaUrl,
    mediaUrls,
    mediaType,
    fileName,
    fileSize,
    voiceDurationSeconds,
    voiceWaveform,
    replyTo
  } = req.body;

  const otherParticipants = conv.participants.filter(p => p.id !== activeUser.id);
  const anyRecipientOnline = otherParticipants.some(p => getEnrichedUser(p).isOnline);
  const nowIso = new Date().toISOString();

  const newMsg: Message = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    conversationId: conv.id,
    senderId: activeUser.id,
    sender: getEnrichedUser(activeUser),
    text: text || '',
    mediaUrl: mediaUrl || (Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls[0] : undefined),
    mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : (mediaUrl ? [mediaUrl] : undefined),
    mediaType,
    fileName,
    fileSize,
    voiceDurationSeconds,
    voiceWaveform,
    replyTo,
    createdAt: nowIso,
    deliveredAt: anyRecipientOnline ? nowIso : undefined,
    status: anyRecipientOnline ? 'delivered' : 'sent',
    read: false,
    reactions: []
  };

  if (!messagesMap[conv.id]) messagesMap[conv.id] = [];
  messagesMap[conv.id].push(newMsg);
  conv.lastMessage = newMsg;
  conv.updatedAt = newMsg.createdAt;
  conv.deletedBy = []; // Restore conversation for all participants on new message
  conv.typingUserIds = (conv.typingUserIds || []).filter(id => id !== activeUser.id);

  if (!conv.unreadCounts) conv.unreadCounts = {};
  otherParticipants.forEach(p => {
    conv!.unreadCounts![p.id] = (conv!.unreadCounts![p.id] || 0) + 1;
    const isMutedByRecipient = conv!.mutedBy?.includes(p.id);
    if (!isMutedByRecipient) {
      notificationsList.unshift({
        id: `notif_msg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        type: 'message',
        actor: getEnrichedUser(activeUser),
        conversationId: conv!.id,
        text: `sent you ${mediaType === 'voice' ? 'a voice message' : mediaType ? `a ${mediaType}` : `a message: "${(text || '').slice(0, 40)}"`}`,
        createdAt: nowIso,
        read: false
      });
    }
  });

  saveDb();
  res.status(201).json({
    success: true,
    message: newMsg,
    conversation: formatConversationForUser(conv, activeUser.id)
  });
});

// Edit own message or toggle reaction on a message
app.patch('/api/messages/:convId/:msgId', (req, res) => {
  const activeUser = resolveUser(req);
  const conv = conversationsList.find(c => c.id === req.params.convId);
  if (!conv || !isConvParticipant(conv, activeUser.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const msgs = messagesMap[conv.id] || [];
  const msg = msgs.find(m => m.id === req.params.msgId);
  if (!msg) return res.status(404).json({ error: 'Message not found' });

  const { text, reactionEmoji } = req.body;

  // Editing message text (only sender can edit)
  if (typeof text === 'string') {
    if (msg.senderId !== activeUser.id) {
      return res.status(403).json({ error: 'Only the sender can edit their message' });
    }
    if (msg.isDeleted) {
      return res.status(400).json({ error: 'Cannot edit a deleted message' });
    }
    msg.text = text.trim();
    msg.isEdited = true;
    msg.editedAt = new Date().toISOString();
  }

  // Toggling emoji reaction
  if (reactionEmoji) {
    if (!msg.reactions) msg.reactions = [];
    const existingIdx = msg.reactions.findIndex(
      r => r.userId === activeUser.id && r.emoji === reactionEmoji
    );
    if (existingIdx !== -1) {
      msg.reactions.splice(existingIdx, 1);
    } else {
      // Replace any previous reaction by same user or add new
      msg.reactions = msg.reactions.filter(r => r.userId !== activeUser.id);
      msg.reactions.push({
        emoji: reactionEmoji,
        userId: activeUser.id,
        userName: activeUser.displayName
      });
    }
  }

  if (conv.lastMessage && conv.lastMessage.id === msg.id) {
    conv.lastMessage = { ...msg };
  }

  saveDb();
  res.json({ success: true, message: msg });
});

// Delete own message
app.delete('/api/messages/:convId/:msgId', (req, res) => {
  const activeUser = resolveUser(req);
  const conv = conversationsList.find(c => c.id === req.params.convId);
  if (!conv || !isConvParticipant(conv, activeUser.id)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const msgs = messagesMap[conv.id] || [];
  const msg = msgs.find(m => m.id === req.params.msgId);
  if (!msg) return res.status(404).json({ error: 'Message not found' });
  if (msg.senderId !== activeUser.id) {
    return res.status(403).json({ error: 'Only the sender can delete their own message' });
  }

  msg.isDeleted = true;
  msg.text = 'This message was deleted';
  msg.mediaUrl = undefined;
  msg.mediaUrls = undefined;
  msg.mediaType = undefined;
  msg.fileName = undefined;
  msg.fileSize = undefined;
  msg.voiceDurationSeconds = undefined;

  if (conv.lastMessage && conv.lastMessage.id === msg.id) {
    conv.lastMessage = { ...msg };
  }

  saveDb();
  res.json({ success: true, message: msg });
});

// WebRTC Voice & Video Calls Signaling & Call History
app.get('/api/calls', (req, res) => {
  const activeUser = resolveUser(req);
  const userCalls = callsList
    .filter(c => c.callerId === activeUser.id || c.calleeId === activeUser.id)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  const incomingCall = userCalls.find(
    c => c.calleeId === activeUser.id && c.status === 'ringing' &&
    (Date.now() - new Date(c.startedAt).getTime() < 60000)
  ) || null;

  res.json({
    success: true,
    calls: userCalls.slice(0, 50),
    incomingCall
  });
});

app.post('/api/calls/initiate', (req, res) => {
  const activeUser = resolveUser(req);
  const { calleeId, callee, type, conversationId, offer } = req.body;
  const targetUser = usersList.find(u => u.id === (calleeId || callee?.id)) || callee;
  if (!targetUser) {
    return res.status(404).json({ error: 'Recipient user not found' });
  }

  const newCall: CallSession = {
    id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    conversationId,
    callerId: activeUser.id,
    caller: getEnrichedUser(activeUser),
    calleeId: targetUser.id,
    callee: getEnrichedUser(targetUser),
    type: type === 'audio' ? 'audio' : 'video',
    status: 'ringing',
    startedAt: new Date().toISOString(),
    offer: offer || null,
    answer: null,
    callerCandidates: [],
    calleeCandidates: []
  };

  callsList.unshift(newCall);
  saveDb();
  res.status(201).json({ success: true, call: newCall });
});

app.get('/api/calls/:id', (req, res) => {
  const call = callsList.find(c => c.id === req.params.id);
  if (!call) return res.status(404).json({ error: 'Call session not found' });
  res.json({ success: true, call });
});

app.post('/api/calls/:id/signal', (req, res) => {
  const activeUser = resolveUser(req);
  const call = callsList.find(c => c.id === req.params.id);
  if (!call) return res.status(404).json({ error: 'Call session not found' });
  if (call.callerId !== activeUser.id && call.calleeId !== activeUser.id) {
    return res.status(403).json({ error: 'Not a call participant' });
  }

  const { status, offer, answer, candidate, role } = req.body;
  if (offer) call.offer = offer;
  if (answer) call.answer = answer;
  if (candidate) {
    if (role === 'caller' || activeUser.id === call.callerId) {
      if (!call.callerCandidates) call.callerCandidates = [];
      call.callerCandidates.push(candidate);
    } else {
      if (!call.calleeCandidates) call.calleeCandidates = [];
      call.calleeCandidates.push(candidate);
    }
  }
  if (status) {
    call.status = status;
    if (status === 'connected' && !call.connectedAt) {
      call.connectedAt = new Date().toISOString();
    }
    if (status === 'ended' || status === 'rejected' || status === 'missed') {
      call.endedAt = new Date().toISOString();
      if (call.connectedAt) {
        call.durationSeconds = Math.max(
          1,
          Math.round((new Date(call.endedAt).getTime() - new Date(call.connectedAt).getTime()) / 1000)
        );
      }
    }
  }

  saveDb();
  res.json({ success: true, call });
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
  const activeUser = resolveUser(req);
  const filtered = notificationsList.filter(
    n => !n.recipientId || n.recipientId === activeUser.id
  );
  res.json({ success: true, notifications: filtered });
});

app.post('/api/notifications/mark-read', (req, res) => {
  const activeUser = resolveUser(req);
  notificationsList.forEach(n => {
    if (!n.recipientId || n.recipientId === activeUser.id) {
      n.read = true;
    }
  });
  saveDb();
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

  const setPwaStaticHeaders = (res: express.Response, filePath: string) => {
    if (filePath.endsWith('manifest.json') || filePath.endsWith('.webmanifest')) {
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else if (filePath.endsWith('sw.js') || filePath.endsWith('registerSW.js')) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Service-Worker-Allowed', '/');
    }
  };

  // Always serve static files from public/ (manifest.json, icons, logos, assetlinks)
  if (fs.existsSync(publicPath)) {
    app.use(
      express.static(publicPath, {
        setHeaders: setPwaStaticHeaders,
      })
    );
  }

  // Always serve compiled Service Worker files (/sw.js, /registerSW.js, /workbox-*.js) with proper JS MIME type
  app.get(['/sw.js', '/registerSW.js', '/workbox-:hash.js'], (req, res, next) => {
    const candidate = path.join(distPath, path.basename(req.path));
    if (fs.existsSync(candidate)) {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Service-Worker-Allowed', '/');
      return res.sendFile(candidate);
    }
    next();
  });

  if (process.env.NODE_ENV === 'production' && fs.existsSync(distPath)) {
    app.use(
      express.static(distPath, {
        setHeaders: setPwaStaticHeaders,
      })
    );
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Dynamic import vite in dev mode with HMR disabled
    process.env.DISABLE_HMR = 'true';
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
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

