import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Home, Compass, Plus, Film, MessageCircle, User } from 'lucide-react';

export const MobileTabBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    openCreateModal,
    conversations,
    setViewingProfileUsername,
    currentUser
  } = useApp();

  const totalUnreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 pb-safe">
      <div className="grid grid-cols-5 items-center h-16 max-w-md mx-auto">
        {/* Home */}
        <button
          onClick={() => {
            setViewingProfileUsername(null);
            setActiveTab('feed');
          }}
          className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center text-slate-600 dark:text-slate-400"
          aria-label="Home"
        >
          <Home className={`w-6 h-6 transition-transform ${activeTab === 'feed' ? 'text-rose-500 scale-110' : ''}`} />
          <span className={`text-[10px] font-medium tracking-tight mt-0.5 ${activeTab === 'feed' ? 'text-rose-500 font-bold' : ''}`}>
            Home
          </span>
        </button>

        {/* Explore */}
        <button
          onClick={() => setActiveTab('explore')}
          className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center text-slate-600 dark:text-slate-400"
          aria-label="Explore"
        >
          <Compass className={`w-6 h-6 transition-transform ${activeTab === 'explore' ? 'text-rose-500 scale-110' : ''}`} />
          <span className={`text-[10px] font-medium tracking-tight mt-0.5 ${activeTab === 'explore' ? 'text-rose-500 font-bold' : ''}`}>
            Explore
          </span>
        </button>

        {/* Create Button (Center prominent) */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => openCreateModal('post')}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 active:scale-95 transition-all"
            aria-label="Create Content"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Reels */}
        <button
          onClick={() => setActiveTab('reels')}
          className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center text-slate-600 dark:text-slate-400"
          aria-label="Reels"
        >
          <Film className={`w-6 h-6 transition-transform ${activeTab === 'reels' ? 'text-rose-500 scale-110' : ''}`} />
          <span className={`text-[10px] font-medium tracking-tight mt-0.5 ${activeTab === 'reels' ? 'text-rose-500 font-bold' : ''}`}>
            Reels
          </span>
        </button>

        {/* Profile */}
        <button
          onClick={() => {
            setViewingProfileUsername(currentUser?.username || null);
            setActiveTab('profile');
          }}
          className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center text-slate-600 dark:text-slate-400"
          aria-label="Profile"
        >
          <div className={`w-7 h-7 rounded-full overflow-hidden p-0.5 border-2 ${activeTab === 'profile' ? 'border-rose-500' : 'border-transparent'}`}>
            <img
              src={currentUser?.avatar || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f43f5e"/><stop offset="100%" stop-color="%236366f1"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(%23g)"/><text x="50" y="58" font-size="36" font-weight="bold" fill="white" text-anchor="middle" font-family="sans-serif">${encodeURIComponent(currentUser?.displayName?.[0] || 'U')}</text></svg>`}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <span className={`text-[10px] font-medium tracking-tight ${activeTab === 'profile' ? 'text-rose-500 font-bold' : ''}`}>
            Profile
          </span>
        </button>
      </div>
    </nav>
  );
};
