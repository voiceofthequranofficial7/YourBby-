import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { TrendingUp, Sparkles, Check, UserPlus } from 'lucide-react';
import type { User } from '../../types/index.ts';

export const RightSidebar: React.FC = () => {
  const {
    t,
    currentUser,
    startChatWithUser,
    toggleFollowUser,
    setActiveTab,
    setViewingProfileUsername
  } = useApp();

  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(d => {
        if (d.success) setAllUsers(d.users);
      })
      .catch(console.error);
  }, []);

  const otherUsers = allUsers.filter(u => u.id !== currentUser?.id);
  const activeContacts = otherUsers.filter(u => u.isOnline);
  const suggestedCreators = otherUsers.slice(0, 3);

  const trendingTopics = [
    { tag: 'YourBbyReels', count: '142K posts' },
    { tag: 'KolkataSunset', count: '84K posts' },
    { tag: 'IndieTechIndia', count: '52K posts' },
    { tag: 'StreetwearBengal', count: '39K posts' },
    { tag: 'MonsoonRhythms', count: '28K posts' },
  ];

  return (
    <aside className="w-80 shrink-0 hidden lg:block py-6 pl-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar space-y-6">
      {/* Suggested Creators */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('suggestedForYou')}
          </h4>
          <button
            onClick={() => setActiveTab('explore')}
            className="text-xs font-semibold text-rose-500 hover:text-rose-600"
          >
            {t('viewAll')}
          </button>
        </div>

        <div className="space-y-3">
          {suggestedCreators.map((creator) => (
            <div key={creator.id} className="flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  setViewingProfileUsername(creator.username);
                  setActiveTab('profile');
                }}
                className="flex items-center gap-2.5 min-w-0 text-left group"
              >
                <img
                  src={creator.avatar}
                  alt={creator.displayName}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 group-hover:ring-rose-500 transition-all shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-rose-500 transition-colors">
                    {creator.displayName}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">@{creator.username}</p>
                </div>
              </button>

              <button
                onClick={() => toggleFollowUser(creator.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all shrink-0 ${
                  creator.isFollowing
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    : 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm'
                }`}
              >
                {creator.isFollowing ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-3 h-3" /> Following
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <UserPlus className="w-3 h-3" /> {t('follow')}
                  </span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-1.5 mb-3 text-slate-900 dark:text-white font-bold text-sm">
          <TrendingUp className="w-4 h-4 text-rose-500" />
          <span>{t('trending')}</span>
        </div>
        <div className="space-y-2.5">
          {trendingTopics.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab('explore')}
              className="w-full flex items-center justify-between text-left group hover:bg-slate-50 dark:hover:bg-slate-800/50 p-1.5 rounded-lg transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-rose-500 transition-colors">
                  #{item.tag}
                </p>
                <p className="text-[11px] text-slate-400">{item.count}</p>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-rose-400 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Active Contacts / Chat Shortcut */}
      <div className="bg-white dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('activeNow')}
          </h4>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>

        <div className="space-y-2.5">
          {activeContacts.map((user) => (
            <button
              key={user.id}
              onClick={() => startChatWithUser(user)}
              className="w-full flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors text-left"
            >
              <div className="relative shrink-0">
                <img
                  src={user.avatar}
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                  {user.displayName}
                </p>
                <p className="text-[10px] text-slate-400 truncate">@{user.username}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
