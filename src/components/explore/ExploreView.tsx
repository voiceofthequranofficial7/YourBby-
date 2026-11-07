import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Search, Film, Heart, Users, CheckCircle2, MessageSquare, X } from 'lucide-react';
import { PostCard } from '../feed/PostCard.tsx';

export const ExploreView: React.FC = () => {
  const {
    posts,
    reels,
    allUsers,
    currentUser,
    toggleFollowUser,
    setActiveTab,
    setViewingProfileUsername,
    globalSearchQuery,
    setGlobalSearchQuery
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<'All' | 'People' | 'Posts' | 'Photos' | 'Reels'>('All');

  const query = globalSearchQuery.trim().toLowerCase().replace(/^@/, '');

  // Filter real registered users by username or displayName (no fake users)
  const filteredUsers = allUsers.filter((user) => {
    if (!query) return true;
    return (
      user.username.toLowerCase().includes(query) ||
      user.displayName.toLowerCase().includes(query) ||
      (user.bio && user.bio.toLowerCase().includes(query)) ||
      (user.location && user.location.toLowerCase().includes(query))
    );
  });

  // Filter real posts by content, author username/displayName, location, or tags
  const filteredPosts = posts.filter((post) => {
    if (!query) return true;
    const matchContent = post.content?.toLowerCase().includes(query);
    const matchAuthor =
      post.author.username.toLowerCase().includes(query) ||
      post.author.displayName.toLowerCase().includes(query);
    const matchLocation = post.locationName?.toLowerCase().includes(query);
    const matchTags = post.tags?.some((t) => t.toLowerCase().includes(query));
    return matchContent || matchAuthor || matchLocation || matchTags;
  });

  const mediaPosts = filteredPosts.filter((p) => p.mediaUrls && p.mediaUrls.length > 0);

  const handleOpenUserProfile = (username: string) => {
    setViewingProfileUsername(username);
    setActiveTab('profile');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 my-2 pb-10">
      {/* Search Bar */}
      <div className="relative w-full">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={globalSearchQuery}
          onChange={(e) => setGlobalSearchQuery(e.target.value)}
          placeholder="Search people by @username or display name, or search posts..."
          className="w-full pl-11 pr-10 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        />
        {globalSearchQuery && (
          <button
            type="button"
            onClick={() => setGlobalSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        {(['All', 'People', 'Posts', 'Photos', 'Reels'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Real User Directory / Search Results */}
      {(activeCategory === 'All' || activeCategory === 'People') && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-rose-500" />
              <span>
                {query ? `People matching "${globalSearchQuery}"` : 'Discover People on YourBby'} ({filteredUsers.length})
              </span>
            </h3>
          </div>

          {filteredUsers.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              No registered users found matching "{globalSearchQuery}".
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredUsers.map((user) => {
                const isMe = currentUser?.id === user.id;
                return (
                  <div
                    key={user.id}
                    onClick={() => handleOpenUserProfile(user.username)}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3 cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {user.displayName}
                          </p>
                          {user.verified && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                        {user.bio && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {!isMe ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFollowUser(user.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                          user.isFollowing
                            ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                            : 'bg-rose-500 hover:bg-rose-600 text-white'
                        }`}
                      >
                        {user.isFollowing ? 'Following' : 'Follow'}
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-500 text-[10px] font-bold shrink-0">
                        You
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Real Media Grid (Photos & Reels) */}
      {(activeCategory === 'All' || activeCategory === 'Photos' || activeCategory === 'Reels') && (
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white px-1">
            {activeCategory === 'Reels' ? 'Reels & Short Videos' : 'Community Photos & Media'}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {activeCategory !== 'Reels' &&
              mediaPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handleOpenUserProfile(post.author.username)}
                  className="relative group rounded-2xl overflow-hidden cursor-pointer bg-slate-950 aspect-square border border-slate-200 dark:border-slate-800"
                >
                  {post.mediaType === 'video' ? (
                    <video
                      src={post.mediaUrls?.[0]}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={post.mediaUrls?.[0]}
                      alt={post.content || 'Post media'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white">
                    <p className="text-xs font-bold truncate">{post.content || 'Photo Post'}</p>
                    <div className="flex items-center justify-between text-[11px] text-white/80 mt-1">
                      <span>@{post.author.username}</span>
                      <span className="flex items-center gap-2 font-semibold">
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                          {post.likesCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {post.commentsCount}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}

            {(activeCategory === 'All' || activeCategory === 'Reels') &&
              reels
                .filter((r) => {
                  if (!query) return true;
                  return (
                    r.caption.toLowerCase().includes(query) ||
                    r.author.username.toLowerCase().includes(query) ||
                    r.author.displayName.toLowerCase().includes(query)
                  );
                })
                .map((reel) => (
                  <div
                    key={reel.id}
                    onClick={() => setActiveTab('reels')}
                    className="relative group rounded-2xl overflow-hidden cursor-pointer bg-slate-950 aspect-square border border-slate-200 dark:border-slate-800"
                  >
                    <video
                      src={reel.videoUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <div className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white">
                      <Film className="w-3.5 h-3.5" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end text-white">
                      <p className="text-xs font-bold truncate">{reel.caption}</p>
                      <div className="flex items-center justify-between text-[11px] text-white/80 mt-1">
                        <span>@{reel.author.username}</span>
                        <span className="flex items-center gap-1 font-semibold">
                          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                          {reel.likesCount}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}

      {/* Real Matching Posts Feed */}
      {(activeCategory === 'All' || activeCategory === 'Posts') && (
        <div className="space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white px-1">
            {query ? `Posts matching "${globalSearchQuery}"` : 'Recent Community Posts'} ({filteredPosts.length})
          </h3>
          {filteredPosts.length === 0 ? (
            <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400">
              No posts match your search.
            </div>
          ) : (
            filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </div>
      )}
    </div>
  );
};
