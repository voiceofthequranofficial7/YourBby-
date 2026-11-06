import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Search,
  PlusSquare,
  MessageCircle,
  Bell,
  Moon,
  Sun,
  Globe,
  Radio,
  CheckCircle2,
  Sparkles,
  Settings,
  Shield,
  BarChart3,
  LogOut,
  X,
  Camera
} from 'lucide-react';
import { MenuDrawer } from './MenuDrawer.tsx';
import type { SupportedLanguage } from '../../types/index.ts';

export const Header: React.FC = () => {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    activeTab,
    setActiveTab,
    currentUser,
    openCreateModal,
    unreadNotifsCount,
    notifications,
    markAllNotificationsRead,
    setIsLiveModalOpen,
    liveStream,
    setViewingProfileUsername,
    conversations,
    setIsAuthModalOpen
  } = useApp();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isMenuDrawerOpen, setIsMenuDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const totalUnreadMessages = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveTab('explore');
    }
  };

  const handleProfileClick = () => {
    setViewingProfileUsername(currentUser?.username || null);
    setActiveTab('profile');
    setIsUserMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Zone 1: Hamburger Menu + Brand Wordmark & Logo */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Hamburger Three-Line Menu Button */}
            <button
              onClick={() => setIsMenuDrawerOpen(true)}
              className="p-2 -ml-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              title="Open Navigation Menu"
              aria-label="Open Navigation Menu"
            >
              <div className="w-5 h-4 flex flex-col justify-between">
                <span className="w-full h-0.5 bg-current rounded-full" />
                <span className="w-full h-0.5 bg-current rounded-full" />
                <span className="w-full h-0.5 bg-current rounded-full" />
              </div>
            </button>

            {/* Fixed Official YourBby Brand Logo & Name */}
            <button
              onClick={() => {
                setActiveTab('feed');
                setViewingProfileUsername(null);
              }}
              className="flex items-center gap-2 group cursor-pointer text-left"
            >
              <div className="relative w-8.5 h-8.5 rounded-xl overflow-hidden bg-gradient-to-tr from-rose-500 via-purple-600 to-indigo-600 p-[1.5px] shadow-sm">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center overflow-hidden">
                  <img
                    src="/src/assets/images/yourbby_logo_mark_1793866710902.jpg"
                    alt="YourBby Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent">
                YourBby
              </span>
            </button>
          </div>

        {/* Zone 2: Search Affordance */}
        <div className="hidden sm:flex flex-1 max-w-md mx-2">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-transparent focus:border-rose-500/30 rounded-full text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition-all"
            />
          </form>
        </div>

        {/* Zone 3: Actions & Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Live broadcast pulse indicator */}
          {liveStream?.isLive && (
            <button
              onClick={() => setIsLiveModalOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors"
              title="Watch Live Stream"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-rose-500" />
              <span>LIVE NOW</span>
            </button>
          )}

          {/* Create Button */}
          <button
            onClick={() => openCreateModal('post')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white rounded-full text-xs font-semibold shadow-sm transition-all transform active:scale-95"
          >
            <PlusSquare className="w-4 h-4" />
            <span className="hidden sm:inline">{t('create')}</span>
          </button>

          {/* Messages shortcut */}
          <button
            onClick={() => setActiveTab('messages')}
            className={`relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors ${
              activeTab === 'messages' ? 'bg-slate-100 dark:bg-slate-800 text-rose-500' : ''
            }`}
            title={t('messages')}
          >
            <MessageCircle className="w-5 h-5" />
            {totalUnreadMessages > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalUnreadMessages}
              </span>
            )}
          </button>

          {/* Notifications button with dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                if (!isNotifOpen && unreadNotifsCount > 0) {
                  markAllNotificationsRead();
                }
              }}
              className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Notifications</h4>
                  <button
                    onClick={() => setIsNotifOpen(false)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="py-6 text-center text-xs text-slate-500">No notifications yet</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="py-3 flex items-start gap-3">
                        <img
                          src={n.actor.avatar}
                          alt={n.actor.displayName}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                        <div className="flex-1 text-xs">
                          <p className="text-slate-800 dark:text-slate-200">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {n.actor.displayName}
                            </span>{' '}
                            {n.text}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1"
              title="Change Language"
            >
              <Globe className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase">{language}</span>
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-50">
                <button
                  onClick={() => { setLanguage('en'); setIsLangMenuOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    language === 'en' ? 'text-rose-500 font-semibold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>English</span>
                  {language === 'en' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setLanguage('hi'); setIsLangMenuOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    language === 'hi' ? 'text-rose-500 font-semibold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>हिन्दी (Hindi)</span>
                  {language === 'hi' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setLanguage('bn'); setIsLangMenuOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    language === 'bn' ? 'text-rose-500 font-semibold' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>বাংলা (Bengali)</span>
                  {language === 'bn' && <CheckCircle2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

          {/* Camera Direct Quick-Access */}
          <button
            onClick={() => openCreateModal('story')}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
            title="Open Camera / Story"
          >
            <Camera className="w-5 h-5 text-rose-500" />
          </button>

          {/* User profile avatar & menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-rose-500/50 transition-all cursor-pointer"
            >
              <img
                src={currentUser?.avatar || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23f43f5e"/><stop offset="100%" stop-color="%236366f1"/></linearGradient></defs><rect width="100" height="100" rx="50" fill="url(%23g)"/><text x="50" y="58" font-size="36" font-weight="bold" fill="white" text-anchor="middle" font-family="sans-serif">${encodeURIComponent(currentUser?.displayName?.[0] || 'U')}</text></svg>`}
                alt={currentUser?.displayName}
                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
              />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                    {currentUser?.displayName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">@{currentUser?.username}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={handleProfileClick}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                  >
                    <Sparkles className="w-4 h-4 text-rose-500" />
                    <span>Your Profile</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('creator-dashboard'); setIsUserMenuOpen(false); }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                  >
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    <span>Creator Studio</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('admin-dashboard'); setIsUserMenuOpen(false); }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                  >
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span>Admin Center</span>
                  </button>
                  <button
                    onClick={() => { setActiveTab('settings'); setIsUserMenuOpen(false); }}
                    className="w-full px-4 py-2 text-left text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Settings & Privacy</span>
                  </button>
                  <button
                    onClick={() => { setIsAuthModalOpen(true); setIsUserMenuOpen(false); }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 border-t border-slate-100 dark:border-slate-800"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Switch Account / Sign In</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>

      {/* Slide-out Main Navigation Drawer */}
      <MenuDrawer
        isOpen={isMenuDrawerOpen}
        onClose={() => setIsMenuDrawerOpen(false)}
      />
    </>
  );
};
