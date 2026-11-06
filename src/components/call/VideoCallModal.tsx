import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Maximize2, Shield } from 'lucide-react';

export const VideoCallModal: React.FC = () => {
  const { activeCall, endCall } = useApp();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!activeCall) return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => {
      clearInterval(interval);
      setCallDuration(0);
    };
  }, [activeCall]);

  if (!activeCall) return null;

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg h-[80vh] min-h-[500px] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Remote participant video stream */}
        <div className="absolute inset-0 z-0">
          {activeCall.type === 'video' && !isVideoOff ? (
            <img
              src={activeCall.user.coverPhoto || activeCall.user.avatar}
              alt="Remote Video"
              className="w-full h-full object-cover filter brightness-90"
            />
          ) : (
            <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
              <img
                src={activeCall.user.avatar}
                alt={activeCall.user.displayName}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-rose-500/50 mb-4 animate-pulse"
              />
              <h3 className="text-white text-lg font-bold">{activeCall.user.displayName}</h3>
              <p className="text-xs text-rose-400 font-semibold mt-1">WebRTC Encrypted Call Connected</p>
            </div>
          )}
        </div>

        {/* Top Header: Duration & Security badge */}
        <div className="relative z-10 p-5 flex items-center justify-between text-white bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">WebRTC Peer Connection</span>
          </div>
          <div className="px-3 py-1 bg-black/40 backdrop-blur-xs rounded-full text-xs font-mono font-bold">
            {formatDuration(callDuration)}
          </div>
        </div>

        {/* Picture-in-Picture Local Camera Preview */}
        {activeCall.type === 'video' && (
          <div className="absolute top-16 right-4 z-10 w-28 h-40 bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20">
            {isVideoOff ? (
              <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400 text-[10px]">
                Camera Off
              </div>
            ) : (
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80"
                alt="My Camera"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}

        {/* Bottom Call Controls */}
        <div className="relative z-10 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center gap-4">
          {/* Mute button */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all ${
              isMuted ? 'bg-amber-500' : 'bg-white/20 hover:bg-white/30 backdrop-blur-xs'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg shadow-rose-600/50 transition-transform active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          {/* Video Toggle */}
          {activeCall.type === 'video' && (
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all ${
                isVideoOff ? 'bg-amber-500' : 'bg-white/20 hover:bg-white/30 backdrop-blur-xs'
              }`}
              title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
