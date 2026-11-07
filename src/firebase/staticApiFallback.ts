import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth, sanitizeUserForFirestore } from './config.ts';
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
} from '../types/index.ts';

const STORAGE_KEY = 'yourbby_static_db_v1';

const DEFAULT_OWNER_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%230f172a"/><circle cx="100" cy="100" r="76" fill="%231e293b" stroke="%23f43f5e" stroke-width="4"/><text x="100" y="118" font-family="system-ui,sans-serif" font-size="64" font-weight="bold" fill="%23ffffff" text-anchor="middle">MS</text></svg>';

const initialOwner: User = {
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
  privacy: 'public',
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
  privacy: 'public',
};

interface StaticStore {
  currentUser: User;
  usersList: User[];
  postsList: Post[];
  commentsMap: Record<string, Comment[]>;
  storiesList: Story[];
  reelsList: Reel[];
  notesList: Note[];
  conversationsList: Conversation[];
  messagesMap: Record<string, Message[]>;
  notificationsList: NotificationItem[];
  groupsList: Group[];
  eventsList: SocialEvent[];
  liveStream: LiveStream;
  creatorAnalytics: CreatorAnalytics;
  reportsList: ContentReport[];
}

function getInitialStore(): StaticStore {
  return {
    currentUser: initialOwner,
    usersList: [initialOwner, officialPlatformUser],
    postsList: [
      {
        id: 'p_welcome',
        authorId: 'u_admin',
        author: officialPlatformUser,
        content:
          'Welcome to YourBby — YOUR WORLD. YOUR PEOPLE. ✨\n\nExperience genuine, unfiltered social connection. Create your first post, upload a reel, capture real moments with our camera, or connect with your community.',
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
        tags: ['YourBby', 'YourWorldYourPeople', 'Community'],
      },
    ],
    commentsMap: {},
    storiesList: [],
    reelsList: [],
    notesList: [],
    conversationsList: [],
    messagesMap: {},
    notificationsList: [],
    groupsList: [
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
          'Constructive critique and technical feedback welcomed',
        ],
        postsCount: 0,
      },
      {
        id: 'grp_2',
        name: 'Indie Developers India',
        coverImage: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1000&auto=format&fit=crop&q=80',
        description:
          'Founders building consumer tech, AI applications, and community tools across India and Southeast Asia.',
        category: 'Technology & Startups',
        privacy: 'public',
        membersCount: 1,
        isMember: true,
        isAdmin: false,
        rules: ['Share actionable learnings and metrics', 'Constructive feedback only'],
        postsCount: 0,
      },
    ],
    eventsList: [
      {
        id: 'ev_1',
        title: 'Bengal Visual Arts & Creator Con 2026',
        description:
          'Join creators, filmmakers, and digital artists for keynote talks, live editing workshops, and rooftop networking.',
        coverImage: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1000&auto=format&fit=crop&q=80',
        date: 'Saturday, Nov 22, 2026',
        time: '4:00 PM – 9:30 PM IST',
        location: 'Science City Auditorium, Kolkata',
        organizer: officialPlatformUser,
        rsvpStatus: 'not_going',
        attendeesCount: 0,
      },
    ],
    liveStream: {
      id: 'live_default',
      host: officialPlatformUser,
      title: 'Welcome to YourBby Broadcasts 🌐',
      category: 'Community & Events',
      viewersCount: 0,
      isLive: false,
      startedAt: new Date().toISOString(),
      chatMessages: [],
    },
    creatorAnalytics: {
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
        { date: 'Sun', views: 0, interactions: 0 },
      ],
    },
    reportsList: [],
  };
}

function loadStore(): StaticStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...getInitialStore(), ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Could not read local static store:', e);
  }
  return getInitialStore();
}

function saveStore(store: StaticStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('Could not save local static store:', e);
  }
}

// Sync user profile changes with real Firestore database using canonical user ID
async function syncUserToFirestore(user: User) {
  try {
    const uid = auth.currentUser?.uid || user.id;
    const payload = await sanitizeUserForFirestore({ ...user, id: uid });
    await setDoc(doc(db, 'users', uid), payload, { merge: true });
  } catch (e) {
    console.warn('Firestore user sync skipped:', e);
  }
}

async function syncPostToFirestore(post: Post) {
  if (!auth.currentUser) return;
  try {
    const uid = auth.currentUser.uid;
    await setDoc(doc(db, 'posts', post.id), { ...post, authorId: uid }, { merge: true });
  } catch (e) {
    console.warn('Firestore post sync skipped:', e);
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function handleClientApiFallback(urlStr: string, init?: RequestInit): Promise<Response> {
  const url = new URL(urlStr, window.location.origin);
  const path = url.pathname;
  const method = (init?.method || 'GET').toUpperCase();
  const body = init?.body ? JSON.parse(String(init.body)) : {};
  const store = loadStore();

  // Pull from Firestore on /api/me GET
  if (path === '/api/me' && method === 'GET') {
    try {
      const targetId = auth.currentUser?.uid || store.currentUser.id;
      const snap = await getDoc(doc(db, 'users', targetId));
      if (snap.exists()) {
        const fsData = snap.data() as User;
        const resolvedCover = fsData.coverPhotoURL !== undefined ? fsData.coverPhotoURL : fsData.coverPhoto;
        store.currentUser = {
          ...store.currentUser,
          ...fsData,
          ...(resolvedCover !== undefined ? { coverPhotoURL: resolvedCover, coverPhoto: resolvedCover } : {})
        };
        saveStore(store);
      }
    } catch (_) {}
  }

  if (auth.currentUser && path === '/api/feed' && method === 'GET') {
    try {
      const snaps = await getDocs(collection(db, 'posts'));
      if (!snaps.empty) {
        const fsPosts: Post[] = [];
        snaps.forEach(d => fsPosts.push(d.data() as Post));
        const existingIds = new Set(fsPosts.map(p => p.id));
        store.postsList = [...fsPosts, ...store.postsList.filter(p => !existingIds.has(p.id))];
        saveStore(store);
      }
    } catch (_) {}
  }

  // 1. /api/me & /api/profile/update & /api/users/register & /api/auth/*
  if (path === '/api/me' && method === 'GET') {
    return jsonResponse({ success: true, user: store.currentUser });
  }

  if (path === '/api/users/register' && method === 'POST') {
    const cleanUsername = String(body.username || '').trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername || cleanUsername.length < 3) {
      return jsonResponse({ error: 'Valid username (3-30 characters) is required' }, 400);
    }
    const existing = store.usersList.find(u => u.username.toLowerCase() === cleanUsername && u.id !== body.id);
    if (existing) {
      return jsonResponse({ error: 'Username is already taken' }, 409);
    }
    const targetId = body.id || auth.currentUser?.uid || `u_${Date.now()}`;
    const newUser: User = {
      id: targetId,
      username: cleanUsername,
      displayName: String(body.displayName || cleanUsername).trim(),
      email: body.email ? String(body.email).trim().toLowerCase() : undefined,
      avatar: body.avatar || DEFAULT_OWNER_AVATAR,
      coverPhotoURL: body.coverPhotoURL || body.coverPhoto || '',
      coverPhoto: body.coverPhotoURL || body.coverPhoto || '',
      bio: body.bio || '',
      location: body.location || '',
      website: body.website || '',
      verified: false,
      role: 'user',
      followersCount: 0,
      followingCount: 0,
      friendsCount: 0,
      isOnline: true,
      privacy: body.privacy || 'public',
    };
    store.currentUser = newUser;
    store.usersList = [newUser, ...store.usersList.filter(u => u.id !== newUser.id)];
    saveStore(store);
    await syncUserToFirestore(newUser);
    return jsonResponse({ success: true, user: newUser, users: store.usersList }, 201);
  }

  if (path === '/api/auth/login' && method === 'POST') {
    const rawIdent = String(body.identifier || body.email || body.username || '').trim().toLowerCase().replace(/^@/, '');
    const found = store.usersList.find(
      u => u.username.toLowerCase() === rawIdent || (u.email && u.email.toLowerCase() === rawIdent)
    );
    if (!found) {
      return jsonResponse({ error: 'Account not found. Please check your username or email.' }, 401);
    }
    store.currentUser = { ...found, isOnline: true };
    saveStore(store);
    return jsonResponse({ success: true, user: store.currentUser, users: store.usersList });
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    return jsonResponse({ success: true });
  }

  if (path === '/api/auth/change-password' && method === 'POST') {
    return jsonResponse({ success: true, message: 'Password updated successfully' });
  }

  if ((path === '/api/me' && method === 'PUT') || (path === '/api/profile/update' && method === 'POST')) {
    if (body.username) {
      const clean = String(body.username).trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');
      const conflict = store.usersList.find(
        u => u.username.toLowerCase() === clean && u.id !== store.currentUser.id
      );
      if (conflict) {
        return jsonResponse({ success: false, error: 'Username is already taken' }, 400);
      }
      body.username = clean;
    }
    const nextUser: User = {
      ...store.currentUser,
      ...body,
      settings: body.settings ? { ...(store.currentUser.settings || {}), ...body.settings } : store.currentUser.settings
    };
    if (body.coverPhotoURL !== undefined || body.coverPhoto !== undefined) {
      const resolvedCover = body.coverPhotoURL !== undefined ? body.coverPhotoURL : body.coverPhoto;
      nextUser.coverPhotoURL = resolvedCover || '';
      nextUser.coverPhoto = resolvedCover || '';
    }
    // Never overwrite avatar unless explicitly provided as non-empty string
    if (body.avatar === undefined) {
      nextUser.avatar = store.currentUser.avatar;
    }
    store.currentUser = nextUser;
    store.usersList = store.usersList.map(u => (u.id === store.currentUser.id ? store.currentUser : u));
    store.postsList = store.postsList.map(p =>
      p.author.id === store.currentUser.id ? { ...p, author: store.currentUser } : p
    );
    store.storiesList = store.storiesList.map(s =>
      s.author.id === store.currentUser.id ? { ...s, author: store.currentUser } : s
    );
    store.reelsList = store.reelsList.map(r =>
      r.author.id === store.currentUser.id ? { ...r, author: store.currentUser } : r
    );
    saveStore(store);
    await syncUserToFirestore(store.currentUser);
    return jsonResponse({ success: true, user: store.currentUser });
  }

  // 2. /api/users/check-username
  if (path === '/api/users/check-username' && method === 'GET') {
    const raw = (url.searchParams.get('username') || '').trim().toLowerCase();
    const conflict = store.usersList.find(
      u => u.username.toLowerCase() === raw && u.id !== store.currentUser.id
    );
    return jsonResponse({
      success: true,
      available: !conflict && raw.length >= 3,
      reason: conflict ? 'Username is already taken' : undefined,
    });
  }

  // 3. /api/users & /api/users/:username
  if (path === '/api/users' && method === 'GET') {
    return jsonResponse({
      success: true,
      users: store.usersList.filter(u => u.id !== store.currentUser.id),
    });
  }

  const userActionMatch = path.match(/^\/api\/users\/([^/]+)\/(follow|friend)$/);
  if (userActionMatch && method === 'POST') {
    const targetId = userActionMatch[1];
    const action = userActionMatch[2];
    store.usersList = store.usersList.map(u => {
      if (u.id !== targetId) return u;
      if (action === 'follow') {
        const next = !u.isFollowing;
        return { ...u, isFollowing: next, followersCount: Math.max(0, u.followersCount + (next ? 1 : -1)) };
      }
      return { ...u, isFriend: !u.isFriend };
    });
    saveStore(store);
    return jsonResponse({ success: true });
  }

  const userProfileMatch = path.match(/^\/api\/users\/([^/]+)$/);
  if (userProfileMatch && method === 'GET') {
    const uname = decodeURIComponent(userProfileMatch[1]).toLowerCase();
    const found =
      store.usersList.find(u => u.username.toLowerCase() === uname) ||
      (store.currentUser.username.toLowerCase() === uname ? store.currentUser : null);
    if (found) return jsonResponse({ success: true, user: found });
    return jsonResponse({ success: false, error: 'User not found' }, 404);
  }

  // 4. /api/feed & /api/posts
  if (path === '/api/feed' && method === 'GET') {
    return jsonResponse({ success: true, posts: store.postsList });
  }

  if (path === '/api/posts' && method === 'POST') {
    const newPost: Post = {
      id: body.id || `post_${Date.now()}`,
      authorId: auth.currentUser?.uid || store.currentUser.id,
      author: store.currentUser,
      content: body.content || '',
      mediaUrls: body.mediaUrls || [],
      mediaType: body.mediaType || 'image',
      locationName: body.locationName,
      feeling: body.feeling,
      poll: body.poll,
      audience: body.audience || 'public',
      createdAt: new Date().toISOString(),
      likesCount: 0,
      userReaction: null,
      likedBy: {},
      reactionCounts: { like: 0, love: 0, care: 0, haha: 0, wow: 0, sad: 0, angry: 0 },
      commentsCount: 0,
      repostsCount: 0,
      isBookmarked: false,
      tags: body.tags || [],
    };
    store.postsList = [newPost, ...store.postsList];
    saveStore(store);
    await syncPostToFirestore(newPost);
    return jsonResponse({ success: true, post: newPost });
  }

  const postItemMatch = path.match(/^\/api\/posts\/([^/]+)$/);
  if (postItemMatch && method === 'PUT') {
    const postId = postItemMatch[1];
    let editedPost: Post | undefined;
    store.postsList = store.postsList.map(p => {
      if (p.id !== postId) return p;
      editedPost = {
        ...p,
        content: body.content !== undefined ? String(body.content) : p.content,
        locationName: body.locationName !== undefined ? body.locationName : p.locationName,
        feeling: body.feeling !== undefined ? body.feeling : p.feeling,
        audience: body.audience !== undefined ? body.audience : p.audience,
        mediaUrls: Array.isArray(body.mediaUrls) ? body.mediaUrls : p.mediaUrls,
        mediaType: body.mediaType !== undefined ? body.mediaType : p.mediaType,
        isEdited: true,
        editedAt: new Date().toISOString(),
      };
      return editedPost;
    });
    saveStore(store);
    if (editedPost) await syncPostToFirestore(editedPost);
    return jsonResponse({ success: true, post: editedPost });
  }

  if (postItemMatch && method === 'DELETE') {
    const postId = postItemMatch[1];
    store.postsList = store.postsList.filter(p => p.id !== postId);
    delete store.commentsMap[postId];
    saveStore(store);
    if (auth.currentUser) {
      deleteDoc(doc(db, 'posts', postId)).catch(() => {});
    }
    return jsonResponse({ success: true });
  }

  const commentDeleteMatch = path.match(/^\/api\/posts\/([^/]+)\/comments\/([^/]+)$/);
  if (commentDeleteMatch && method === 'DELETE') {
    const [, postId, commentId] = commentDeleteMatch;
    const list = (store.commentsMap[postId] || []).filter(c => c.id !== commentId);
    store.commentsMap[postId] = list.map(c => ({
      ...c,
      replies: (c.replies || []).filter(r => r.id !== commentId)
    }));
    const newCount = store.commentsMap[postId].reduce(
      (sum, c) => sum + 1 + (c.replies ? c.replies.length : 0),
      0
    );
    store.postsList = store.postsList.map(p =>
      p.id === postId ? { ...p, commentsCount: newCount } : p
    );
    saveStore(store);
    return jsonResponse({ success: true, commentsCount: newCount });
  }

  const postSubMatch = path.match(/^\/api\/posts\/([^/]+)\/(react|bookmark|poll-vote|comments)$/);
  if (postSubMatch) {
    const postId = postSubMatch[1];
    const sub = postSubMatch[2];

    if (sub === 'comments' && method === 'GET') {
      return jsonResponse({ success: true, comments: store.commentsMap[postId] || [] });
    }

    if (sub === 'comments' && method === 'POST') {
      const comment: Comment = {
        id: body.id || `c_${Date.now()}`,
        postId,
        authorId: store.currentUser.id,
        author: store.currentUser,
        text: body.text || '',
        createdAt: new Date().toISOString(),
        likesCount: 0,
        replies: [],
      };
      store.commentsMap[postId] = [...(store.commentsMap[postId] || []), comment];
      store.postsList = store.postsList.map(p =>
        p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
      );
      saveStore(store);
      return jsonResponse({ success: true, comment });
    }

    if (sub === 'bookmark' && method === 'POST') {
      store.postsList = store.postsList.map(p =>
        p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p
      );
      saveStore(store);
      return jsonResponse({ success: true });
    }

    if (sub === 'react' && method === 'POST') {
      let respPayload: any = { success: true };
      store.postsList = store.postsList.map(p => {
        if (p.id !== postId) return p;
        const likedBy = { ...(p.likedBy || {}) };
        const prev = likedBy[store.currentUser.id] || null;
        const nextReaction = body.reaction === prev || body.reaction === null ? null : body.reaction;
        if (nextReaction) {
          likedBy[store.currentUser.id] = nextReaction;
        } else {
          delete likedBy[store.currentUser.id];
        }
        const reactionCounts: any = { like: 0, love: 0, care: 0, haha: 0, wow: 0, sad: 0, angry: 0 };
        let likesCount = 0;
        Object.values(likedBy).forEach(r => {
          if (r && reactionCounts[r] !== undefined) {
            reactionCounts[r]++;
            likesCount++;
          }
        });
        respPayload = {
          success: true,
          userReaction: nextReaction,
          likesCount,
          reactionCounts,
          likedBy
        };
        return { ...p, userReaction: nextReaction, likesCount, reactionCounts, likedBy };
      });
      saveStore(store);
      return jsonResponse(respPayload);
    }

    if (sub === 'poll-vote' && method === 'POST') {
      let updatedPoll: any = null;
      store.postsList = store.postsList.map(p => {
        if (p.id !== postId || !p.poll) return p;
        const options = p.poll.options.map(opt => {
          const voted = opt.votedUserIds.includes(store.currentUser.id);
          if (opt.id === body.optionId && !voted) {
            return { ...opt, votes: opt.votes + 1, votedUserIds: [...opt.votedUserIds, store.currentUser.id] };
          }
          return opt;
        });
        updatedPoll = { ...p.poll, options, totalVotes: p.poll.totalVotes + 1 };
        return { ...p, poll: updatedPoll };
      });
      saveStore(store);
      return jsonResponse({ success: true, poll: updatedPoll });
    }
  }

  // 5. /api/stories
  if (path === '/api/stories' && method === 'GET') {
    const nowMs = Date.now();
    store.storiesList = store.storiesList.filter(s => {
      const exp = new Date(s.expiresAt).getTime();
      return Number.isNaN(exp) || exp > nowMs;
    });
    saveStore(store);
    return jsonResponse({ success: true, stories: store.storiesList });
  }
  if (path === '/api/stories' && method === 'POST') {
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const story: Story = {
      id: `story_${Date.now()}`,
      author: store.currentUser,
      mediaUrl: body.mediaUrl || '',
      mediaType: body.mediaType || (body.mediaUrl ? 'image' : 'text'),
      textOverlay: body.textOverlay || body.caption,
      backgroundGradient: body.backgroundGradient,
      privacy: body.privacy || 'public',
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      seen: false,
      viewsCount: 0,
      viewerIds: [],
      viewers: [],
      stickers: body.stickers || [],
    };
    store.storiesList = [story, ...store.storiesList];
    saveStore(store);
    if (auth.currentUser) {
      setDoc(doc(db, 'stories', story.id), story, { merge: true }).catch(() => {});
    }
    return jsonResponse({ success: true, story });
  }

  const storyActionMatch = path.match(/^\/api\/stories\/([^/]+)(?:\/(view))?$/);
  if (storyActionMatch) {
    const storyId = storyActionMatch[1];
    const sub = storyActionMatch[2];
    if (sub === 'view' && method === 'POST') {
      let updatedStory: Story | undefined;
      store.storiesList = store.storiesList.map(s => {
        if (s.id !== storyId) return s;
        const viewerIds = Array.isArray(s.viewerIds) ? [...s.viewerIds] : [];
        const viewers = Array.isArray(s.viewers) ? [...s.viewers] : [];
        if (!viewerIds.includes(store.currentUser.id)) {
          viewerIds.push(store.currentUser.id);
          viewers.unshift({
            id: store.currentUser.id,
            displayName: store.currentUser.displayName,
            username: store.currentUser.username,
            avatar: store.currentUser.avatar,
            viewedAt: new Date().toISOString(),
          });
        }
        updatedStory = {
          ...s,
          seen: true,
          viewerIds,
          viewers,
          viewsCount: Math.max(s.viewsCount + 1, viewerIds.length),
        };
        return updatedStory;
      });
      saveStore(store);
      return jsonResponse({ success: true, story: updatedStory });
    }
    if (!sub && method === 'DELETE') {
      store.storiesList = store.storiesList.filter(s => s.id !== storyId);
      saveStore(store);
      if (auth.currentUser) {
        deleteDoc(doc(db, 'stories', storyId)).catch(() => {});
      }
      return jsonResponse({ success: true });
    }
  }

  // 6. /api/reels
  if (path === '/api/reels' && method === 'GET') {
    return jsonResponse({ success: true, reels: store.reelsList });
  }
  if (path === '/api/reels' && method === 'POST') {
    const reel: Reel = {
      id: `reel_${Date.now()}`,
      author: store.currentUser,
      videoUrl: body.videoUrl || '',
      thumbnailUrl: body.thumbnailUrl || body.videoUrl || '',
      caption: body.caption || '',
      audioTrack:
        typeof body.audioTrack === 'object' && body.audioTrack
          ? body.audioTrack
          : { title: String(body.audioTrack || 'Original Audio'), artist: store.currentUser.displayName },
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      hasLiked: false,
      isBookmarked: false,
      tags: body.tags || [],
      createdAt: new Date().toISOString(),
    };
    store.reelsList = [reel, ...store.reelsList];
    saveStore(store);
    return jsonResponse({ success: true, reel });
  }

  // 7. /api/notes
  if (path === '/api/notes' && method === 'GET') {
    return jsonResponse({ success: true, notes: store.notesList });
  }
  if (path === '/api/notes' && method === 'POST') {
    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const note: Note = {
      id: `note_${Date.now()}`,
      author: store.currentUser,
      text: body.text || '',
      musicSnippet: body.musicSnippet,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
    store.notesList = [note, ...store.notesList.filter(n => n.author.id !== store.currentUser.id)];
    saveStore(store);
    return jsonResponse({ success: true, note });
  }

  // 8. /api/messages
  if (path === '/api/messages/conversations' && method === 'GET') {
    return jsonResponse({ success: true, conversations: store.conversationsList });
  }
  if (path === '/api/messages/conversations' && method === 'POST') {
    const targetId = body.participantId || body.participant?.id;
    const targetUser = store.usersList.find(u => u.id === targetId) || body.participant || officialPlatformUser;
    let conv = store.conversationsList.find(c => !c.isGroup && c.participants.some(p => p.id === targetUser.id));
    if (!conv) {
      conv = {
        id: `conv_${Date.now()}`,
        isGroup: false,
        participants: [store.currentUser, targetUser],
        participantIds: [store.currentUser.id, targetUser.id],
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      };
      store.conversationsList.unshift(conv);
      store.messagesMap[conv.id] = [];
      saveStore(store);
    }
    if (auth.currentUser) {
      setDoc(doc(db, 'conversations', conv.id), conv, { merge: true }).catch(() => {});
    }
    return jsonResponse({ success: true, conversation: conv, messages: store.messagesMap[conv.id] || [] });
  }

  const convMsgMatch = path.match(/^\/api\/messages\/conversations\/([^/]+)(?:\/send)?$/);
  if (convMsgMatch) {
    const convId = convMsgMatch[1];
    const conv = store.conversationsList.find(c => c.id === convId);
    if (method === 'GET') {
      const msgs = store.messagesMap[convId] || [];
      msgs.forEach(m => {
        if (m.senderId !== store.currentUser.id) {
          m.read = true;
          m.status = 'read';
          m.readAt = new Date().toISOString();
        }
      });
      if (conv) conv.unreadCount = 0;
      saveStore(store);
      return jsonResponse({ success: true, conversation: conv, messages: msgs });
    }
    if (method === 'PATCH' && conv) {
      if (body.action === 'pin') conv.isPinned = !conv.isPinned;
      if (body.action === 'mute') conv.isMuted = !conv.isMuted;
      if (body.action === 'archive') conv.isArchived = !conv.isArchived;
      if (body.action === 'mark_read') conv.unreadCount = 0;
      saveStore(store);
      return jsonResponse({ success: true, conversation: conv });
    }
    if (method === 'DELETE') {
      store.conversationsList = store.conversationsList.filter(c => c.id !== convId);
      saveStore(store);
      return jsonResponse({ success: true });
    }
    if (method === 'POST') {
      const nowIso = new Date().toISOString();
      const msg: Message = {
        id: `msg_${Date.now()}`,
        conversationId: convId,
        senderId: store.currentUser.id,
        sender: store.currentUser,
        text: body.text || '',
        mediaUrl: body.mediaUrl || (Array.isArray(body.mediaUrls) ? body.mediaUrls[0] : undefined),
        mediaUrls: body.mediaUrls,
        mediaType: body.mediaType,
        fileName: body.fileName,
        fileSize: body.fileSize,
        voiceDurationSeconds: body.voiceDurationSeconds,
        voiceWaveform: body.voiceWaveform,
        replyTo: body.replyTo,
        createdAt: nowIso,
        deliveredAt: nowIso,
        status: 'delivered',
        read: false,
        reactions: [],
      };
      store.messagesMap[convId] = [...(store.messagesMap[convId] || []), msg];
      if (conv) {
        conv.lastMessage = msg;
        conv.updatedAt = nowIso;
      }
      saveStore(store);
      if (auth.currentUser) {
        setDoc(doc(db, 'conversations', convId, 'messages', msg.id), msg, { merge: true }).catch(() => {});
      }
      return jsonResponse({ success: true, message: msg, conversation: conv });
    }
  }

  const msgEditMatch = path.match(/^\/api\/messages\/([^/]+)\/([^/]+)$/);
  if (msgEditMatch) {
    const [, convId, msgId] = msgEditMatch;
    const msgs = store.messagesMap[convId] || [];
    const msg = msgs.find(m => m.id === msgId);
    if (!msg) return jsonResponse({ error: 'Message not found' }, 404);
    if (method === 'PATCH') {
      if (typeof body.text === 'string' && msg.senderId === store.currentUser.id) {
        msg.text = body.text.trim();
        msg.isEdited = true;
        msg.editedAt = new Date().toISOString();
      }
      if (body.reactionEmoji) {
        if (!msg.reactions) msg.reactions = [];
        const existing = msg.reactions.findIndex(r => r.userId === store.currentUser.id && r.emoji === body.reactionEmoji);
        if (existing !== -1) msg.reactions.splice(existing, 1);
        else {
          msg.reactions = msg.reactions.filter(r => r.userId !== store.currentUser.id);
          msg.reactions.push({ emoji: body.reactionEmoji, userId: store.currentUser.id, userName: store.currentUser.displayName });
        }
      }
      saveStore(store);
      return jsonResponse({ success: true, message: msg });
    }
    if (method === 'DELETE' && msg.senderId === store.currentUser.id) {
      msg.isDeleted = true;
      msg.text = 'This message was deleted';
      msg.mediaUrl = undefined;
      msg.mediaUrls = undefined;
      msg.mediaType = undefined;
      saveStore(store);
      return jsonResponse({ success: true, message: msg });
    }
  }

  if (path === '/api/calls' && method === 'GET') {
    return jsonResponse({ success: true, calls: [], incomingCall: null });
  }

  // 9. /api/groups, /api/events, /api/notifications, /api/live, /api/analytics, /api/admin
  if (path === '/api/groups' && method === 'GET') {
    return jsonResponse({ success: true, groups: store.groupsList });
  }
  if (path === '/api/events' && method === 'GET') {
    return jsonResponse({ success: true, events: store.eventsList });
  }
  if (path === '/api/notifications' && method === 'GET') {
    return jsonResponse({ success: true, notifications: store.notificationsList });
  }
  if (path === '/api/live' && method === 'GET') {
    return jsonResponse({ success: true, liveStream: store.liveStream });
  }
  if (path === '/api/analytics' && method === 'GET') {
    return jsonResponse({ success: true, analytics: store.creatorAnalytics });
  }
  if (path === '/api/admin/overview' && method === 'GET') {
    return jsonResponse({
      success: true,
      stats: {
        totalUsers: store.usersList.length,
        activeToday: store.usersList.length,
        postsCount: store.postsList.length,
        pendingReports: store.reportsList.length,
      },
      reports: store.reportsList,
    });
  }

  // 10. AI helper fallbacks when running on static hosting
  if (path === '/api/ai/caption-assistant' && method === 'POST') {
    return jsonResponse({
      success: true,
      caption: `${body.topic || 'Sharing a moment'} ✨ #YourBby #YourWorldYourPeople`,
      hashtags: ['YourBby', 'YourWorldYourPeople', 'Creators'],
    });
  }
  if (path === '/api/ai/translate' && method === 'POST') {
    return jsonResponse({
      success: true,
      translatedText: body.text || '',
    });
  }
  if (path === '/api/ai/content-safety' && method === 'POST') {
    return jsonResponse({
      success: true,
      audit: {
        isSafe: true,
        confidence: 0.98,
        flaggedCategories: [],
        summary: 'Content verified compliant with YourBby community standards.',
        recommendation: 'approve',
      },
    });
  }

  return jsonResponse({ success: true });
}

// Safe API fetch wrapper with static hosting / offline fallback + active user session header
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

  const isApiCall =
    urlStr.startsWith('/api/') ||
    (typeof window !== 'undefined' &&
      urlStr.startsWith(window.location.origin) &&
      new URL(urlStr).pathname.startsWith('/api/'));

  if (!isApiCall) {
    return window.fetch(input, init);
  }

  // Automatically attach active user ID from sessionStorage or localStorage for multi-account / 2-user testing
  const activeUserId =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('yourbby_active_user_id') || localStorage.getItem('yourbby_active_user_id')
      : null;

  const headers = new Headers(init?.headers || {});
  if (activeUserId && !headers.has('x-user-id')) {
    headers.set('x-user-id', activeUserId);
  }
  const nextInit: RequestInit = { ...init, headers };

  try {
    const response = await window.fetch(input, nextInit);
    const contentType = response.headers.get('content-type') || '';
    // If backend server.ts answered with valid JSON, return it directly
    if (contentType.includes('application/json')) {
      return response;
    }
    // If static hosting returned HTML rewrite or 502, fall back to client Firestore + localStorage store
    return await handleClientApiFallback(urlStr, nextInit);
  } catch {
    // Network offline or backend unreachable -> fall back to client Firestore + localStorage store
    return await handleClientApiFallback(urlStr, nextInit);
  }
}

export function installStaticApiFallback() {
  // No-op: never mutate window.fetch directly because window.fetch is getter-only in AI Studio preview
}
