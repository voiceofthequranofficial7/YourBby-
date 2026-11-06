import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { auth, googleProvider } from '../../firebase/config.ts';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  X,
  Check,
  AlertCircle,
  UserPlus
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, allUsers, switchUserAccount, registerUserAccount } = useApp();
  const [mode, setMode] = useState<'login' | 'register' | 'switch'>('switch');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
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
        await registerUserAccount({
          id: user.uid,
          displayName: user.displayName || 'YourBby User',
          username: (user.email?.split('@')[0] || `user_${Date.now()}`).replace(/[^a-zA-Z0-9_]/g, ''),
          avatar: user.photoURL || undefined,
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

  // Registration & Email/Password Auth
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

        let uid = `u_${Date.now()}`;
        if (email.trim() && password.trim()) {
          try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            uid = cred.user.uid;
          } catch (_) {
            // Continue with local/server persistent registration if Firebase email auth is not enabled
          }
        }

        await registerUserAccount({
          id: uid,
          displayName: displayName.trim(),
          username: username.trim().toLowerCase().replace(/^@/, ''),
          bio: bio.trim() || 'YourBby Member 🌐',
        });
        onClose();
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (cred.user) {
          await switchUserAccount(cred.user.uid);
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
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

  const handleSwitchAccount = async (userId: string) => {
    setIsLoading(true);
    try {
      await switchUserAccount(userId);
      onClose();
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to switch account');
    } finally {
      setIsLoading(false);
    }
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
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">YourBby Accounts</h3>
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
            type="button"
            onClick={() => { setMode('switch'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === 'switch' ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-xs' : 'text-slate-500'
            }`}
          >
            Accounts ({allUsers.length})
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === 'register' ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-xs' : 'text-slate-500'
            }`}
          >
            New Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setErrorMessage(null); }}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              mode === 'login' ? 'bg-white dark:bg-slate-900 text-rose-500 shadow-xs' : 'text-slate-500'
            }`}
          >
            Firebase Login
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab: Login / Register */}
        {(mode === 'login' || mode === 'register') && (
          <div className="space-y-3">
            <button
              type="button"
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
              <span className="text-[10px] font-bold text-slate-400 uppercase">Or Account Details</span>
              <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Mohammad Siraj"
                      required
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Unique Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. mohammadsiraj"
                      required
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Bio (Optional)</label>
                    <input
                      type="text"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell people about yourself..."
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Email Address {mode === 'register' ? '(Optional for local session)' : ''}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required={mode === 'login'}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Password {mode === 'register' ? '(Optional for local session)' : ''}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required={mode === 'login'}
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
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
                {isLoading ? 'Processing...' : mode === 'register' ? 'Create Real Account' : 'Log In'}
              </button>
            </form>
          </div>
        )}

        {/* Tab: Switch Between Real Registered Accounts */}
        {mode === 'switch' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Switch between registered accounts to test real two-way messaging, read receipts, and WebRTC calls:
            </p>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {allUsers.map(user => {
                const isActive = currentUser?.id === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSwitchAccount(user.id)}
                    className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all ${
                      isActive
                        ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {user.displayName}
                          {user.badge && (
                            <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500">
                              {user.badge}
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          @{user.username} {user.bio ? `· ${user.bio}` : ''}
                        </p>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setMode('register')}
              className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-rose-500 hover:bg-rose-500/5 flex items-center justify-center gap-1.5 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Another User Account</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
