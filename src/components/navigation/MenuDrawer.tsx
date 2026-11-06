import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  X,
  User,
  Users,
  Bookmark,
  Clock,
  Compass,
  Film,
  MessageCircle,
  Bell,
  Settings,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  ChevronDown,
  Shield,
  Lock,
  Eye,
  Camera,
  Mic,
  MapPin,
  Globe,
  Moon,
  Sun,
  Database,
  FileText,
  AlertCircle,
  Calendar,
  Sparkles
} from 'lucide-react';
import type { SupportedLanguage } from '../../types/index.ts';
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
    theme,
    toggleTheme,
    language,
    setLanguage,
    t,
    conversations,
    notifications,
    setIsAuthModalOpen
  } = useApp();

  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [permissionCheckMessage, setPermissionCheckMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleSection = (id: string) => {
    setExpandedSection(prev => (prev === id ? null : id));
  };

  const handleNav = (tabId: string, profileUsername?: string) => {
    if (profileUsername) {
      setViewingProfileUsername(profileUsername);
    }
    setActiveTab(tabId);
    onClose();
  };

  const checkMediaPermission = async (type: 'camera' | 'mic' | 'location') => {
    try {
      if (type === 'camera') {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(t => t.stop());
        setPermissionCheckMessage('Camera permission is GRANTED and working.');
      } else if (type === 'mic') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(t => t.stop());
        setPermissionCheckMessage('Microphone permission is GRANTED and working.');
      } else if (type === 'location') {
        navigator.geolocation.getCurrentPosition(
          () => setPermissionCheckMessage('Location permission is GRANTED and working.'),
          () => setPermissionCheckMessage('Location permission is DENIED or unavailable.')
        );
      }
    } catch (err: any) {
      setPermissionCheckMessage(`${type.toUpperCase()} permission denied or blocked.`);
    }
    setTimeout(() => setPermissionCheckMessage(null), 4000);
  };

  const unreadMessagesCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const unreadNotifsCount = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex animate-in fade-in duration-200">
      <div className="w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto flex flex-col justify-between shadow-2xl border-r border-slate-200 dark:border-slate-800">
        <div>
          {/* Top Bar: Title & Close */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-slate-950 p-1 flex items-center justify-center overflow-hidden border border-slate-800">
                <img
                  src="/src/assets/images/yourbby_logo_mark_1793866710902.jpg"
                  alt="YourBby"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-extrabold text-base bg-gradient-to-r from-rose-500 to-indigo-500 bg-clip-text text-transparent">
                YourBby Menu
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div
            onClick={() => handleNav('profile', currentUser?.username)}
            className="p-4 mx-3 my-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.displayName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-500/40 shrink-0"
              />
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {currentUser?.displayName}
                </h3>
                <p className="text-xs text-slate-400 truncate">@{currentUser?.username}</p>
                <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">
                  See your profile
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </div>

          {/* Primary Navigation Items */}
          <div className="px-3 space-y-1">
            <button
              onClick={() => handleNav('feed')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>{t('home')}</span>
            </button>

            <button
              onClick={() => handleNav('reels')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Film className="w-4 h-4 text-purple-500" />
              <span>{t('reels')}</span>
            </button>

            <button
              onClick={() => handleNav('messages')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-indigo-500" />
                <span>{t('messages')}</span>
              </div>
              {unreadMessagesCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                  {unreadMessagesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => handleNav('explore')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Compass className="w-4 h-4 text-emerald-500" />
              <span>{t('explore')}</span>
            </button>

            <button
              onClick={() => handleNav('communities')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Users className="w-4 h-4 text-amber-500" />
              <span>{t('communities')}</span>
            </button>

            <button
              onClick={() => handleNav('events')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Calendar className="w-4 h-4 text-rose-500" />
              <span>{t('events')}</span>
            </button>

            <button
              onClick={() => handleNav('saved')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Bookmark className="w-4 h-4 text-indigo-400" />
              <span>{t('saved')}</span>
            </button>

            <button
              onClick={() => handleNav('creator-dashboard')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span>{t('creatorStudio')}</span>
            </button>

            <button
              onClick={() => handleNav('admin-dashboard')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
            >
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>{t('adminCenter')}</span>
            </button>
          </div>

          {/* Expandable Settings & Privacy Hierarchy */}
          <div className="px-3 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              onClick={() => toggleSection('settings')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-slate-500" />
                <span>Settings & Privacy</span>
              </div>
              {expandedSection === 'settings' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {expandedSection === 'settings' && (
              <div className="pl-4 pr-1 py-2 space-y-2 text-xs border-l-2 border-rose-500/30 ml-3">
                <button
                  onClick={() => handleNav('settings')}
                  className="w-full text-left py-1 text-slate-600 dark:text-slate-300 hover:text-rose-500"
                >
                  Account Center & Profile
                </button>
                <button
                  onClick={() => handleNav('settings')}
                  className="w-full text-left py-1 text-slate-600 dark:text-slate-300 hover:text-rose-500"
                >
                  Privacy & Audience Rules
                </button>
                <button
                  onClick={() => handleNav('settings')}
                  className="w-full text-left py-1 text-slate-600 dark:text-slate-300 hover:text-rose-500"
                >
                  Two-Factor Authentication & Security
                </button>

                {/* Permissions Status Check */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Device Permissions</span>
                  <div className="flex gap-2 mt-1">
                    <button
                      onClick={() => checkMediaPermission('camera')}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3" /> Camera
                    </button>
                    <button
                      onClick={() => checkMediaPermission('mic')}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold flex items-center gap-1"
                    >
                      <Mic className="w-3 h-3" /> Mic
                    </button>
                    <button
                      onClick={() => checkMediaPermission('location')}
                      className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" /> GPS
                    </button>
                  </div>
                  {permissionCheckMessage && (
                    <p className="text-[10px] text-emerald-500 font-semibold mt-1.5">{permissionCheckMessage}</p>
                  )}
                </div>
              </div>
            )}

            {/* Help & Support */}
            <button
              onClick={() => toggleSection('help')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-slate-500" />
                <span>Help & Support</span>
              </div>
              {expandedSection === 'help' ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {expandedSection === 'help' && (
              <div className="pl-4 pr-1 py-2 space-y-1.5 text-xs border-l-2 border-indigo-500/30 ml-3 text-slate-600 dark:text-slate-300">
                <p>Support Email: support@yourbby.social</p>
                <p>Grievance Officer: Kolkata & Mumbai, India</p>
                <p>Digital Personal Data Protection (DPDP) compliant</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Drawer Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <PWAInstallButton variant="prominent" />

          <button
            onClick={() => {
              onClose();
              setIsAuthModalOpen(true);
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Switch Account / Sign In</span>
          </button>

          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>YourBby v2.4 (Android Ready)</span>
            <div className="flex items-center gap-2">
              <button onClick={toggleTheme} className="p-1 text-slate-400 hover:text-slate-600">
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">YOUR WORLD. YOUR PEOPLE.</p>
        </div>
      </div>
    </div>
  );
};
