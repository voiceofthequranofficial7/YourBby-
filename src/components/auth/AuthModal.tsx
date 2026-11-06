import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { auth, googleProvider, db } from '../../firebase/config.ts';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Sparkles,
  Check,
  AlertCircle,
  Users,
  LogIn,
  UserPlus
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateCurrentUserProfile } = useApp();
  const [mode, setMode] = useState<'login' | 'register' | 'switch'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  // Firebase Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user) {
        // Initialize or update user profile with neutral initials or Google photo
        await updateCurrentUserProfile({
          displayName: user.displayName || 'YourBby User',
          username: user.email?.split('@')[0] || `user_${Date.now()}`,
          avatar: user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.displayName || 'YB')}`,
        });
        onClose();
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setErrorMessage(err.message || 'Google Sign-In failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Email/Password
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (mode === 'register') {
        if (!termsAccepted) {
          setErrorMessage('Please accept the Terms of Service to register.');
          setIsLoading(false);
          return;
        }
        if (!username.trim() || !displayName.trim()) {
          setErrorMessage('Please provide a display name and unique username.');
          setIsLoading(false);
          return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateCurrentUserProfile({
          displayName: displayName.trim(),
          username: username.trim().toLowerCase(),
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName.trim())}`,
        });
        onClose();
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (cred.user) {
          await updateCurrentUserProfile({
            displayName: cred.user.displayName || 'YourBby User',
            username: cred.user.email?.split('@')[0] || `user_${Date.now()}`,
          });
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      // Helpful friendly message
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setErrorMessage('Invalid email or password.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('This email address is already registered.');
      } else {
        setErrorMessage(err.message || 'Authentication failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Instant Test Account Switcher for Real Two-Way QA Testing
  const handleSwitchToDemoUser = async (userKey: 'rohan' | 'priya' | 'aarav') => {
    const profiles = {
      rohan: {
        id: 'u_rohan',
        username: 'rohanroy',
        displayName: 'Rohan Roy',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        bio: 'Visual storyteller & digital creator 📸 Exploring Kolkata & Mumbai',
        location: 'Mumbai, India',
      },
      priya: {
        id: 'u_priya',
        username: 'priyasen',
        displayName: 'Priya Sen',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
        bio: 'Fashion designer & contemporary art lover ✨ Victoria Memorial sunsets',
        location: 'Kolkata, India',
      },
      aarav: {
        id: 'u_aarav',
        username: 'aaravsharma',
        displayName: 'Aarav Sharma',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
        bio: 'Product builder & photographer. Building next-gen software 🚀',
        location: 'Bengaluru, India',
      }
    };

    await updateCurrentUserProfile(profiles[userKey]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 select-none">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-950 p-1 flex items-center justify-center overflow-hidden border border-slate-800">
              <img
                src="/src/assets/images/yourbby_logo_mark_1793866710902.jpg"
                alt="YourBby"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">YourBby Account</h3>
              <p className="text-[10px] text-slate-400">YOUR WORLD. YOUR PEOPLE.</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold">
          <button
            onClick={() => { setMode('login'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === 'login' ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-xs' : 'text-slate-500'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => { setMode('register'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === 'register' ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-xs' : 'text-slate-500'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => { setMode('switch'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === 'switch' ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-xs' : 'text-slate-500'
            }`}
          >
            Switch User
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1 & 2: Login / Register with Firebase */}
        {(mode === 'login' || mode === 'register') && (
          <div className="space-y-3">
            {/* Google Sign-in */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 my-2">
              <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
              <span className="text-[10px] font-bold text-slate-400 uppercase">Or with Email</span>
              <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Maya Roy"
                      required
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Unique Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. mayaroy"
                      required
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs focus:outline-none"
                />
              </div>

              {mode === 'register' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="accent-rose-500"
                  />
                  <label htmlFor="terms" className="text-[11px] text-slate-500">
                    I accept YourBby Terms of Service & Privacy Policy
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20"
              >
                {isLoading ? 'Processing...' : mode === 'register' ? 'Create Account' : 'Log In'}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Switch Test Account (Essential for testing two-way messaging & QA) */}
        {mode === 'switch' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Switch immediately to test real two-way messaging, friend requests, and permission rules between independent accounts:
            </p>

            <button
              onClick={() => handleSwitchToDemoUser('rohan')}
              className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                currentUser?.username === 'rohanroy'
                  ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Rohan"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Rohan Roy (User A)</h4>
                  <p className="text-[11px] text-slate-400">@rohanroy · Visual Creator</p>
                </div>
              </div>
              {currentUser?.username === 'rohanroy' && <Check className="w-4 h-4 text-rose-500" />}
            </button>

            <button
              onClick={() => handleSwitchToDemoUser('priya')}
              className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                currentUser?.username === 'priyasen'
                  ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                  alt="Priya"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Priya Sen (User B)</h4>
                  <p className="text-[11px] text-slate-400">@priyasen · Fashion Designer</p>
                </div>
              </div>
              {currentUser?.username === 'priyasen' && <Check className="w-4 h-4 text-rose-500" />}
            </button>

            <button
              onClick={() => handleSwitchToDemoUser('aarav')}
              className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                currentUser?.username === 'aaravsharma'
                  ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Aarav"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">Aarav Sharma (User C)</h4>
                  <p className="text-[11px] text-slate-400">@aaravsharma · Tech Founder</p>
                </div>
              </div>
              {currentUser?.username === 'aaravsharma' && <Check className="w-4 h-4 text-rose-500" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
