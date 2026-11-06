import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Settings,
  Lock,
  Globe,
  Moon,
  Sun,
  Shield,
  Bell,
  Eye,
  Trash2,
  Check,
  UserCheck,
  Smartphone
} from 'lucide-react';
import type { SupportedLanguage } from '../../types/index.ts';
import { PWAInstallButton } from '../pwa/PWAInstallButton.tsx';

export const SettingsView: React.FC = () => {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    currentUser
  } = useApp();

  const [isPrivateAccount, setIsPrivateAccount] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 my-2">
      <div className="p-6 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-rose-500" />
            Settings & Privacy
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your account security, interface theme, audience privacy and internationalization.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" /> Settings updated successfully!
        </div>
      )}

      {/* Account Info */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-500" />
          Account Profile
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Username</label>
            <input
              type="text"
              value={`@${currentUser?.username}`}
              disabled
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Account Role</label>
            <input
              type="text"
              value={currentUser?.role === 'creator' ? 'Verified Creator' : 'Standard User'}
              disabled
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300"
            />
          </div>
        </div>
      </div>

      {/* Privacy Controls */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-rose-500" />
          Privacy & Visibility
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Private Account</p>
              <p className="text-[11px] text-slate-400">Only approved followers can see your posts and reels.</p>
            </div>
            <button
              onClick={() => setIsPrivateAccount(!isPrivateAccount)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                isPrivateAccount ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  isPrivateAccount ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</p>
              <p className="text-[11px] text-slate-400">Protect account with hardware or authenticator app keys.</p>
            </div>
            <button
              onClick={() => setTwoFactorAuth(!twoFactorAuth)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                twoFactorAuth ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  twoFactorAuth ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Preferences: Theme & Language */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-500" />
          Display & Localization
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Appearance</p>
              <p className="text-[11px] text-slate-400">
                Current mode: {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-2"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span>Toggle Mode</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">Language</p>
              <p className="text-[11px] text-slate-400">Choose interface display language</p>
            </div>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="bn">বাংলা (Bengali)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Device & Native App Installation */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-rose-500" />
          Device & Native App Installation
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Install YourBby on your Android smartphone, tablet, or desktop computer to receive push notifications, full-screen mode, and offline performance.
        </p>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-indigo-500/10 border border-rose-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">YourBby Official App</h4>
            <p className="text-[11px] text-slate-500">Package: social.yourbby.app (Android 14+ / Standalone PWA)</p>
          </div>
          <PWAInstallButton variant="compact" />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition-all"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};
