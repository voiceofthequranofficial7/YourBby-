import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { compressImageDataUrl, uploadCoverPhotoFile } from '../../firebase/config.ts';
import {
  User,
  Camera,
  CheckCircle2,
  X,
  Save,
  Globe,
  MapPin,
  Lock,
  Eye,
  AlertCircle,
  Loader2,
  Sparkles,
  Upload
} from 'lucide-react';
import { CameraCaptureModal } from '../camera/CameraCaptureModal.tsx';

interface OwnerProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'setup' | 'edit';
}

export const OwnerProfileSetupModal: React.FC<OwnerProfileSetupModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'setup'
}) => {
  const { currentUser, updateCurrentUserProfile } = useApp();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || 'Mohammad Siraj');
  const [username, setUsername] = useState(currentUser?.username || 'mohammadsiraj');
  const [bio, setBio] = useState(currentUser?.bio || 'Founder & Creator of YourBby 🌐 YOUR WORLD. YOUR PEOPLE.');
  const [location, setLocation] = useState(currentUser?.location || 'India');
  const [website, setWebsite] = useState(currentUser?.website || 'https://yourbby.social/@mohammadsiraj');
  const [privacy, setPrivacy] = useState<'public' | 'followers_only' | 'private'>(currentUser?.privacy || 'public');

  const [avatarPreview, setAvatarPreview] = useState<string>(
    currentUser?.avatar ||
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%230f172a"/><circle cx="100" cy="100" r="76" fill="%231e293b" stroke="%23f43f5e" stroke-width="4"/><text x="100" y="118" font-family="system-ui,sans-serif" font-size="64" font-weight="bold" fill="%23ffffff" text-anchor="middle">MS</text></svg>'
  );
  const [coverPreview, setCoverPreview] = useState<string>(
    (currentUser?.coverPhotoURL !== undefined ? currentUser.coverPhotoURL : currentUser?.coverPhoto) || ''
  );

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ available: boolean; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleUsernameBlur = async () => {
    const clean = username.trim().toLowerCase().replace(/^@/, '');
    if (!clean || clean === currentUser?.username.toLowerCase()) {
      setUsernameStatus(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(clean)}`);
      const data = await res.json();
      setUsernameStatus({
        available: data.available,
        message: data.message || (data.available ? 'Username is available' : 'Username is taken')
      });
    } catch {
      setUsernameStatus(null);
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageDataUrl(file, 320, 320, 110000);
      if (compressed) setAvatarPreview(compressed);
    } catch (_) {}
  };

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !currentUser) return;
    setErrorMessage(null);
    setIsSaving(true);
    try {
      const downloadUrl = await uploadCoverPhotoFile(file, currentUser.id, file.name);
      setCoverPreview(downloadUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to upload cover photo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCameraCapture = (mediaUrl: string) => {
    setAvatarPreview(mediaUrl);
    setIsCameraOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!cleanUsername || !displayName.trim()) {
      setErrorMessage('Display Name and Username are required.');
      return;
    }

    if (usernameStatus && !usernameStatus.available) {
      setErrorMessage('Please choose an available username.');
      return;
    }

    setIsSaving(true);
    try {
      await updateCurrentUserProfile({
        displayName: displayName.trim(),
        username: cleanUsername,
        bio: bio.trim(),
        location: location.trim(),
        website: website.trim(),
        privacy,
        avatar: avatarPreview,
        coverPhotoURL: coverPreview,
        coverPhoto: coverPreview
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 my-8">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 p-[1.5px] shadow-sm">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-rose-400" />
                </div>
              </div>
              <div>
                <h2 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  {initialMode === 'setup' ? 'Owner Profile Setup' : 'Edit Profile Details'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {initialMode === 'setup'
                    ? 'Welcome Mohammad Siraj! Configure your official creator profile.'
                    : 'Changes persist directly to database and your public card.'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto no-scrollbar">
            {errorMessage && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Cover & Avatar Upload Area */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Profile Visual Identity
              </label>

              {/* Cover Photo Box */}
              <div className="relative h-32 sm:h-40 rounded-2xl overflow-hidden bg-gradient-to-r from-slate-950 via-indigo-950 to-rose-950 border border-slate-200 dark:border-slate-800 group">
                {coverPreview && (
                  <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="absolute top-2.5 right-2.5 z-20 px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-950 text-white text-xs font-bold backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-md"
                >
                  <Upload className="w-3.5 h-3.5 text-rose-400" />
                  <span>Change Cover</span>
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFile}
                  className="hidden"
                />
              </div>

              {/* Avatar Box overlapping cover */}
              <div className="flex items-end gap-4 -mt-10 sm:-mt-12 ml-4 relative z-10">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden ring-4 ring-white dark:ring-slate-900 bg-slate-900 shadow-xl shrink-0">
                  <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                </div>

                <div className="flex flex-wrap items-center gap-2 pb-1">
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-rose-500" />
                    <span>Upload Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take Selfie</span>
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFile}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Display Name & Username */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Mohammad Siraj"
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Unique Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameStatus(null);
                    }}
                    onBlur={handleUsernameBlur}
                    placeholder="mohammadsiraj"
                    className="w-full pl-8 pr-8 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                    required
                  />
                  {isCheckingUsername && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />
                  )}
                  {usernameStatus && (
                    <span
                      className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                        usernameStatus.available ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {usernameStatus.available ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </span>
                  )}
                </div>
                {usernameStatus && (
                  <p
                    className={`text-[10px] mt-1 font-semibold ${
                      usernameStatus.available ? 'text-emerald-500' : 'text-rose-500'
                    }`}
                  >
                    {usernameStatus.message}
                  </p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Bio & Creator Vision
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Describe your background, passions, and community vision..."
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
              />
            </div>

            {/* Location & Website */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. India"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Website / Portfolio
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://yourbby.social/@mohammadsiraj"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                </div>
              </div>
            </div>

            {/* Privacy Controls */}
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Profile Visibility & Privacy
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'public', label: 'Public', desc: 'Visible to everyone' },
                  { id: 'followers_only', label: 'Followers', desc: 'Approved connections' },
                  { id: 'private', label: 'Private', desc: 'Only you' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPrivacy(item.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      privacy === item.id
                        ? 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <p className="text-xs font-bold">{item.label}</p>
                    <p className="text-[10px] opacity-75 mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-500/20 disabled:opacity-50 transition-all"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Owner Profile</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Direct Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        mode="photo"
      />
    </>
  );
};
