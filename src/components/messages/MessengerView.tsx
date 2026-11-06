import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Phone,
  Video,
  Info,
  Paperclip,
  Mic,
  Send,
  Image as ImageIcon,
  Smile,
  Check,
  CheckCheck,
  Play,
  Pause,
  Square,
  Trash2,
  Pin,
  VolumeX,
  Volume2,
  Archive,
  MoreVertical,
  Reply,
  Edit3,
  FileText,
  Download,
  Camera,
  X,
  Plus,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellOff,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  UserPlus,
  Sparkles,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { uploadMediaToFirebaseStorage } from '../../firebase/config.ts';
import { apiFetch } from '../../firebase/staticApiFallback.ts';
import { CameraCaptureModal } from '../camera/CameraCaptureModal.tsx';
import type { Conversation, Message, User } from '../../types/index.ts';

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '🙏', '🔥', '👍'];
const COMPOSER_EMOJIS = [
  '😀', '😂', '🥹', '😍', '🤩', '😘', '😎', '🥳',
  '🙌', '👏', '🔥', '✨', '❤️', '💯', '🙏', '👍',
  '🎉', '🎶', '🌟', '💬', '📸', '🚀', '🌈', '☕'
];

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Document';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(sec?: number): string {
  if (!sec || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function formatLastSeen(iso?: string): string {
  if (!iso) return 'Offline';
  const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diffSec < 60) return 'Last seen just now';
  if (diffSec < 3600) return `Last seen ${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `Last seen ${Math.floor(diffSec / 3600)}h ago`;
  return `Last seen ${new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
}

// Custom Voice Message Audio Player with Waveform & Speed Toggle
const VoiceMessagePlayer: React.FC<{
  audioUrl: string;
  durationSeconds?: number;
  waveform?: number[];
  isMe: boolean;
}> = ({ audioUrl, durationSeconds = 5, waveform, isMe }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(durationSeconds || 5);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);

  const bars = useMemo(() => {
    if (waveform && waveform.length >= 16) return waveform.slice(0, 28);
    return [28, 45, 72, 38, 60, 88, 52, 34, 76, 92, 48, 64, 80, 42, 55, 90, 62, 38, 70, 50, 82, 44, 60, 35];
  }, [waveform]);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };
    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, [audioUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.playbackRate = playbackRate;
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = clickX * totalDuration;
    setCurrentTime(audio.currentTime);
  };

  const cycleSpeed = () => {
    const next: 1 | 1.5 | 2 = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  const progressRatio = totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;

  return (
    <div className="flex items-center gap-3 min-w-[230px] sm:min-w-[270px] py-1">
      <button
        type="button"
        onClick={togglePlay}
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition shadow-sm ${
          isMe
            ? 'bg-white text-rose-600 hover:bg-white/90'
            : 'bg-rose-500 text-white hover:bg-rose-600'
        }`}
        title={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col gap-1.5">
        <div
          onClick={handleSeek}
          className="flex items-center gap-[3px] h-7 cursor-pointer select-none"
          title="Click to seek"
        >
          {bars.map((heightPct, idx) => {
            const barRatio = idx / bars.length;
            const isPlayed = barRatio <= progressRatio;
            return (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isMe
                    ? isPlayed
                      ? 'bg-white'
                      : 'bg-white/35'
                    : isPlayed
                    ? 'bg-rose-500'
                    : 'bg-slate-300 dark:bg-slate-600'
                }`}
                style={{ height: `${Math.max(18, Math.min(100, heightPct))}%` }}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] font-semibold">
          <span className={isMe ? 'text-white/85' : 'text-slate-500 dark:text-slate-400'}>
            {formatDuration(isPlaying || currentTime > 0 ? currentTime : totalDuration)}
          </span>
          <button
            type="button"
            onClick={cycleSpeed}
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
              isMe
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};

export const MessengerView: React.FC = () => {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    activeConversationMessages,
    sendMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    setTypingStatus,
    togglePinConversation,
    toggleMuteConversation,
    toggleArchiveConversation,
    deleteConversation,
    startChatWithUser,
    currentUser,
    allUsers,
    registerUserAccount,
    switchUserAccount,
    startCall,
    callHistory,
    setViewingProfileUsername,
    setActiveTab
  } = useApp();

  // Sidebar states
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'unread' | 'pinned' | 'archived' | 'calls'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [convMenuOpenId, setConvMenuOpenId] = useState<string | null>(null);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountUsername, setNewAccountUsername] = useState('');
  const [newAccountBio, setNewAccountBio] = useState('');
  const [isCreatingSecondUser, setIsCreatingSecondUser] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // Conversation header & search states
  const [inChatSearchOpen, setInChatSearchOpen] = useState(false);
  const [inChatSearchQuery, setInChatSearchQuery] = useState('');
  const [showConvInfoDrawer, setShowConvInfoDrawer] = useState(false);
  const [visibleMessageCount, setVisibleMessageCount] = useState(25);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return localStorage.getItem('yourbby_msg_notifications') !== 'false';
  });

  // Composer states
  const [msgText, setMsgText] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReactionMsgId, setActiveReactionMsgId] = useState<string | null>(null);

  // Media & File Upload states
  const [pendingFiles, setPendingFiles] = useState<
    { file?: File; dataUrl: string; type: 'image' | 'video' | 'file'; name: string; size: number }[]
  >([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [failedPayload, setFailedPayload] = useState<{
    convId: string;
    text: string;
    files: typeof pendingFiles;
    voiceData?: { url: string; blob?: Blob | null; mimeType?: string; duration: number; waveform: number[] };
  } | null>(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const uploadAbortControllerRef = useRef<AbortController | null>(null);

  // Full-screen Media Lightbox state
  const [lightboxMedia, setLightboxMedia] = useState<{
    urls: string[];
    index: number;
    type: 'image' | 'video';
  } | null>(null);

  // Voice Recording states (Start, Pause, Resume, Cancel, Preview before sending)
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'preview'>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [liveWaveform, setLiveWaveform] = useState<number[]>([25, 40, 30, 55, 45, 60, 35, 50, 70, 45, 30, 50]);
  const [recordedVoiceUrl, setRecordedVoiceUrl] = useState<string | null>(null);
  const [recordedVoiceBlob, setRecordedVoiceBlob] = useState<Blob | null>(null);
  const [recordedVoiceMime, setRecordedVoiceMime] = useState<string>('audio/webm');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserIntervalRef = useRef<number | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversationMessages.length, activeConversation?.id]);

  // Reset pagination count when switching conversations
  useEffect(() => {
    setVisibleMessageCount(25);
    setReplyingTo(null);
    setEditingMessage(null);
    setInChatSearchOpen(false);
    setInChatSearchQuery('');
    setAttachmentError(null);
    setVoiceError(null);
  }, [activeConversation?.id]);

  // Clean up voice recorder on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (analyserIntervalRef.current) clearInterval(analyserIntervalRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
          mediaRecorderRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const getOtherParticipant = (conv: Conversation): User => {
    if (!currentUser) return conv.participants[0];
    return conv.participants.find(p => p.id !== currentUser.id) || conv.participants[0];
  };

  // Toggle browser notifications
  const handleToggleBrowserNotifications = async () => {
    if (!notificationsEnabled) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
        }
      }
      localStorage.setItem('yourbby_msg_notifications', 'true');
      setNotificationsEnabled(true);
    } else {
      localStorage.setItem('yourbby_msg_notifications', 'false');
      setNotificationsEnabled(false);
    }
  };

  // Handle typing indicator signaling
  const handleInputChange = (val: string) => {
    setMsgText(val);
    if (!activeConversation) return;

    setTypingStatus(activeConversation.id, val.trim().length > 0);
    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(() => {
      if (activeConversation) {
        setTypingStatus(activeConversation.id, false);
      }
    }, 2500);
  };

  // Validate file type and size before adding to pendingFiles
  const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024; // 15 MB max per file
  const ALLOWED_DOC_EXTENSIONS = [
    '.pdf', '.doc', '.docx', '.txt', '.rtf', '.csv', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.json', '.md'
  ];
  const BLOCKED_EXTENSIONS = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.apk', '.scr', '.com', '.vbs'];

  const validateFile = (file: File, category: 'media' | 'document'): string | null => {
    if (!file || file.size <= 0) {
      return `"${file?.name || 'File'}" is empty (0 bytes) and cannot be attached.`;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return `"${file.name}" (${formatFileSize(file.size)}) exceeds the 15 MB attachment limit.`;
    }
    const lowerName = file.name.toLowerCase();
    if (BLOCKED_EXTENSIONS.some(ext => lowerName.endsWith(ext))) {
      return `"${file.name}" is a restricted executable file type and cannot be shared.`;
    }
    if (category === 'media') {
      const isImgOrVid =
        file.type.startsWith('image/') ||
        file.type.startsWith('video/') ||
        /\.(jpg|jpeg|png|gif|webp|heic|mp4|webm|mov|m4v)$/i.test(lowerName);
      if (!isImgOrVid) {
        return `"${file.name}" is not a supported photo or video format.`;
      }
    } else {
      const hasValidExt = ALLOWED_DOC_EXTENSIONS.some(ext => lowerName.endsWith(ext));
      const isSafeMime =
        file.type.startsWith('application/pdf') ||
        file.type.includes('word') ||
        file.type.includes('officedocument') ||
        file.type.includes('spreadsheet') ||
        file.type.includes('presentation') ||
        file.type.startsWith('text/') ||
        file.type.includes('zip') ||
        file.type.includes('json') ||
        file.type.startsWith('image/') ||
        file.type.startsWith('video/');
      if (!hasValidExt && !isSafeMime) {
        return `"${file.name}" is not a supported document format. Supported: PDF, DOC, DOCX, TXT, CSV, XLS, XLSX, PPT, PPTX, ZIP.`;
      }
    }
    return null;
  };

  // Multi-photo / video picker
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setAttachmentError(null);
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      files.forEach(file => {
        const validationErr = validateFile(file, 'media');
        if (validationErr) {
          setAttachmentError(validationErr);
          return;
        }
        const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(file.name);
        const isImage = file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(file.name);
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setPendingFiles(prev => [
              ...prev,
              {
                file,
                dataUrl: reader.result as string,
                type: isVideo ? 'video' : isImage ? 'image' : 'file',
                name: file.name,
                size: file.size
              }
            ]);
          }
        };
        reader.onerror = () => {
          setAttachmentError(`Could not read "${file.name}". Please try selecting the file again.`);
        };
        reader.readAsDataURL(file);
      });
    } catch (err: any) {
      console.error('Media selection error:', err);
      setAttachmentError(err?.message || 'Failed to attach media file.');
    } finally {
      e.target.value = '';
    }
  };

  // Document / general file picker (Paperclip button)
  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setAttachmentError(null);
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      files.forEach(file => {
        const validationErr = validateFile(file, 'document');
        if (validationErr) {
          setAttachmentError(validationErr);
          return;
        }
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            setPendingFiles(prev => [
              ...prev,
              {
                file,
                dataUrl: reader.result as string,
                type: isImage ? 'image' : isVideo ? 'video' : 'file',
                name: file.name,
                size: file.size
              }
            ]);
          }
        };
        reader.onerror = () => {
          setAttachmentError(`Failed to read document "${file.name}".`);
        };
        reader.readAsDataURL(file);
      });
    } catch (err: any) {
      console.error('Document selection error:', err);
      setAttachmentError(err?.message || 'Could not attach document.');
    } finally {
      e.target.value = '';
    }
  };

  // Camera capture callback
  const handleCameraCaptured = (dataUrl: string, type: 'image' | 'video') => {
    setAttachmentError(null);
    setPendingFiles(prev => [
      ...prev,
      {
        dataUrl,
        type,
        name: `camera_${Date.now()}.${type === 'video' ? 'webm' : 'jpg'}`,
        size: Math.round(dataUrl.length * 0.75)
      }
    ]);
    setIsCameraModalOpen(false);
  };

  // -------------------------------------------------------------
  // Voice Recording: Negotiate MIME Type, Start, Pause, Resume, Cancel, Preview & Send
  // -------------------------------------------------------------
  const getSupportedAudioMimeType = (): string => {
    if (typeof MediaRecorder === 'undefined') return '';
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/aac',
      'audio/wav'
    ];
    for (const mime of candidates) {
      try {
        if (MediaRecorder.isTypeSupported(mime)) {
          return mime;
        }
      } catch (_) {}
    }
    return '';
  };

  const startVoiceRecording = async () => {
    setVoiceError(null);

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setVoiceError('Microphone recording requires a secure HTTPS connection.');
      return;
    }

    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      setVoiceError('Microphone recording is not supported in this browser or WebView.');
      return;
    }

    if (typeof MediaRecorder === 'undefined') {
      setVoiceError('Audio recording (MediaRecorder API) is not available on this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const audioTracks = stream.getAudioTracks();
      if (!audioTracks || audioTracks.length === 0 || audioTracks[0].readyState === 'ended') {
        stream.getTracks().forEach(t => t.stop());
        setVoiceError('No active microphone audio track was found.');
        return;
      }

      const negotiatedMime = getSupportedAudioMimeType();
      const recorder = negotiatedMime
        ? new MediaRecorder(stream, { mimeType: negotiatedMime })
        : new MediaRecorder(stream);

      const effectiveMime = recorder.mimeType || negotiatedMime || 'audio/webm';
      setRecordedVoiceMime(effectiveMime);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      // Detect permission revocation or microphone hardware disconnect mid-recording
      audioTracks[0].onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          cancelVoiceRecording();
          setVoiceError('Microphone access was interrupted or revoked during recording.');
        }
      };

      // Set up Web Audio Analyser for real live waveform bars
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        analyserIntervalRef.current = window.setInterval(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            analyser.getByteFrequencyData(dataArray);
            const sampled = Array.from(dataArray.slice(0, 20)).map(v =>
              Math.max(18, Math.min(98, Math.round((v / 255) * 100)))
            );
            setLiveWaveform(sampled);
          }
        }, 120);
      } catch (_) {}

      recorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (ev: any) => {
        console.warn('MediaRecorder audio notice:', ev?.error?.message || 'recording error');
        cancelVoiceRecording();
        setVoiceError('Audio recording encountered an error. Please try again.');
      };

      recorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        if (analyserIntervalRef.current) clearInterval(analyserIntervalRef.current);
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }

        if (audioChunksRef.current.length === 0) {
          setVoiceError('No audio data was captured from the microphone.');
          setRecordingState('idle');
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: effectiveMime });
        if (audioBlob.size === 0) {
          setVoiceError('Recorded audio clip was empty.');
          setRecordingState('idle');
          return;
        }
        setRecordedVoiceBlob(audioBlob);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setRecordedVoiceUrl(reader.result);
            setRecordingState('preview');
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start(200);
      setRecordingSeconds(0);
      setRecordingState('recording');

      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      const errName = err?.name || '';
      const errMsg = String(err?.message || '');
      console.warn('Microphone access status:', errName || errMsg || 'unavailable');
      if (
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError' ||
        errMsg.toLowerCase().includes('permission')
      ) {
        setVoiceError(
          'Microphone permission was denied. In Android Chrome, tap the lock/tune icon in the address bar → Permissions → allow Microphone.'
        );
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setVoiceError('No microphone hardware was detected on this device.');
      } else {
        setVoiceError(`Could not access microphone: ${errMsg || errName || 'Unknown error'}`);
      }
    }
  };

  const pauseVoiceRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === 'recording') {
      try {
        rec.pause();
        setRecordingState('paused');
        if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      } catch (e: any) {
        console.warn('Pause voice recording notice:', e?.message || e);
      }
    }
  };

  const resumeVoiceRecording = () => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === 'paused') {
      try {
        rec.resume();
        setRecordingState('recording');
        recordTimerRef.current = window.setInterval(() => {
          setRecordingSeconds(prev => prev + 1);
        }, 1000);
      } catch (e: any) {
        console.warn('Resume voice recording notice:', e?.message || e);
      }
    }
  };

  const stopVoiceForPreview = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    const rec = mediaRecorderRef.current;
    if (rec && (rec.state === 'recording' || rec.state === 'paused')) {
      rec.stop();
    }
  };

  const cancelVoiceRecording = () => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    if (analyserIntervalRef.current) clearInterval(analyserIntervalRef.current);
    audioChunksRef.current = [];
    const rec = mediaRecorderRef.current;
    if (rec && (rec.state === 'recording' || rec.state === 'paused')) {
      rec.onstop = () => {
        rec.stream.getTracks().forEach(t => t.stop());
      };
      try {
        rec.stop();
      } catch (_) {}
    }
    setRecordedVoiceUrl(null);
    setRecordedVoiceBlob(null);
    setRecordingSeconds(0);
    setRecordingState('idle');
  };

  const uploadAndSendVoice = async (blob: Blob | null, dataUrl: string, duration: number, waveform: number[], mimeType: string) => {
    if (!activeConversation || isSending) return;
    const convId = activeConversation.id;
    const ext = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('ogg') ? 'ogg' : 'webm';
    const abortController = new AbortController();
    uploadAbortControllerRef.current = abortController;

    try {
      setIsSending(true);
      setVoiceError(null);
      setUploadProgress(10);

      const uploadedUrl = await uploadMediaToFirebaseStorage(
        blob || dataUrl,
        `conversations/${convId}/voice`,
        `voice_${Date.now()}.${ext}`,
        pct => setUploadProgress(pct),
        abortController.signal
      );

      const sent = await sendMessage(convId, '🎤 Voice message', uploadedUrl, 'voice', {
        voiceDurationSeconds: Math.max(1, duration),
        voiceWaveform: waveform,
        replyTo: replyingTo
          ? {
              id: replyingTo.id,
              senderName: replyingTo.sender.displayName,
              text: replyingTo.text,
              mediaType: replyingTo.mediaType
            }
          : undefined
      });

      if (!sent) {
        throw new Error('Server did not confirm voice message delivery.');
      }

      setUploadProgress(null);
      setIsSending(false);
      uploadAbortControllerRef.current = null;
      setRecordedVoiceUrl(null);
      setRecordedVoiceBlob(null);
      setRecordingSeconds(0);
      setRecordingState('idle');
      setReplyingTo(null);
    } catch (err: any) {
      setUploadProgress(null);
      setIsSending(false);
      uploadAbortControllerRef.current = null;
      if (err?.message === 'Upload cancelled by user') {
        setVoiceError('Voice message upload cancelled.');
        return;
      }
      console.error('Voice message upload/send failed:', err);
      setVoiceError(`Failed to send voice message: ${err?.message || 'Network error'}`);
      setFailedPayload({
        convId,
        text: '🎤 Voice message',
        files: [],
        voiceData: { url: dataUrl, blob, mimeType, duration: Math.max(1, duration), waveform }
      });
    }
  };

  const sendRecordedVoiceMessage = async () => {
    if (!activeConversation || isSending) return;
    const duration = Math.max(1, recordingSeconds);
    const waveform = [...liveWaveform];

    // If user clicked Send directly while recording/paused, stop recorder and send immediately
    const rec = mediaRecorderRef.current;
    if (recordingState !== 'preview' && rec && (rec.state === 'recording' || rec.state === 'paused')) {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      const effectiveMime = rec.mimeType || recordedVoiceMime || 'audio/webm';
      rec.onstop = () => {
        rec.stream.getTracks().forEach(t => t.stop());
        if (analyserIntervalRef.current) clearInterval(analyserIntervalRef.current);
        if (audioContextRef.current) {
          audioContextRef.current.close().catch(() => {});
          audioContextRef.current = null;
        }
        if (audioChunksRef.current.length === 0) {
          setVoiceError('No audio was recorded.');
          setRecordingState('idle');
          return;
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: effectiveMime });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            uploadAndSendVoice(audioBlob, reader.result, duration, waveform, effectiveMime);
          }
        };
        reader.readAsDataURL(audioBlob);
      };
      rec.stop();
      return;
    }

    if (!recordedVoiceUrl) return;
    await uploadAndSendVoice(recordedVoiceBlob, recordedVoiceUrl, duration, waveform, recordedVoiceMime);
  };

  // Cancel active upload
  const cancelActiveUpload = () => {
    if (uploadAbortControllerRef.current) {
      uploadAbortControllerRef.current.abort();
      uploadAbortControllerRef.current = null;
    }
    setUploadProgress(null);
    setIsSending(false);
  };

  // -------------------------------------------------------------
  // Send Text / Media / Document / Edit Message
  // -------------------------------------------------------------
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation || isSending) return;

    // Handle Edit Mode
    if (editingMessage) {
      if (!msgText.trim()) return;
      setIsSending(true);
      try {
        await editMessage(activeConversation.id, editingMessage.id, msgText.trim());
        setEditingMessage(null);
        setMsgText('');
      } finally {
        setIsSending(false);
      }
      return;
    }

    if (!msgText.trim() && pendingFiles.length === 0) return;

    const convId = activeConversation.id;
    const textToSend = msgText.trim();
    const filesToSend = [...pendingFiles];
    const replyPayload = replyingTo
      ? {
          id: replyingTo.id,
          senderName: replyingTo.sender.displayName,
          text: replyingTo.text,
          mediaType: replyingTo.mediaType
        }
      : undefined;

    setIsSending(true);
    setAttachmentError(null);
    setMsgText('');
    setPendingFiles([]);
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setTypingStatus(convId, false);

    const abortController = new AbortController();
    uploadAbortControllerRef.current = abortController;

    try {
      if (filesToSend.length > 0) {
        setUploadProgress(5);
        const allImages = filesToSend.every(f => f.type === 'image');
        if (allImages) {
          const uploadedUrls: string[] = [];
          for (let i = 0; i < filesToSend.length; i++) {
            const item = filesToSend[i];
            const url = await uploadMediaToFirebaseStorage(
              item.file || item.dataUrl,
              `conversations/${convId}/images`,
              item.name,
              pct => {
                const overall = Math.round(((i + pct / 100) / filesToSend.length) * 100);
                setUploadProgress(overall);
              },
              abortController.signal
            );
            uploadedUrls.push(url);
          }
          setUploadProgress(null);
          const sent = await sendMessage(convId, textToSend, uploadedUrls[0], 'image', {
            mediaUrls: uploadedUrls,
            fileName: filesToSend[0].name,
            fileSize: filesToSend[0].size,
            replyTo: replyPayload
          });
          if (!sent) throw new Error('Failed to save image message.');
        } else {
          for (let i = 0; i < filesToSend.length; i++) {
            const item = filesToSend[i];
            const url = await uploadMediaToFirebaseStorage(
              item.file || item.dataUrl,
              `conversations/${convId}/${item.type}s`,
              item.name,
              pct => {
                const overall = Math.round(((i + pct / 100) / filesToSend.length) * 100);
                setUploadProgress(overall);
              },
              abortController.signal
            );
            const sent = await sendMessage(
              convId,
              i === 0 ? textToSend : '',
              url,
              item.type,
              {
                fileName: item.name,
                fileSize: item.size,
                replyTo: i === 0 ? replyPayload : undefined
              }
            );
            if (!sent) throw new Error(`Failed to send attachment "${item.name}".`);
          }
          setUploadProgress(null);
        }
      } else {
        const sent = await sendMessage(convId, textToSend, undefined, undefined, {
          replyTo: replyPayload
        });
        if (!sent) throw new Error('Message could not be delivered.');
      }
      setFailedPayload(null);
    } catch (err: any) {
      setUploadProgress(null);
      if (err?.message === 'Upload cancelled by user') {
        // Restore text and files to composer when cancelled by user
        setMsgText(textToSend);
        setPendingFiles(filesToSend);
        setAttachmentError('Upload was cancelled.');
      } else {
        console.error('Failed to send message:', err);
        setAttachmentError(err?.message || 'Message delivery failed.');
        setFailedPayload({
          convId,
          text: textToSend,
          files: filesToSend
        });
      }
    } finally {
      setIsSending(false);
      uploadAbortControllerRef.current = null;
    }
  };

  const retryFailedSend = async () => {
    if (!failedPayload || isSending) return;
    const payload = failedPayload;
    setFailedPayload(null);
    setAttachmentError(null);

    if (payload.voiceData) {
      await uploadAndSendVoice(
        payload.voiceData.blob || null,
        payload.voiceData.url,
        payload.voiceData.duration,
        payload.voiceData.waveform,
        payload.voiceData.mimeType || 'audio/webm'
      );
      return;
    }

    setIsSending(true);
    try {
      if (payload.files.length > 0) {
        setUploadProgress(10);
        for (let i = 0; i < payload.files.length; i++) {
          const item = payload.files[i];
          const url = await uploadMediaToFirebaseStorage(
            item.file || item.dataUrl,
            `conversations/${payload.convId}/${item.type}s`,
            item.name,
            pct => setUploadProgress(pct)
          );
          await sendMessage(payload.convId, i === 0 ? payload.text : '', url, item.type, {
            fileName: item.name,
            fileSize: item.size
          });
        }
        setUploadProgress(null);
      } else {
        await sendMessage(payload.convId, payload.text);
      }
    } catch (err: any) {
      setUploadProgress(null);
      setFailedPayload(payload);
      setAttachmentError(err?.message || 'Retry failed.');
    } finally {
      setIsSending(false);
    }
  };

  // Create a real second user account from the New Chat modal for two-user testing
  const handleCreateSecondAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateUserError(null);
    if (!newAccountName.trim() || !newAccountUsername.trim()) {
      setCreateUserError('Please enter both display name and username.');
      return;
    }

    try {
      setIsCreatingSecondUser(true);
      const currentAdminId = currentUser?.id;
      const res = await apiFetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: newAccountName.trim(),
          username: newAccountUsername.trim().toLowerCase().replace(/^@/, ''),
          bio: newAccountBio.trim() || 'YourBby Member 🌐'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCreateUserError(data.error || 'Could not create account');
        setIsCreatingSecondUser(false);
        return;
      }

      const createdUser: User = data.user;
      // Restore current user session if we just wanted to add a contact to chat with,
      // and open the 1-to-1 conversation immediately!
      if (currentAdminId) {
        await switchUserAccount(currentAdminId);
      }
      setNewAccountName('');
      setNewAccountUsername('');
      setNewAccountBio('');
      setIsCreatingSecondUser(false);
      setIsNewChatModalOpen(false);
      await startChatWithUser(createdUser);
    } catch (err: any) {
      setCreateUserError(err.message || 'Error creating user');
      setIsCreatingSecondUser(false);
    }
  };

  // Filtered conversations list
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      if (sidebarFilter === 'archived') {
        if (!c.isArchived) return false;
      } else {
        if (c.isArchived) return false;
      }
      if (sidebarFilter === 'unread' && (!c.unreadCount || c.unreadCount <= 0)) return false;
      if (sidebarFilter === 'pinned' && !c.isPinned) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const other = getOtherParticipant(c);
      const nameMatch = (c.name || other?.displayName || '').toLowerCase().includes(q);
      const usernameMatch = (other?.username || '').toLowerCase().includes(q);
      const lastMsgMatch = (c.lastMessage?.text || '').toLowerCase().includes(q);
      return nameMatch || usernameMatch || lastMsgMatch;
    });
  }, [conversations, sidebarFilter, searchQuery, currentUser]);

  // Filtered & paginated messages in active conversation
  const filteredMessages = useMemo(() => {
    if (!inChatSearchQuery.trim()) return activeConversationMessages;
    const q = inChatSearchQuery.toLowerCase();
    return activeConversationMessages.filter(
      m => m.text.toLowerCase().includes(q) || (m.fileName || '').toLowerCase().includes(q)
    );
  }, [activeConversationMessages, inChatSearchQuery]);

  const hasOlderMessages = filteredMessages.length > visibleMessageCount;
  const displayedMessages = useMemo(() => {
    if (filteredMessages.length <= visibleMessageCount) return filteredMessages;
    return filteredMessages.slice(filteredMessages.length - visibleMessageCount);
  }, [filteredMessages, visibleMessageCount]);

  // Shared media in active conversation for the Info Drawer
  const sharedMediaItems = useMemo(() => {
    return activeConversationMessages.filter(
      m => !m.isDeleted && (m.mediaType === 'image' || m.mediaType === 'video' || m.mediaType === 'file')
    );
  }, [activeConversationMessages]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 shadow-xl overflow-hidden flex h-[calc(100vh-7.5rem)] min-h-[580px] relative">
      {/* ========================================================= */}
      {/* LEFT SIDEBAR: CONVERSATIONS & CALL HISTORY                */}
      {/* ========================================================= */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 flex flex-col ${
          activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Messages
                {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0) > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white">
                    {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
                  </span>
                )}
              </h2>
              {currentUser && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Signed in as <span className="font-semibold text-slate-700 dark:text-slate-200">{currentUser.displayName}</span> (@{currentUser.username})
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleBrowserNotifications}
                className={`p-2 rounded-xl border transition ${
                  notificationsEnabled
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'
                }`}
                title={notificationsEnabled ? 'Message notifications enabled' : 'Message notifications muted'}
              >
                {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white text-xs font-bold shadow-sm hover:opacity-95 transition"
                title="Start a new conversation"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>
            </div>
          </div>

          {/* Search input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats, people, or messages..."
              className="w-full bg-slate-100 dark:bg-slate-800 text-sm rounded-xl pl-10 pr-8 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-0.5">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'unread', label: 'Unread' },
                { id: 'pinned', label: 'Pinned' },
                { id: 'archived', label: 'Archived' },
                { id: 'calls', label: `Calls (${callHistory.length})` }
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSidebarFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  sidebarFilter === tab.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations List OR Call History List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
          {sidebarFilter === 'calls' ? (
            callHistory.length === 0 ? (
              <div className="p-8 text-center">
                <Phone className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Call History Yet</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Start an audio or video call from any conversation.
                </p>
              </div>
            ) : (
              callHistory.map(call => {
                const isOutgoing = call.callerId === currentUser?.id;
                const peer = isOutgoing ? call.callee : call.caller;
                return (
                  <div
                    key={call.id}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={peer.avatar}
                        alt={peer.displayName}
                        className="w-11 h-11 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {peer.displayName}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {call.status === 'missed' || call.status === 'rejected' ? (
                            <PhoneMissed className="w-3.5 h-3.5 text-rose-500" />
                          ) : isOutgoing ? (
                            <PhoneOutgoing className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <PhoneIncoming className="w-3.5 h-3.5 text-indigo-500" />
                          )}
                          <span className="capitalize">{call.type}</span>
                          <span>•</span>
                          <span className="capitalize">{call.status}</span>
                          {call.durationSeconds && (
                            <>
                              <span>•</span>
                              <span>{formatDuration(call.durationSeconds)}</span>
                            </>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(call.startedAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => startCall(peer, call.type, call.conversationId)}
                      className="p-2.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition"
                      title={`Call ${peer.displayName}`}
                    >
                      {call.type === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                    </button>
                  </div>
                );
              })
            )
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {searchQuery ? 'No matching conversations' : 'No conversations yet'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Start a real-time chat with any registered user or create a second account to test messaging.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition shadow-sm"
              >
                Start a Conversation
              </button>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const other = getOtherParticipant(conv);
              const isSelected = activeConversation?.id === conv.id;
              const isOtherTyping = (conv.typingUserIds || []).some(id => id !== currentUser?.id);

              return (
                <div
                  key={conv.id}
                  className={`relative group flex items-center gap-3 p-3.5 transition cursor-pointer ${
                    isSelected
                      ? 'bg-rose-50/90 dark:bg-rose-950/30 border-l-4 border-rose-500'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                  onClick={() => setActiveConversation(conv)}
                >
                  <div className="relative shrink-0">
                    <img
                      src={conv.isGroup ? conv.avatar : other?.avatar}
                      alt={conv.isGroup ? conv.name : other?.displayName}
                      className="w-12 h-12 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                    {!conv.isGroup && other?.isOnline && (
                      <span
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900"
                        title="Online now"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {conv.isGroup ? conv.name : other?.displayName}
                        </h4>
                        {conv.isPinned && <Pin className="w-3 h-3 text-rose-500 shrink-0 rotate-45" />}
                        {conv.isMuted && <VolumeX className="w-3 h-3 text-slate-400 shrink-0" />}
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">
                        {conv.lastMessage
                          ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {isOtherTyping ? (
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse truncate">
                          Typing...
                        </p>
                      ) : (
                        <p
                          className={`text-xs truncate flex items-center gap-1 ${
                            conv.unreadCount > 0
                              ? 'font-bold text-slate-900 dark:text-white'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {conv.lastMessage && conv.lastMessage.senderId === currentUser?.id && (
                            <span className="inline-flex shrink-0">
                              {conv.lastMessage.read || conv.lastMessage.status === 'read' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
                              ) : conv.lastMessage.status === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </span>
                          )}
                          <span className="truncate">
                            {conv.lastMessage?.text ||
                              (conv.lastMessage?.mediaType === 'voice'
                                ? '🎤 Voice message'
                                : conv.lastMessage?.mediaType === 'image'
                                ? '📷 Photo'
                                : conv.lastMessage?.mediaType === 'video'
                                ? '🎬 Video'
                                : conv.lastMessage?.mediaType === 'file'
                                ? `📎 ${conv.lastMessage.fileName || 'Document'}`
                                : 'Start chatting...')}
                          </span>
                        </p>
                      )}

                      <div className="flex items-center gap-1 shrink-0">
                        {conv.unreadCount > 0 && (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            setConvMenuOpenId(convMenuOpenId === conv.id ? null : conv.id);
                          }}
                          className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition"
                          title="Conversation options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Conversation Context Dropdown */}
                  {convMenuOpenId === conv.id && (
                    <div
                      onClick={e => e.stopPropagation()}
                      className="absolute right-3 top-12 z-30 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 text-xs font-semibold"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          togglePinConversation(conv.id);
                          setConvMenuOpenId(null);
                        }}
                        className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200"
                      >
                        <Pin className="w-3.5 h-3.5 text-rose-500" />
                        <span>{conv.isPinned ? 'Unpin Chat' : 'Pin Chat'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          toggleMuteConversation(conv.id);
                          setConvMenuOpenId(null);
                        }}
                        className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200"
                      >
                        {conv.isMuted ? <Volume2 className="w-3.5 h-3.5 text-emerald-500" /> : <VolumeX className="w-3.5 h-3.5 text-amber-500" />}
                        <span>{conv.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          toggleArchiveConversation(conv.id);
                          setConvMenuOpenId(null);
                        }}
                        className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200"
                      >
                        <Archive className="w-3.5 h-3.5 text-indigo-500" />
                        <span>{conv.isArchived ? 'Unarchive Chat' : 'Archive Chat'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          deleteConversation(conv.id);
                          setConvMenuOpenId(null);
                        }}
                        className="w-full px-3.5 py-2 text-left flex items-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Conversation</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT PANE: ACTIVE CONVERSATION SCREEN                    */}
      {/* ========================================================= */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/40 min-w-0">
          {/* Chat Header */}
          <div className="p-3.5 sm:px-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setActiveConversation(null)}
                className="md:hidden p-2 -ml-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                title="Back to conversations"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {(() => {
                const other = getOtherParticipant(activeConversation);
                const isOtherTyping = (activeConversation.typingUserIds || []).some(
                  id => id !== currentUser?.id
                );
                return (
                  <div
                    onClick={() => {
                      if (!activeConversation.isGroup && other?.username) {
                        setViewingProfileUsername(other.username);
                        setActiveTab('profile');
                      }
                    }}
                    className="flex items-center gap-3 min-w-0 cursor-pointer group"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={activeConversation.isGroup ? activeConversation.avatar : other?.avatar}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 group-hover:ring-rose-500 transition"
                      />
                      {!activeConversation.isGroup && other?.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-rose-500 transition truncate flex items-center gap-1.5">
                        <span>
                          {activeConversation.isGroup ? activeConversation.name : other?.displayName}
                        </span>
                        {other?.verified && (
                          <span className="text-sky-500 text-xs" title="Verified">✓</span>
                        )}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {isOtherTyping ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                            Typing a message...
                          </span>
                        ) : activeConversation.isGroup ? (
                          `${activeConversation.participants.length} members`
                        ) : other?.isOnline ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Active now
                          </span>
                        ) : (
                          formatLastSeen(other?.lastSeen)
                        )}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Header Actions: Search in Chat, Audio Call, Video Call, Info */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setInChatSearchOpen(prev => !prev)}
                className={`p-2.5 rounded-full transition ${
                  inChatSearchOpen
                    ? 'bg-rose-500 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                title="Search in conversation"
              >
                <Search className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  startCall(getOtherParticipant(activeConversation), 'audio', activeConversation.id)
                }
                className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                title="Start Voice Call (WebRTC)"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  startCall(getOtherParticipant(activeConversation), 'video', activeConversation.id)
                }
                className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                title="Start Video Call (WebRTC)"
              >
                <Video className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowConvInfoDrawer(prev => !prev)}
                className={`p-2.5 rounded-full transition ${
                  showConvInfoDrawer
                    ? 'bg-rose-500 text-white'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                title="Conversation Details & Shared Media"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* In-Conversation Message Search Bar */}
          {inChatSearchOpen && (
            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={inChatSearchQuery}
                onChange={e => setInChatSearchQuery(e.target.value)}
                placeholder="Filter messages in this conversation..."
                className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                autoFocus
              />
              {inChatSearchQuery && (
                <span className="text-[11px] text-slate-500">
                  {filteredMessages.length} match{filteredMessages.length === 1 ? '' : 'es'}
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setInChatSearchQuery('');
                  setInChatSearchOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Pagination: Load Older Messages */}
            {hasOlderMessages && (
              <div className="text-center pb-2">
                <button
                  type="button"
                  onClick={() => setVisibleMessageCount(prev => prev + 25)}
                  className="px-4 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-rose-500 transition shadow-2xs"
                >
                  Load older messages ({filteredMessages.length - visibleMessageCount} more)
                </button>
              </div>
            )}

            {displayedMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <img
                  src={getOtherParticipant(activeConversation)?.avatar}
                  alt="Participant"
                  className="w-16 h-16 rounded-full object-cover mb-3 ring-4 ring-rose-500/15"
                />
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {getOtherParticipant(activeConversation)?.displayName}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  @{getOtherParticipant(activeConversation)?.username}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 max-w-xs">
                  Send a message, voice note, photo, video, or start a live call below.
                </p>
              </div>
            ) : (
              displayedMessages.map(msg => {
                const isMe = msg.senderId === currentUser?.id;
                const mediaList =
                  msg.mediaUrls && msg.mediaUrls.length > 0
                    ? msg.mediaUrls
                    : msg.mediaUrl
                    ? [msg.mediaUrl]
                    : [];

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}
                  >
                    <div className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <img
                          src={msg.sender?.avatar || getOtherParticipant(activeConversation)?.avatar}
                          alt={msg.sender?.displayName || 'Sender'}
                          className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
                        />
                      )}

                      <div
                        className={`rounded-2xl px-4 py-2.5 shadow-xs relative ${
                          msg.isDeleted
                            ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 italic border border-slate-200 dark:border-slate-800'
                            : isMe
                            ? 'bg-gradient-to-r from-rose-500 to-indigo-600 text-white rounded-br-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-slate-700/70 rounded-bl-xs'
                        }`}
                      >
                        {/* Quoted Reply Preview */}
                        {!msg.isDeleted && msg.replyTo && (
                          <div
                            className={`mb-2 px-3 py-1.5 rounded-xl border-l-4 text-xs ${
                              isMe
                                ? 'bg-black/20 border-white/80 text-white/90'
                                : 'bg-slate-100 dark:bg-slate-900/70 border-rose-500 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <p className="font-bold text-[10px] opacity-90">{msg.replyTo.senderName}</p>
                            <p className="truncate text-[11px]">{msg.replyTo.text || `Attachment (${msg.replyTo.mediaType})`}</p>
                          </div>
                        )}

                        {/* Media Content: Single or Multi-Image Grid */}
                        {!msg.isDeleted && msg.mediaType === 'image' && mediaList.length > 0 && (
                          <div
                            className={`grid gap-1.5 mb-2 ${
                              mediaList.length === 1
                                ? 'grid-cols-1'
                                : mediaList.length === 2
                                ? 'grid-cols-2'
                                : 'grid-cols-2'
                            }`}
                          >
                            {mediaList.map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`Shared photo ${idx + 1}`}
                                onClick={() =>
                                  setLightboxMedia({ urls: mediaList, index: idx, type: 'image' })
                                }
                                className="rounded-xl max-h-64 w-full object-cover cursor-zoom-in hover:opacity-95 transition"
                              />
                            ))}
                          </div>
                        )}

                        {/* Video Attachment */}
                        {!msg.isDeleted && msg.mediaType === 'video' && msg.mediaUrl && (
                          <div className="mb-2 relative rounded-xl overflow-hidden bg-black">
                            <video
                              src={msg.mediaUrl}
                              controls
                              playsInline
                              className="max-h-64 w-full rounded-xl object-contain"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setLightboxMedia({ urls: [msg.mediaUrl!], index: 0, type: 'video' })
                              }
                              className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/60 text-white text-[10px] font-bold hover:bg-black/80"
                            >
                              Full Screen
                            </button>
                          </div>
                        )}

                        {/* Document / File Attachment */}
                        {!msg.isDeleted && msg.mediaType === 'file' && msg.mediaUrl && (
                          <div
                            className={`flex items-center gap-3 p-2.5 rounded-xl mb-2 ${
                              isMe
                                ? 'bg-white/15 text-white'
                                : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate">{msg.fileName || 'Shared File'}</p>
                              <p className="text-[10px] opacity-75">{formatFileSize(msg.fileSize)}</p>
                            </div>
                            <a
                              href={msg.mediaUrl}
                              download={msg.fileName || 'document'}
                              className={`p-2 rounded-lg transition ${
                                isMe
                                  ? 'bg-white/20 hover:bg-white/30 text-white'
                                  : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200'
                              }`}
                              title="Download file"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </div>
                        )}

                        {/* Voice Message Player */}
                        {!msg.isDeleted && msg.mediaType === 'voice' && msg.mediaUrl ? (
                          <VoiceMessagePlayer
                            audioUrl={msg.mediaUrl}
                            durationSeconds={msg.voiceDurationSeconds}
                            waveform={msg.voiceWaveform}
                            isMe={isMe}
                          />
                        ) : (
                          msg.text && (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                              {msg.text}
                            </p>
                          )
                        )}

                        {/* Timestamp, Edited badge & Delivery/Read Status */}
                        <div
                          className={`flex items-center justify-end gap-1.5 mt-1 ${
                            isMe ? 'text-white/75' : 'text-slate-400'
                          }`}
                        >
                          {msg.isEdited && !msg.isDeleted && (
                            <span className="text-[10px] italic">(edited)</span>
                          )}
                          <span
                            className="text-[10px]"
                            title={new Date(msg.createdAt).toLocaleString()}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          {isMe && !msg.isDeleted && (
                            <span
                              title={
                                msg.read || msg.status === 'read'
                                  ? `Read ${msg.readAt ? new Date(msg.readAt).toLocaleTimeString() : ''}`
                                  : msg.status === 'delivered'
                                  ? 'Delivered'
                                  : 'Sent'
                              }
                            >
                              {msg.read || msg.status === 'read' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck className="w-3.5 h-3.5 text-white/80" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-white/70" />
                              )}
                            </span>
                          )}
                        </div>

                        {/* Message Reactions Pills */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div
                            className={`flex flex-wrap gap-1 mt-1.5 ${
                              isMe ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => {
                              const count = msg.reactions!.filter(r => r.emoji === emoji).length;
                              const reactedByMe = msg.reactions!.some(
                                r => r.emoji === emoji && r.userId === currentUser?.id
                              );
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => reactToMessage(activeConversation.id, msg.id, emoji)}
                                  className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 border shadow-2xs transition ${
                                    reactedByMe
                                      ? 'bg-rose-500 text-white border-rose-400'
                                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <span>{emoji}</span>
                                  {count > 1 && <span className="text-[10px] font-bold">{count}</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Message Action Toolbar (React, Reply, Edit, Delete) */}
                      {!msg.isDeleted && (
                        <div className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition flex items-center gap-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-md shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveReactionMsgId(activeReactionMsgId === msg.id ? null : msg.id)
                            }
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                            title="React with emoji"
                          >
                            <Smile className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReplyingTo(msg);
                              setEditingMessage(null);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                            title="Reply to message"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                          {isMe && msg.mediaType !== 'voice' && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingMessage(msg);
                                setReplyingTo(null);
                                setMsgText(msg.text);
                              }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"
                              title="Edit message"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {isMe && (
                            <button
                              type="button"
                              onClick={() => deleteMessage(activeConversation.id, msg.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500"
                              title="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick Emoji Reaction Bar Popover */}
                    {activeReactionMsgId === msg.id && (
                      <div
                        className={`mt-1 z-20 flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full px-2.5 py-1 shadow-xl ${
                          isMe ? 'mr-2' : 'ml-9'
                        }`}
                      >
                        {QUICK_REACTIONS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              reactToMessage(activeConversation.id, msg.id, emoji);
                              setActiveReactionMsgId(null);
                            }}
                            className="text-base hover:scale-125 transition px-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ========================================================= */}
          {/* MESSAGE COMPOSER BAR                                      */}
          {/* ========================================================= */}
          <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 space-y-2.5 relative">
            {/* Voice Error Banner */}
            {voiceError && (
              <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{voiceError}</span>
                </div>
                <button type="button" onClick={() => setVoiceError(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* File / Attachment Validation Error Banner */}
            {attachmentError && (
              <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{attachmentError}</span>
                </div>
                <button type="button" onClick={() => setAttachmentError(null)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Upload Progress Bar with Cancel Option */}
            {uploadProgress !== null && (
              <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/70 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <span>Uploading media to cloud storage ({uploadProgress}%)...</span>
                  <button
                    type="button"
                    onClick={cancelActiveUpload}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white transition font-bold"
                    title="Cancel active upload"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancel</span>
                  </button>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-indigo-600 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Failed Upload / Send Retry Banner */}
            {failedPayload && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs">
                <span>Message delivery failed.</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={retryFailedSend}
                    disabled={isSending}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold hover:bg-rose-600 disabled:opacity-50 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry</span>
                  </button>
                  <button type="button" onClick={() => setFailedPayload(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Reply or Edit Banner */}
            {(replyingTo || editingMessage) && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-l-4 border-rose-500 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-rose-500">
                    {editingMessage ? 'Editing Message' : `Replying to ${replyingTo?.sender.displayName}`}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 truncate">
                    {(editingMessage || replyingTo)?.text || 'Media attachment'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setEditingMessage(null);
                    if (editingMessage) setMsgText('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Pending Media / Document Attachments Preview */}
            {pendingFiles.length > 0 && (
              <div className="flex items-center gap-2.5 overflow-x-auto py-1">
                {pendingFiles.map((item, idx) => (
                  <div
                    key={idx}
                    className="relative shrink-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                  >
                    {item.type === 'image' ? (
                      <img src={item.dataUrl} alt={item.name} className="w-20 h-20 object-cover" />
                    ) : item.type === 'video' ? (
                      <video src={item.dataUrl} className="w-20 h-20 object-cover" />
                    ) : (
                      <div className="w-36 h-20 p-2 flex flex-col justify-center items-center text-center">
                        <FileText className="w-6 h-6 text-rose-500 mb-1" />
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate w-full">
                          {item.name}
                        </p>
                        <p className="text-[9px] text-slate-400">{formatFileSize(item.size)}</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setPendingFiles(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-rose-500"
                      title="Remove attachment"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
              <div className="absolute bottom-20 left-4 z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 shadow-2xl w-72">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500">Emojis</span>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {COMPOSER_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setMsgText(prev => prev + emoji)}
                      className="text-lg p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hidden File Inputs (Explicit MIME types & extensions for Android Chrome DocumentsUI compatibility) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleMediaSelect}
              accept="image/*,video/*"
              multiple
              className="hidden"
            />
            <input
              type="file"
              ref={docInputRef}
              onChange={handleDocumentSelect}
              accept=".pdf,.doc,.docx,.txt,.rtf,.csv,.xls,.xlsx,.ppt,.pptx,.zip,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/zip"
              multiple
              className="hidden"
            />

            {/* Voice Recording / Preview Controls OR Standard Composer */}
            {recordingState !== 'idle' ? (
              <div className="flex items-center justify-between gap-3 bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 rounded-2xl px-4 py-2.5">
                {recordingState === 'preview' && recordedVoiceUrl ? (
                  <>
                    <div className="flex-1 min-w-0">
                      <VoiceMessagePlayer
                        audioUrl={recordedVoiceUrl}
                        durationSeconds={recordingSeconds}
                        waveform={liveWaveform}
                        isMe={false}
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={cancelVoiceRecording}
                        disabled={isSending}
                        className="p-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-500 hover:text-white disabled:opacity-50 transition"
                        title="Discard recording"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={sendRecordedVoiceMessage}
                        disabled={isSending}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white text-xs font-bold shadow-md hover:opacity-95 disabled:opacity-50 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{isSending ? 'Sending...' : 'Send Voice'}</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span
                        className={`w-3 h-3 rounded-full bg-rose-500 shrink-0 ${
                          recordingState === 'recording' ? 'animate-ping' : ''
                        }`}
                      />
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0">
                        {recordingState === 'paused' ? 'Paused' : 'Recording'} {formatDuration(recordingSeconds)}
                      </span>

                      {/* Live Waveform Visualization */}
                      <div className="flex items-center gap-1 h-6 flex-1 max-w-[180px]">
                        {liveWaveform.slice(0, 16).map((val, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-rose-500 rounded-full transition-all duration-100"
                            style={{ height: `${recordingState === 'paused' ? 25 : val}%` }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {recordingState === 'recording' ? (
                        <button
                          type="button"
                          onClick={pauseVoiceRecording}
                          className="p-2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition"
                          title="Pause recording"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={resumeVoiceRecording}
                          className="p-2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition"
                          title="Resume recording"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={stopVoiceForPreview}
                        disabled={isSending}
                        className="px-3 py-1.5 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                        title="Preview before sending"
                      >
                        <Square className="w-3 h-3 fill-current" />
                        <span>Preview</span>
                      </button>
                      <button
                        type="button"
                        onClick={sendRecordedVoiceMessage}
                        disabled={isSending}
                        className="px-3 py-1.5 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white text-xs font-bold flex items-center gap-1 shadow-xs hover:opacity-95 disabled:opacity-50 transition"
                        title="Send voice message now"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send</span>
                      </button>
                      <button
                        type="button"
                        onClick={cancelVoiceRecording}
                        disabled={isSending}
                        className="p-2 rounded-full text-slate-500 hover:text-rose-600 disabled:opacity-50"
                        title="Cancel recording"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <form onSubmit={handleSend} className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(prev => !prev)}
                  className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition shrink-0"
                  title="Emoji picker"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSending}
                  className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-50 transition shrink-0"
                  title="Send photos or videos"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => docInputRef.current?.click()}
                  disabled={isSending}
                  className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-50 transition shrink-0"
                  title="Share document or file (PDF, DOC, DOCX, TXT, CSV, XLS, PPT, ZIP)"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  onClick={() => setIsCameraModalOpen(true)}
                  disabled={isSending}
                  className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-50 transition shrink-0"
                  title="Capture photo or video with camera"
                >
                  <Camera className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={msgText}
                  onChange={e => handleInputChange(e.target.value)}
                  placeholder={editingMessage ? 'Edit your message...' : 'Write a message...'}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 min-w-0"
                />

                {msgText.trim() || pendingFiles.length > 0 || editingMessage ? (
                  <button
                    type="submit"
                    disabled={isSending}
                    className="p-2.5 rounded-full bg-gradient-to-r from-rose-500 to-indigo-600 text-white shadow-md hover:opacity-95 disabled:opacity-50 transition shrink-0"
                    title="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    disabled={isSending}
                    className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 disabled:opacity-50 transition shrink-0"
                    title="Record voice message"
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center p-8 text-center bg-slate-50/40 dark:bg-slate-950/30">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-rose-500/20 to-indigo-500/20 flex items-center justify-center text-rose-500 mb-4">
            <Send className="w-9 h-9" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">
            YourBby Real-Time Messenger
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-5">
            Send real-time text messages, voice recordings, multi-photo galleries, videos, documents, or start a live WebRTC audio/video call.
          </p>
          <button
            type="button"
            onClick={() => setIsNewChatModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white text-xs font-bold shadow-md hover:opacity-95 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Start New Conversation</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* CONVERSATION INFO & SHARED MEDIA DRAWER                   */}
      {/* ========================================================= */}
      {activeConversation && showConvInfoDrawer && (
        <div className="w-72 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">Conversation Info</h4>
            <button
              type="button"
              onClick={() => setShowConvInfoDrawer(false)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {(() => {
            const other = getOtherParticipant(activeConversation);
            return (
              <div className="text-center pb-4 border-b border-slate-200 dark:border-slate-800">
                <img
                  src={other?.avatar}
                  alt={other?.displayName}
                  className="w-16 h-16 rounded-full object-cover mx-auto mb-2 ring-2 ring-rose-500/30"
                />
                <h5 className="font-bold text-sm text-slate-900 dark:text-white">{other?.displayName}</h5>
                <p className="text-xs text-slate-500">@{other?.username}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {other?.isOnline ? '🟢 Online now' : formatLastSeen(other?.lastSeen)}
                </p>
              </div>
            );
          })()}

          <div className="py-3 border-b border-slate-200 dark:border-slate-800 space-y-1">
            <button
              type="button"
              onClick={() => togglePinConversation(activeConversation.id)}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <Pin className="w-4 h-4 text-rose-500" />
              <span>{activeConversation.isPinned ? 'Unpin Conversation' : 'Pin Conversation'}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleMuteConversation(activeConversation.id)}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              {activeConversation.isMuted ? (
                <Volume2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-amber-500" />
              )}
              <span>{activeConversation.isMuted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleArchiveConversation(activeConversation.id)}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
            >
              <Archive className="w-4 h-4 text-indigo-500" />
              <span>{activeConversation.isArchived ? 'Unarchive Conversation' : 'Archive Conversation'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                deleteConversation(activeConversation.id);
                setShowConvInfoDrawer(false);
              }}
              className="w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Conversation</span>
            </button>
          </div>

          <div className="pt-3">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Shared Media & Files ({sharedMediaItems.length})
            </h5>
            {sharedMediaItems.length === 0 ? (
              <p className="text-xs text-slate-400">No photos, videos, or files shared yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {sharedMediaItems.map(item =>
                  item.mediaType === 'image' && item.mediaUrl ? (
                    <img
                      key={item.id}
                      src={item.mediaUrl}
                      alt="Shared"
                      onClick={() =>
                        setLightboxMedia({
                          urls: item.mediaUrls || [item.mediaUrl!],
                          index: 0,
                          type: 'image'
                        })
                      }
                      className="w-full h-16 object-cover rounded-lg cursor-pointer hover:opacity-90"
                    />
                  ) : item.mediaType === 'video' && item.mediaUrl ? (
                    <div
                      key={item.id}
                      onClick={() =>
                        setLightboxMedia({ urls: [item.mediaUrl!], index: 0, type: 'video' })
                      }
                      className="w-full h-16 bg-slate-900 rounded-lg flex items-center justify-center text-white cursor-pointer"
                    >
                      <Video className="w-5 h-5" />
                    </div>
                  ) : (
                    <a
                      key={item.id}
                      href={item.mediaUrl}
                      download={item.fileName || 'file'}
                      className="w-full h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex flex-col items-center justify-center p-1 text-center"
                    >
                      <FileText className="w-4 h-4 text-rose-500" />
                      <span className="text-[9px] truncate w-full mt-0.5">{item.fileName || 'File'}</span>
                    </a>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* NEW MESSAGE / TWO-USER ACCOUNT SETUP MODAL                */}
      {/* ========================================================= */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Start a Conversation
              </h3>
              <button
                type="button"
                onClick={() => setIsNewChatModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Existing Registered Users */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Registered Accounts ({allUsers.length})
              </p>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                {allUsers.map(user => (
                  <div
                    key={user.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={user.avatar}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        {user.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {user.displayName}{' '}
                          {user.id === currentUser?.id && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-500 truncate">@{user.username}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {user.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={async () => {
                            await switchUserAccount(user.id);
                            setIsNewChatModalOpen(false);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title="Switch to this user account to test two-way messaging"
                        >
                          Switch To
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          await startChatWithUser(user);
                          setIsNewChatModalOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition"
                      >
                        Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create a Real Second User Account for Testing Two-User Messaging */}
            <form
              onSubmit={handleCreateSecondAccount}
              className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                <UserPlus className="w-4 h-4 text-rose-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Register a New User Account (For 2-User Chat & Call Testing)
                </h4>
              </div>

              {createUserError && (
                <p className="text-xs text-rose-500 bg-rose-500/10 px-3 py-2 rounded-xl">
                  {createUserError}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={newAccountName}
                  onChange={e => setNewAccountName(e.target.value)}
                  placeholder="Full Name (e.g. Ayesha Khan)"
                  className="bg-slate-100 dark:bg-slate-800 text-xs rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <input
                  type="text"
                  value={newAccountUsername}
                  onChange={e => setNewAccountUsername(e.target.value)}
                  placeholder="Username (e.g. ayeshakhan)"
                  className="bg-slate-100 dark:bg-slate-800 text-xs rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <input
                type="text"
                value={newAccountBio}
                onChange={e => setNewAccountBio(e.target.value)}
                placeholder="Bio (optional)"
                className="w-full bg-slate-100 dark:bg-slate-800 text-xs rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />

              <button
                type="submit"
                disabled={isCreatingSecondUser}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition disabled:opacity-50"
              >
                {isCreatingSecondUser ? 'Creating Account...' : 'Create Account & Open Conversation'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FULL-SCREEN MEDIA LIGHTBOX VIEWER                         */}
      {/* ========================================================= */}
      {lightboxMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxMedia(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
            <a
              href={lightboxMedia.urls[lightboxMedia.index]}
              download={`yourbby_media_${Date.now()}`}
              onClick={e => e.stopPropagation()}
              className="p-2.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition"
              title="Download media"
            >
              <Download className="w-5 h-5" />
            </a>
            <button
              type="button"
              onClick={() => setLightboxMedia(null)}
              className="p-2.5 rounded-full bg-white/15 hover:bg-rose-500 text-white transition"
              title="Close viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div
            className="relative max-w-4xl max-h-[85vh] flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            {lightboxMedia.urls.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxMedia(prev =>
                    prev
                      ? {
                          ...prev,
                          index: (prev.index - 1 + prev.urls.length) % prev.urls.length
                        }
                      : null
                  )
                }
                className="absolute left-2 sm:-left-12 p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {lightboxMedia.type === 'video' ? (
              <video
                src={lightboxMedia.urls[lightboxMedia.index]}
                controls
                autoPlay
                playsInline
                className="max-h-[82vh] max-w-full rounded-2xl"
              />
            ) : (
              <img
                src={lightboxMedia.urls[lightboxMedia.index]}
                alt="Full screen view"
                className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl"
              />
            )}

            {lightboxMedia.urls.length > 1 && (
              <button
                type="button"
                onClick={() =>
                  setLightboxMedia(prev =>
                    prev
                      ? {
                          ...prev,
                          index: (prev.index + 1) % prev.urls.length
                        }
                      : null
                  )
                }
                className="absolute right-2 sm:-right-12 p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DIRECT CAMERA CAPTURE MODAL FOR CHAT                      */}
      {/* ========================================================= */}
      <CameraCaptureModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCaptured}
        mode="both"
      />
    </div>
  );
};
