import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Phone,
  Maximize2,
  Minimize2,
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { apiFetch } from '../../firebase/staticApiFallback.ts';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export const VideoCallModal: React.FC = () => {
  const { activeCall, acceptCall, rejectCall, endCall, currentUser } = useApp();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [callSeconds, setCallSeconds] = useState(0);
  const [callStatus, setCallStatus] = useState<'ringing' | 'connecting' | 'connected' | 'ended' | 'rejected'>('ringing');
  const [mediaPermissionWarning, setMediaPermissionWarning] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const processedCandidatesRef = useRef<Set<string>>(new Set());

  // Reset state when activeCall changes
  useEffect(() => {
    if (!activeCall) {
      cleanupMediaAndPeer();
      setCallSeconds(0);
      setCallStatus('ringing');
      setMediaPermissionWarning(null);
      setHasRemoteVideo(false);
      processedCandidatesRef.current.clear();
      return;
    }

    const wantVideo = activeCall.type === 'video';
    setIsVideoOff(!wantVideo);
    setCallStatus(activeCall.callSession?.status === 'connected' ? 'connected' : 'ringing');

    // If outgoing call or already accepted incoming call, acquire media and start WebRTC
    if (!activeCall.isIncoming) {
      initWebRTCSession(wantVideo, 'caller');
    }

    return () => {
      cleanupMediaAndPeer();
    };
  }, [activeCall?.callSession?.id, activeCall?.isIncoming]);

  // Call duration timer when connected
  useEffect(() => {
    if (callStatus !== 'connected') return;
    const timer = window.setInterval(() => {
      setCallSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callStatus]);

  // Poll call signaling state (offer, answer, ICE candidates, status) every 1.5s
  useEffect(() => {
    if (!activeCall?.callSession?.id) return;
    const callId = activeCall.callSession.id;
    const isCaller = activeCall.callSession.callerId === currentUser?.id;

    const signalInterval = window.setInterval(async () => {
      try {
        const res = await apiFetch(`/api/calls/${callId}`);
        const data = await res.json();
        if (!data.success || !data.call) return;

        const session = data.call;
        if (session.status === 'rejected' || session.status === 'ended') {
          setCallStatus(session.status);
          setTimeout(() => endCall(), 900);
          return;
        }

        if (session.status === 'connected' && callStatus !== 'connected') {
          setCallStatus('connected');
        }

        const pc = peerConnectionRef.current;
        if (!pc) return;

        // If caller and remote answer arrived
        if (isCaller && session.answer && !pc.currentRemoteDescription) {
          await pc.setRemoteDescription(new RTCSessionDescription(session.answer));
          setCallStatus('connected');
        }

        // Apply remote ICE candidates
        const remoteCandidates: any[] = isCaller
          ? session.calleeCandidates || []
          : session.callerCandidates || [];

        for (const cand of remoteCandidates) {
          const key = JSON.stringify(cand);
          if (!processedCandidatesRef.current.has(key)) {
            processedCandidatesRef.current.add(key);
            if (pc.remoteDescription) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(cand));
              } catch (_) {}
            }
          }
        }
      } catch (_) {}
    }, 1500);

    return () => clearInterval(signalInterval);
  }, [activeCall?.callSession?.id, callStatus, currentUser?.id]);

  const cleanupMediaAndPeer = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const acquireLocalMedia = async (withVideo: boolean, facing: 'user' | 'environment' = facingMode) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMediaPermissionWarning('Camera/Microphone API is not available in this browser environment.');
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: withVideo ? { facingMode: facing } : false
      });
      localStreamRef.current = stream;
      if (localVideoRef.current && withVideo) {
        localVideoRef.current.srcObject = stream;
      }
      setMediaPermissionWarning(null);
      return stream;
    } catch (err) {
      // Fallback to audio-only if camera fails
      if (withVideo) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          localStreamRef.current = audioStream;
          setIsVideoOff(true);
          setMediaPermissionWarning('Camera permission denied or unavailable; switched to voice-only.');
          return audioStream;
        } catch (_) {}
      }
      console.warn('Media permission denied during call:', err);
      setMediaPermissionWarning('Microphone/Camera permission was denied by browser settings.');
      return null;
    }
  };

  const initWebRTCSession = async (withVideo: boolean, role: 'caller' | 'callee') => {
    setCallStatus('connecting');
    const stream = await acquireLocalMedia(withVideo);
    const callId = activeCall?.callSession?.id;

    try {
      const pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionRef.current = pc;

      if (stream) {
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
      }

      pc.ontrack = event => {
        const [remoteStream] = event.streams;
        if (remoteStream && remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          setHasRemoteVideo(remoteStream.getVideoTracks().length > 0);
        }
      };

      pc.onicecandidate = event => {
        if (event.candidate && callId) {
          apiFetch(`/api/calls/${callId}/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              role,
              candidate: event.candidate.toJSON()
            })
          }).catch(() => {});
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setCallStatus('connected');
        }
      };

      if (role === 'caller') {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: withVideo
        });
        await pc.setLocalDescription(offer);
        if (callId) {
          await apiFetch(`/api/calls/${callId}/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              offer: { type: offer.type, sdp: offer.sdp }
            })
          });
        }
        setCallStatus('ringing');
      } else if (role === 'callee' && callId) {
        const res = await apiFetch(`/api/calls/${callId}`);
        const data = await res.json();
        if (data.success && data.call?.offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.call.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await apiFetch(`/api/calls/${callId}/signal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'connected',
              answer: { type: answer.type, sdp: answer.sdp }
            })
          });
        }
        setCallStatus('connected');
      }
    } catch (err) {
      console.warn('WebRTC initialization warning:', err);
    }
  };

  const handleAcceptIncoming = async () => {
    if (!activeCall) return;
    await acceptCall();
    await initWebRTCSession(activeCall.type === 'video', 'callee');
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !nextMuted;
      });
    }
  };

  const toggleVideo = async () => {
    const nextOff = !isVideoOff;
    setIsVideoOff(nextOff);
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach(t => {
          t.enabled = !nextOff;
        });
      } else if (!nextOff) {
        await acquireLocalMedia(true);
      }
    }
  };

  const switchCameraFacing = async () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (!isVideoOff) {
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(t => t.stop());
      }
      await acquireLocalMedia(true, nextFacing);
    }
  };

  if (!activeCall) return null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Minimized Floating Call Bar
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white rounded-2xl p-3 shadow-2xl flex items-center gap-3">
        <img
          src={activeCall.user.avatar}
          alt={activeCall.user.displayName}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="text-xs font-bold">{activeCall.user.displayName}</p>
          <p className="text-[10px] text-emerald-400">
            {callStatus === 'connected' ? formatTime(callSeconds) : 'Calling...'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsMinimized(false)}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20"
          title="Expand call"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={endCall}
          className="p-2 rounded-xl bg-rose-600 hover:bg-rose-700"
          title="End call"
        >
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl h-[620px] rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl flex flex-col justify-between">
        {/* Remote Video Stream (When Connected with Remote Video) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            hasRemoteVideo && callStatus === 'connected' ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Ambient Remote User Avatar Background when Audio Call or Waiting for Remote Video */}
        {(!hasRemoteVideo || callStatus !== 'connected') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <img
              src={activeCall.user.avatar}
              alt={activeCall.user.displayName}
              className="w-full h-full object-cover opacity-20 blur-2xl scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-900/50 to-slate-950/95" />

            <div className="relative z-10 flex flex-col items-center text-center px-6">
              <div className="relative mb-5">
                {callStatus === 'ringing' && (
                  <div className="absolute -inset-4 rounded-full bg-rose-500/30 animate-ping" />
                )}
                <img
                  src={activeCall.user.avatar}
                  alt={activeCall.user.displayName}
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-rose-500 shadow-2xl relative"
                />
              </div>

              <h3 className="text-2xl font-extrabold text-white tracking-tight">
                {activeCall.user.displayName}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">@{activeCall.user.username}</p>

              <p className="text-sm font-semibold text-rose-400 mt-3">
                {activeCall.isIncoming
                  ? `Incoming ${activeCall.type === 'video' ? 'Video' : 'Voice'} Call...`
                  : callStatus === 'connected'
                  ? `Connected • ${formatTime(callSeconds)}`
                  : callStatus === 'rejected'
                  ? 'Call Declined'
                  : callStatus === 'ended'
                  ? 'Call Ended'
                  : 'Ringing... (Waiting for recipient to answer)'}
              </p>

              {mediaPermissionWarning && (
                <div className="mt-4 max-w-sm px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{mediaPermissionWarning}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Bar */}
        <div className="relative z-10 p-5 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-black/45 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/10 text-xs text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>WebRTC Peer-to-Peer Encrypted</span>
          </div>

          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-2.5 rounded-full bg-black/45 text-white hover:bg-black/65 transition"
            title="Minimize call window"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Real Local Camera Preview (Picture-in-Picture) */}
        {!isVideoOff && !activeCall.isIncoming && (
          <div className="relative z-10 self-end mr-6 my-auto w-36 h-48 rounded-2xl overflow-hidden border-2 border-white/25 shadow-2xl bg-slate-950">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={switchCameraFacing}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
              title="Switch camera"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-black/65 text-white px-2 py-0.5 rounded">
              {currentUser?.displayName || 'You'}
            </span>
          </div>
        )}

        {/* Bottom Call Controls: Incoming (Accept/Reject) OR Active Call Controls */}
        <div className="relative z-10 p-6 flex items-center justify-center gap-5 bg-gradient-to-t from-black/85 to-transparent">
          {activeCall.isIncoming ? (
            <>
              <button
                type="button"
                onClick={rejectCall}
                className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition transform hover:scale-105"
              >
                <PhoneOff className="w-5 h-5" />
                <span>Decline</span>
              </button>
              <button
                type="button"
                onClick={handleAcceptIncoming}
                className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-xl shadow-emerald-500/30 transition transform hover:scale-105"
              >
                <Phone className="w-5 h-5" />
                <span>Accept Call</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleMute}
                className={`p-4 rounded-full transition ${
                  isMuted
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-md'
                }`}
                title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              <button
                type="button"
                onClick={endCall}
                className="p-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-600/40 transition transform hover:scale-105"
                title="End Call"
              >
                <PhoneOff className="w-7 h-7" />
              </button>

              <button
                type="button"
                onClick={toggleVideo}
                className={`p-4 rounded-full transition ${
                  isVideoOff
                    ? 'bg-rose-500 text-white'
                    : 'bg-white/15 text-white hover:bg-white/25 backdrop-blur-md'
                }`}
                title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isVideoOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
