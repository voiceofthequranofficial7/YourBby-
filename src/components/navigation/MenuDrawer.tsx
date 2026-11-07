import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import type { SettingsSectionId } from '../../types/index.ts';
import {
  X,
  User,
  Users,
  Bookmark,
  Compass,
  Film,
  MessageCircle,
  Bell,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  Shield,
  Lock,
  Eye,
  Globe,
  Moon,
  Sun,
  Database,
  Calendar,
  Sparkles,
  Sliders,
  UserX,
  PhoneCall,
  CheckCircle2
} from 'lucide-react';
import { PWAInstallButton } from '../pwa/PWAInstallButton.tsx';

interface MenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MenuDrawer: React.FC<MenuDrawerProps> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    setActiveTab,
    setViewingProfileUsername,
    activeSettingsSection,
    setActiveSettingsSection,
    theme,
    toggleTheme,
    t,
    conversations,
    notifications,
    blockedUserIds,
    setIsAuthModalOpen,
    logoutUserAccount
  } = useApp();

  if (!isOpen) return null;

  const handleNav = (tabId: string, profileUsername?: string) => {
    if (profileUsername) {
      setViewingProfileUsername(profileUsername);
    }
    setActiveTab(tabId);
    onClose();
  };

  const handleOpenSettingsCategory = (sectionId: SettingsSectionId) => {
    setActiveSettingsSection(sectionId);
    setActiveTab('settings');
    onClose();
  };

  const unreadMessagesCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  const settingsMenuItems: Array<{
    id: SettingsSectionId;
    label: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
  }> = [
    {
      id: 'account',
      label: 'Account and Profile',
      subtitle: 'Personal details, handle, bio & verification',
      icon: User
    },
    {
      id: 'privacy',
      label: 'Privacy and Security',
      subtitle: '2FA, account visibility & login protection',
      icon: Lock
    },
    {
      id: 'notifications',
      label: 'Notifications',
      subtitle: 'Push, message, story & activity alerts',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined
    },
    {
      id: 'messages_calls',
      label: 'Messages and Calls',
      subtitle: 'Read receipts, calling permissions & camera/mic',
      icon: PhoneCall,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined
    },
    {
      id: 'audience_story',
      label: 'Audience and Story Privacy',
      subtitle: 'Default story audience, viewers & reply rules',
      icon: Eye
    },
    {
      id: 'saved_items',
      label: 'Saved Items',
      subtitle: 'Bookmarked posts, photos & collections',
      icon: Bookmark
    },
    {
      id: 'language_appearance',
      label: 'Language and Appearance',
      subtitle: 'Dark/Light theme & English, हिंदी, বাংলা',
      icon: Globe
    },
    {
      id: 'accessibility',
      label: 'Accessibility',
      subtitle: 'Text scaling, reduced motion & video playback',
      icon: Sliders
    },
    {
      id: 'data_storage',
      label: 'Data and Storage',
      subtitle: 'Cache management, media quality & PWA app install',
      icon: Database
    },
    {
      id: 'blocked_users',
      label: 'Blocked Users',
      subtitle: 'Manage restricted or blocked accounts',
      icon: UserX,
      badge: blockedUserIds.length > 0 ? blockedUserIds.length : undefined
    },
    {
      id: 'help_support',
      label: 'Help and Support',
      subtitle: 'Support desk, safety center & grievance officer',
      icon: HelpCircle
    },
    {
      id: 'about_yourbby',
      label: 'About YourBby',
      subtitle: 'Platform version, terms, privacy policy & credits',
      icon: Info
    }
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto flex flex-col justify-between shadow-2xl border-r border-slate-200 dark:border-slate-800"
      >
        <div>
          {/* Top Bar: Brand Header & Close */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-950 p-1 flex items-center justify-center overflow-hidden border border-slate-800">
                <img
                  src="/src/assets/images/yourbby_logo_mark_1793866710902.jpg"
                  alt="YourBby"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="font-extrabold text-base bg-gradient-to-r from-rose-500 via-pink-500 to-indigo-500 bg-clip-text text-transparent block leading-none">
                  Menu & Settings
                </span>
                <span className="text-[10px] text-slate-400">YourBby Social Network</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Canonical User Profile Card */}
          <div
            onClick={() => handleNav('profile', currentUser?.username)}
            className="p-3.5 mx-3 my-3 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800/70 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between cursor-pointer hover:border-rose-500/40 transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.displayName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-500/50 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {currentUser?.displayName}
                  </h3>
                  {currentUser?.verified && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  @{currentUser?.username}
                </p>
                <span className="text-[11px] text-rose-500 font-bold block mt-0.5">
                  View canonical profile
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* Quick Platform Shortcuts Grid */}
          <div className="px-3 mb-4">
            <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Shortcuts
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleNav('feed')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{t('home')}</span>
              </button>
              <button
                onClick={() => handleNav('explore')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <Compass className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t('explore')}</span>
              </button>
              <button
                onClick={() => handleNav('reels')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <Film className="w-4 h-4 text-purple-500 shrink-0" />
                <span>{t('reels')}</span>
              </button>
              <button
                onClick={() => handleNav('messages')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>{t('messages')}</span>
                </span>
                {unreadMessagesCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px]">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleNav('communities')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <Users className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t('communities')}</span>
              </button>
              <button
                onClick={() => handleNav('events')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <Calendar className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{t('events')}</span>
              </button>
              <button
                onClick={() => handleNav('creator-dashboard')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <Sparkles className="w-4 h-4 text-pink-500 shrink-0" />
                <span>Creator Hub</span>
              </button>
              <button
                onClick={() => handleNav('admin-dashboard')}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
              >
                <Shield className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Admin Center</span>
              </button>
            </div>
          </div>

          {/* Complete 12 Structured Settings & Preferences Categories */}
          <div className="px-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Settings & Preferences
            </span>
            <div className="space-y-1">
              {settingsMenuItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleOpenSettingsCategory(item.id)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors ${
                      activeSettingsSection === item.id
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{item.label}</p>
                        <p className="text-[10px] text-slate-400 truncate">{item.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.badge !== undefined && (
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Drawer Footer & 13th Action: Log Out */}
        <div className="p-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          <PWAInstallButton variant="prominent" />

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onClose();
                setIsAuthModalOpen(true);
              }}
              className="py-2.5 px-3 rounded-xl bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </button>
            <button
              onClick={async () => {
                onClose();
                await logoutUserAccount();
              }}
              className="py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 dark:text-rose-400 hover:text-white border border-rose-500/20 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span className="font-semibold">YourBby v2.5</span>
            <button
              onClick={toggleTheme}
              className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-[11px] font-semibold"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> Light
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-600" /> Dark
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
