import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { CameraCaptureModal } from '../camera/CameraCaptureModal.tsx';
import { MediaEditorModal } from '../media/MediaEditorModal.tsx';
import {
  X,
  Image as ImageIcon,
  Camera,
  Sparkles,
  BarChart2,
  Smile,
  Radio,
  Film,
  FileText,
  Music,
  Check,
  Send,
  Loader2,
  Globe,
  Lock,
  Users,
  MapPin,
  Upload,
  Video as VideoIcon,
  Sliders
} from 'lucide-react';

export const CreatePostModal: React.FC = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    createModalInitialTab = 'post',
    currentUser,
    createPost,
    createStory,
    createReel,
    createNote,
    setIsLiveModalOpen,
    language
  } = useApp();

  const [activeTab, setActiveTab] = useState<'post' | 'story' | 'reel' | 'live' | 'note' | 'poll' | 'photo' | 'video'>(
    createModalInitialTab as any
  );

  // Post form state
  const [content, setContent] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [audience, setAudience] = useState<'public' | 'friends' | 'close_friends' | 'only_me'>('public');
  const [locationName, setLocationName] = useState('');
  const [feeling, setFeeling] = useState<{ emoji: string; text: string } | null>(null);

  // Poll state
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

  // Camera & Media Editor modal states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video' | 'both'>('both');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingMediaUrl, setEditingMediaUrl] = useState<string>('');

  // AI Assistant state
  const [aiPromptTopic, setAiPromptTopic] = useState('');
  const [aiTone, setAiTone] = useState<'trendy' | 'thoughtful' | 'witty' | 'professional'>('trendy');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Story state
  const [storyMedia, setStoryMedia] = useState('https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&auto=format&fit=crop&q=80');
  const [storyText, setStoryText] = useState('');
  const [storyGradient, setStoryGradient] = useState('from-purple-600 to-indigo-600');

  // Reel state
  const [reelVideoUrl, setReelVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [reelCaption, setReelCaption] = useState('');
  const [reelAudioTitle, setReelAudioTitle] = useState('Original Audio');

  // Note state
  const [noteText, setNoteText] = useState('');
  const [noteMusic, setNoteMusic] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isCreateModalOpen) return null;

  // Handle local Gallery / File Picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Validate file size (max 25MB)
      if (file.size > 25 * 1024 * 1024) {
        alert('File size exceeds 25MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          if (file.type.startsWith('video/')) {
            setMediaType('video');
            setMediaUrls([result]);
            if (activeTab === 'reel') setReelVideoUrl(result);
          } else {
            setMediaType('image');
            setMediaUrls((prev) => [...prev, result]);
            if (activeTab === 'story') setStoryMedia(result);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle media captured by camera
  const handleCameraCaptured = (url: string, type: 'image' | 'video') => {
    setMediaType(type);
    setMediaUrls([url]);
    if (activeTab === 'reel') {
      setReelVideoUrl(url);
    } else if (activeTab === 'story') {
      setStoryMedia(url);
    }
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && mediaUrls.length === 0 && !showPollBuilder) return;

    let pollData;
    if ((showPollBuilder || activeTab === 'poll') && pollQuestion.trim()) {
      pollData = {
        question: pollQuestion.trim(),
        options: pollOptions.filter(o => o.trim() !== '')
      };
    }

    await createPost({
      content: content.trim(),
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      mediaType,
      audience,
      locationName: locationName.trim() || undefined,
      feeling: feeling || undefined,
      poll: pollData,
    });

    handleClose();
  };

  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createStory({
      mediaUrl: storyMedia,
      mediaType: 'image',
      textOverlay: storyText.trim() || undefined,
      backgroundGradient: storyGradient
    });
    handleClose();
  };

  const handleReelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reelCaption.trim()) return;
    await createReel({
      videoUrl: reelVideoUrl,
      caption: reelCaption.trim(),
      audioTitle: reelAudioTitle.trim() || 'Original Audio',
      audioArtist: currentUser?.displayName || 'Creator'
    });
    handleClose();
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    await createNote(noteText.trim(), noteMusic.trim() || undefined);
    handleClose();
  };

  const handleClose = () => {
    setContent('');
    setMediaUrls([]);
    setShowPollBuilder(false);
    setAiSuggestions([]);
    setShowAiPanel(false);
    setIsCreateModalOpen(false);
  };

  // AI Assistant Call
  const handleGenerateCaptions = async () => {
    if (!aiPromptTopic.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/ai/caption-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiPromptTopic.trim(),
          tone: aiTone,
          language
        }),
      });
      const data = await res.json();
      if (data.success && data.suggestions) {
        setAiSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Top Options Bar (Part 3: 8 Creation destinations) */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'post', label: 'Post', icon: FileText },
                { id: 'story', label: 'Story', icon: ImageIcon },
                { id: 'reel', label: 'Reel', icon: Film },
                { id: 'poll', label: 'Poll', icon: BarChart2 },
                { id: 'live', label: 'Live', icon: Radio },
                { id: 'note', label: 'Note', icon: Music },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      if (tab.id === 'poll') setShowPollBuilder(true);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 shrink-0 ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hidden File Picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Form Content: Post / Poll */}
          {(activeTab === 'post' || activeTab === 'poll') && (
            <form onSubmit={handlePostSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* User Header */}
              <div className="flex items-center gap-3">
                <img
                  src={currentUser?.avatar}
                  alt={currentUser?.displayName}
                  className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200"
                />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {currentUser?.displayName}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <select
                      value={audience}
                      onChange={(e) => setAudience(e.target.value as any)}
                      className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md px-2 py-0.5 border-none focus:outline-none cursor-pointer"
                    >
                      <option value="public">🌐 Public</option>
                      <option value="friends">👥 Friends</option>
                      <option value="close_friends">⭐ Close Friends</option>
                      <option value="only_me">🔒 Only Me</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Text Area */}
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind? Share authentic thoughts, work, or updates..."
                rows={3}
                className="w-full bg-transparent resize-none text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
              />

              {/* Media Previews if attached */}
              {mediaUrls.length > 0 && (
                <div className="relative rounded-2xl overflow-hidden bg-slate-950 max-h-60 border border-slate-200 dark:border-slate-800">
                  {mediaType === 'video' ? (
                    <video src={mediaUrls[0]} controls className="w-full max-h-60 object-contain mx-auto" />
                  ) : (
                    <img src={mediaUrls[0]} alt="Media" className="w-full max-h-60 object-cover mx-auto" />
                  )}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMediaUrl(mediaUrls[0]);
                        setIsEditorOpen(true);
                      }}
                      className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                      title="Open Media Editor"
                    >
                      <Sliders className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaUrls([])}
                      className="p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                      title="Remove Media"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Camera & Gallery Action Strip */}
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    setCameraMode('both');
                    setIsCameraOpen(true);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-rose-500 flex items-center justify-center gap-1.5 transition-all"
                >
                  <Camera className="w-4 h-4 text-rose-500" />
                  <span>Open Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-rose-500 flex items-center justify-center gap-1.5 transition-all"
                >
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                  <span>Select Gallery</span>
                </button>
              </div>

              {/* Gemini AI Assistant */}
              <div className="p-3 rounded-2xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-indigo-500/10 border border-rose-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-rose-500 to-indigo-500 bg-clip-text text-transparent">
                    <Sparkles className="w-4 h-4 text-rose-500" />
                    Gemini AI Caption & Hashtag Assistant
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAiPanel(!showAiPanel)}
                    className="text-xs font-semibold text-rose-500 hover:underline"
                  >
                    {showAiPanel ? 'Hide AI' : 'Use AI'}
                  </button>
                </div>

                {showAiPanel && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-rose-200/40 dark:border-rose-900/40">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={aiPromptTopic}
                        onChange={(e) => setAiPromptTopic(e.target.value)}
                        placeholder="e.g. Sunset in Mumbai or new project update..."
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
                      />
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value as any)}
                        className="px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      >
                        <option value="trendy">Trendy</option>
                        <option value="thoughtful">Thoughtful</option>
                        <option value="witty">Witty</option>
                        <option value="professional">Professional</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleGenerateCaptions}
                        disabled={isAiLoading || !aiPromptTopic.trim()}
                        className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                      >
                        {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Inspire'}
                      </button>
                    </div>

                    {aiSuggestions.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        {aiSuggestions.map((s, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setContent(s.caption + '\n\n' + s.hashtags.map((h: string) => `#${h}`).join(' '));
                              setShowAiPanel(false);
                            }}
                            className="p-2 rounded-xl bg-white dark:bg-slate-900 hover:ring-2 hover:ring-rose-500/50 cursor-pointer text-xs border border-slate-100 dark:border-slate-800"
                          >
                            <span className="font-semibold text-rose-500 mr-2">[{s.vibe}]</span>
                            <span className="text-slate-800 dark:text-slate-200">{s.caption}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Poll Builder Section */}
              {(showPollBuilder || activeTab === 'poll') && (
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1">
                      <BarChart2 className="w-3.5 h-3.5 text-rose-500" />
                      Community Poll
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPollBuilder(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Ask a community question..."
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
                  />
                  {pollOptions.map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const next = [...pollOptions];
                        next[i] = e.target.value;
                        setPollOptions(next);
                      }}
                      placeholder={`Option ${i + 1}`}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
                    />
                  ))}
                  {pollOptions.length < 4 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-xs text-rose-500 font-semibold"
                    >
                      + Add option
                    </button>
                  )}
                </div>
              )}

              {/* Location and Feeling Additions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPollBuilder(true)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center gap-1.5 text-xs font-medium"
                >
                  <BarChart2 className="w-4 h-4 text-indigo-500" />
                  <span>Poll</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFeeling({ emoji: '✨', text: 'feeling blissful' })}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center gap-1.5 text-xs font-medium"
                >
                  <Smile className="w-4 h-4 text-amber-500" />
                  <span>Feeling</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.geolocation?.getCurrentPosition(
                      () => setLocationName('Live Location · Near You'),
                      () => setLocationName('Mumbai, India')
                    );
                  }}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center gap-1.5 text-xs font-medium"
                >
                  <MapPin className="w-4 h-4 text-rose-500" />
                  <span>{locationName || 'Location'}</span>
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!content.trim() && mediaUrls.length === 0 && !pollQuestion.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 disabled:opacity-40 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Share to Feed
              </button>
            </form>
          )}

          {/* Form Content: Story */}
          {activeTab === 'story' && (
            <form onSubmit={handleStorySubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Capture with camera or pick from gallery. Disappears automatically in 24 hours.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCameraMode('photo');
                    setIsCameraOpen(true);
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4 text-rose-500" />
                  <span>Camera Photo</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-4 h-4 text-indigo-500" />
                  <span>Choose Gallery</span>
                </button>
              </div>

              <input
                type="text"
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="Story text overlay..."
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs focus:outline-none"
              />

              {/* Preview */}
              <div className="w-48 h-72 mx-auto rounded-2xl overflow-hidden relative shadow-lg ring-2 ring-rose-500/20">
                <img src={storyMedia} alt="Preview" className="w-full h-full object-cover" />
                {storyText && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center p-4">
                    <p className="text-white font-bold text-sm text-center drop-shadow-md">{storyText}</p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-500/20 transition-all"
              >
                Publish Story
              </button>
            </form>
          )}

          {/* Form Content: Reel */}
          {activeTab === 'reel' && (
            <form onSubmit={handleReelSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Publish full-screen vertical short videos (9:16) with audio soundtrack.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCameraMode('video');
                    setIsCameraOpen(true);
                  }}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Camera className="w-4 h-4 text-rose-500" />
                  <span>Record Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-4 h-4 text-indigo-500" />
                  <span>Select Video</span>
                </button>
              </div>

              <textarea
                value={reelCaption}
                onChange={(e) => setReelCaption(e.target.value)}
                placeholder="Write a caption for your reel with #tags..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs focus:outline-none"
              />

              <input
                type="text"
                value={reelAudioTitle}
                onChange={(e) => setReelAudioTitle(e.target.value)}
                placeholder="Soundtrack Title"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs focus:outline-none"
              />

              <button
                type="submit"
                disabled={!reelCaption.trim()}
                className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-500/20 transition-all"
              >
                Publish Reel
              </button>
            </form>
          )}

          {/* Form Content: Live */}
          {activeTab === 'live' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
                <Radio className="w-8 h-8 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Live Video Broadcast
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Stream live video with your camera to your followers with real-time comments, viewer counts, and floating heart reactions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleClose();
                  setIsLiveModalOpen(true);
                }}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Radio className="w-4 h-4" /> Launch Broadcast
              </button>
            </div>
          )}

          {/* Form Content: Note */}
          {activeTab === 'note' && (
            <form onSubmit={handleNoteSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Share a short personal update (max 60 characters) shown over your avatar.
              </p>

              <input
                type="text"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="What's happening? (e.g. Chai break ☕)"
                maxLength={60}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs focus:outline-none"
              />

              <input
                type="text"
                value={noteMusic}
                onChange={(e) => setNoteMusic(e.target.value)}
                placeholder="Music tag (optional)"
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs focus:outline-none"
              />

              <button
                type="submit"
                disabled={!noteText.trim()}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-md shadow-rose-500/20 transition-all"
              >
                Share Note
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Camera Capture Sub-Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        mode={cameraMode}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCaptured}
      />

      {/* Media Editor Sub-Modal */}
      <MediaEditorModal
        isOpen={isEditorOpen}
        mediaUrl={editingMediaUrl}
        mediaType={mediaType}
        onClose={() => setIsEditorOpen(false)}
        onPublish={({ mediaUrl, caption: cap, locationName: loc, audience: aud }) => {
          if (cap) setContent(cap);
          if (loc) setLocationName(loc);
          if (aud) setAudience(aud);
          setMediaUrls([mediaUrl]);
        }}
      />
    </>
  );
};
