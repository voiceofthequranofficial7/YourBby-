import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Send,
  Phone,
  Video,
  Image as ImageIcon,
  Mic,
  Square,
  Trash2,
  Play,
  Pause,
  ChevronLeft,
  Search,
  CheckCheck,
  Paperclip,
  X
} from 'lucide-react';

export const MessengerView: React.FC = () => {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    activeConversationMessages,
    sendMessage,
    startCall,
    currentUser,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isPlayingAudioId, setIsPlayingAudioId] = useState<string | null>(null);

  // File attachments
  const [attachedMediaUrl, setAttachedMediaUrl] = useState<string | null>(null);
  const [attachedMediaType, setAttachedMediaType] = useState<'image' | 'video'>('image');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversationMessages]);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !recordedAudioUrl && !attachedMediaUrl) || !activeConversation) return;

    if (recordedAudioUrl) {
      await sendMessage(activeConversation.id, 'Voice message', recordedAudioUrl, 'voice');
      setRecordedAudioUrl(null);
    } else if (attachedMediaUrl) {
      await sendMessage(activeConversation.id, inputText.trim(), attachedMediaUrl, attachedMediaType);
      setAttachedMediaUrl(null);
      setInputText('');
    } else {
      await sendMessage(activeConversation.id, inputText.trim());
      setInputText('');
    }
  };

  // Real Microphone Recording
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedAudioUrl(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone access unavailable:', err?.name || err?.message || err);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setRecordedAudioUrl(null);
    setRecordingSeconds(0);
  };

  // File Picker
  const handleFileAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      setAttachedMediaUrl(res);
      setAttachedMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    };
    reader.readAsDataURL(file);
  };

  const filteredConversations = conversations.filter(c => {
    const name = c.isGroup ? c.name : c.participants.find(p => p.id !== currentUser?.id)?.displayName;
    return (name || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const otherParticipant = activeConversation
    ? activeConversation.participants.find(p => p.id !== currentUser?.id)
    : null;

  return (
    <div className="w-full h-[calc(100vh-8rem)] min-h-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm flex my-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileAttachment}
        className="hidden"
      />

      {/* Conversations List Panel */}
      <div
        className={`w-full md:w-80 shrink-0 border-r border-slate-100 dark:border-slate-800 flex flex-col ${
          activeConversation ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Messenger</h2>
            <span className="text-xs font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full">
              {conversations.length} Active
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search people & groups..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
          {filteredConversations.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400">No chats found</p>
          ) : (
            filteredConversations.map((c) => {
              const isActive = activeConversation?.id === c.id;
              const other = c.participants.find(p => p.id !== currentUser?.id);
              const displayName = c.isGroup ? c.name : other?.displayName;
              const avatar = c.isGroup ? c.avatar : other?.avatar;

              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConversation(c)}
                  className={`w-full p-3.5 flex items-center gap-3 transition-colors text-left ${
                    isActive
                      ? 'bg-rose-500/10 dark:bg-rose-500/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={avatar}
                      alt={displayName}
                      className="w-11 h-11 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                    {other?.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {displayName}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {c.lastMessage ? new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {c.lastMessage?.text || 'No messages yet'}
                      </p>
                      {c.unreadCount > 0 && (
                        <span className="w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 ml-1">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Active Chat View */}
      <div className={`flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/40 ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <>
            {/* Header */}
            <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-1 rounded-lg text-slate-500"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="relative">
                  <img
                    src={activeConversation.isGroup ? activeConversation.avatar : otherParticipant?.avatar}
                    alt="Chat Avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  {otherParticipant?.isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    {activeConversation.isGroup ? activeConversation.name : otherParticipant?.displayName}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {activeConversation.isGroup
                      ? `${activeConversation.participants.length} members`
                      : otherParticipant?.isOnline
                      ? 'Active now'
                      : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Call buttons */}
              {otherParticipant && (
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => startCall(otherParticipant, 'audio')}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    title="Audio Call"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => startCall(otherParticipant, 'video')}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500"
                    title="WebRTC Video Call"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeConversationMessages.map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMe && (
                      <img
                        src={msg.sender.avatar}
                        alt={msg.sender.displayName}
                        className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
                      />
                    )}
                    <div
                      className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs ${
                        isMe
                          ? 'bg-rose-500 text-white rounded-br-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/60 dark:border-slate-700/60 rounded-bl-xs'
                      }`}
                    >
                      {/* Media Image or Video Attachment */}
                      {msg.mediaUrl && msg.mediaType === 'image' && (
                        <img src={msg.mediaUrl} alt="Attached" className="rounded-xl max-h-56 mb-2 object-cover" />
                      )}
                      {msg.mediaUrl && msg.mediaType === 'video' && (
                        <video src={msg.mediaUrl} controls className="rounded-xl max-h-56 mb-2 object-contain" />
                      )}

                      {/* Real Voice Audio Player */}
                      {msg.mediaType === 'voice' && msg.mediaUrl ? (
                        <div className="flex items-center gap-2 py-1">
                          <audio src={msg.mediaUrl} controls className="h-8 max-w-[220px]" />
                        </div>
                      ) : msg.mediaType === 'voice' ? (
                        <div className="flex items-center gap-2">
                          <Mic className="w-4 h-4" />
                          <span>Voice note</span>
                        </div>
                      ) : (
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      )}

                      <div
                        className={`text-[9px] mt-1 flex items-center justify-end gap-1 ${
                          isMe ? 'text-white/70' : 'text-slate-400'
                        }`}
                      >
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isMe && <CheckCheck className="w-3 h-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Attached media preview bar before send */}
            {attachedMediaUrl && (
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
                <span className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-rose-500" /> Media attached
                </span>
                <button onClick={() => setAttachedMediaUrl(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Recorded voice note preview bar before send */}
            {recordedAudioUrl && (
              <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 flex items-center justify-between border-t border-rose-200 dark:border-rose-900">
                <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  <Mic className="w-4 h-4" /> Voice message ready (0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds})
                  <audio src={recordedAudioUrl} controls className="h-7 max-w-[180px] ml-2" />
                </div>
                <button onClick={() => setRecordedAudioUrl(null)} className="text-slate-400 hover:text-slate-600">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                </button>
              </div>
            )}

            {/* Live recording active indicator */}
            {isRecording && (
              <div className="px-4 py-2 bg-rose-600 text-white flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2 text-xs font-mono font-bold">
                  <span className="w-3 h-3 rounded-full bg-white" />
                  <span>Recording voice... 0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={cancelVoiceRecording} className="text-xs underline">
                    Cancel
                  </button>
                  <button
                    onClick={stopVoiceRecording}
                    className="p-1 rounded-full bg-white text-rose-600"
                    title="Stop Recording"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title="Attach Photo/Video"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {!isRecording && (
                <button
                  type="button"
                  onClick={startVoiceRecording}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Record Voice Note"
                >
                  <Mic className="w-5 h-5" />
                </button>
              )}

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                disabled={isRecording}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm rounded-full focus:outline-none focus:ring-1 focus:ring-rose-500"
              />

              <button
                type="submit"
                disabled={(!inputText.trim() && !recordedAudioUrl && !attachedMediaUrl) || isRecording}
                className="p-2.5 rounded-full bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white transition-opacity shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
              <Send className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-base text-slate-800 dark:text-white">YourBby Messenger</h3>
            <p className="text-xs max-w-xs mt-1">
              Connect with friends, record voice messages, and start real-time encrypted calls.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
