import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Home,
  Film,
  MessageCircle,
  Compass,
  Users,
  Calendar,
  Bookmark,
  BarChart3,
  Shield,
  Settings,
  Sparkles,
  Radio
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    t,
    currentUser,
    setViewingProfileUsername,
    setIsLiveModalOpen,
    liveStream
  } = useApp();

  const navItems = [
    { id: 'feed', label: t('home'), icon: Home },
    { id: 'reels', label: t('reels'), icon: Film },
    { id: 'messages', label: t('messages'), icon: MessageCircle },
    { id: 'explore', label: t('explore'), icon: Compass },
    { id: 'communities', label: t('communities'), icon: Users },
    { id: 'events', label: t('events'), icon: Calendar },
    { id: 'saved', label: t('saved'), icon: Bookmark },
    { id: 'creator-dashboard', label: t('creatorStudio'), icon: BarChart3 },
    { id: 'admin-dashboard', label: t('adminCenter'), icon: Shield },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:block py-6 pr-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto no-scrollbar">
      {/* Profile quick preview */}
      <button
        onClick={() => {
          setViewingProfileUsername(currentUser?.username || null);
          setActiveTab('profile');
        }}
        className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer text-left mb-4 ${
          activeTab === 'profile'
            ? 'bg-gradient-to-r from-rose-500/10 to-indigo-500/10 border border-rose-500/20'
            : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
        }`}
      >
        <div className="relative">
          <img
            src={currentUser?.avatar || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f43f5e"/><stop offset="100%" stop-color="%236366f1"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(%23g)"/><text x="50" y="58" font-size="36" font-weight="bold" fill="white" text-anchor="middle" font-family="sans-serif">${encodeURIComponent(currentUser?.displayName?.[0] || 'U')}</text></svg>`}
            alt={currentUser?.displayName}
            className="w-11 h-11 rounded-full object-cover ring-2 ring-rose-500/40"
          />
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {currentUser?.displayName}
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 truncate block">
            @{currentUser?.username}
          </span>
        </div>
      </button>

      {/* Navigation links */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'feed') setViewingProfileUsername(null);
                setActiveTab(item.id);
              }}
              className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${
                isActive
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Live Stream Banner in Sidebar */}
      {liveStream && (
        <div className="mt-6 p-3.5 rounded-2xl bg-gradient-to-br from-rose-500/10 via-indigo-500/10 to-purple-500/10 border border-rose-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-500 uppercase tracking-wide">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              Live Stream
            </span>
            <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-bold">
              {liveStream.viewersCount} watching
            </span>
          </div>
          <p className="text-xs font-medium text-slate-800 dark:text-slate-200 line-clamp-2 mb-2.5">
            {liveStream.title}
          </p>
          <button
            onClick={() => setIsLiveModalOpen(true)}
            className="w-full py-1.5 px-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
          >
            Watch Stream
          </button>
        </div>
      )}

      {/* Footer subtle copy */}
      <div className="mt-8 px-3 text-[11px] text-slate-400 space-y-1">
        <p>© 2026 YourBby Technologies</p>
        <p className="text-[10px]">Your World. Your People. Global Edition.</p>
      </div>
    </aside>
  );
};
