import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  X,
  Check,
  Square,
  AlertCircle,
  Zap,
  ZapOff,
  Image as ImageIcon,
  Smartphone,
  Loader2
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (mediaUrl: string, mediaType: 'image' | 'video') => void;
  mode?: 'photo' | 'video' | 'both';
}

function getSupportedVideoMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const candidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4;codecs=avc1',
    'video/mp4',
  ];
  for (const mime of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    } catch (_) {}
  }
  return '';
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  mode = 'both',
}) => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>(mode === 'video' ? 'video' : 'photo');
  const [isInitializing, setIsInitializing] = useState(false);
  const [isStreamReady, setIsStreamReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedType, setCapturedType] = useState<'image' | 'video'>('image');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [audioWarning, setAudioWarning] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    mediaRecorderRef.current = null;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsStreamReady(false);
    setIsRecording(false);
    setIsTorchOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setPermissionError(null);
    setAudioWarning(null);
    setIsInitializing(true);

    // 1. Check secure context (HTTPS or localhost)
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setIsInitializing(false);
      setPermissionError(
        'Camera access requires a secure HTTPS connection. Please open this app over HTTPS or choose a file from your gallery below.'
      );
      return;
    }

    // 2. Check browser support for navigator.mediaDevices.getUserMedia
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      setIsInitializing(false);
      setPermissionError(
        'Live camera streaming is not supported in this browser or WebView. You can use your native camera or select from your gallery below.'
      );
      return;
    }

    // Give Android Chrome Camera2 hardware 120ms to release previous camera lock when flipping lenses
    await new Promise((r) => setTimeout(r, 120));

    try {
      let stream: MediaStream | null = null;
      const wantAudio = captureMode === 'video';

      // Cascade 1: Exact facingMode (reliable lens switching on Android Chrome)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: wantAudio,
        });
      } catch (firstErr: any) {
        // If permission was explicitly denied on the first prompt, do not retry blindly
        if (
          firstErr?.name === 'NotAllowedError' ||
          firstErr?.name === 'PermissionDeniedError' ||
          firstErr?.name === 'SecurityError'
        ) {
          // If video mode requested audio+video and only mic was denied, try video-only before failing
          if (wantAudio) {
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false,
              });
              setAudioWarning('Microphone permission was denied — recording video without audio.');
            } catch {
              throw firstErr;
            }
          } else {
            throw firstErr;
          }
        }
      }

      // Cascade 2: Ideal facingMode (for single-camera laptops/desktops)
      if (!stream) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: facingMode },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: wantAudio,
          });
        } catch (secondErr: any) {
          if (
            secondErr?.name === 'NotAllowedError' ||
            secondErr?.name === 'PermissionDeniedError' ||
            secondErr?.name === 'SecurityError' ||
            String(secondErr?.message || '').toLowerCase().includes('permission')
          ) {
            throw secondErr;
          }
          // Cascade 3: Basic video constraint without audio if mic or ideal constraint failed
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
          if (wantAudio) {
            setAudioWarning('Microphone unavailable — recording video without audio.');
          }
        }
      }

      const videoTracks = stream.getVideoTracks();
      if (!videoTracks || videoTracks.length === 0 || videoTracks[0].readyState === 'ended') {
        stream.getTracks().forEach((t) => t.stop());
        throw new Error('No active video track returned by camera hardware.');
      }

      // Listen for mid-session permission revocation or hardware disconnect
      videoTracks[0].onended = () => {
        stopCamera();
        setPermissionError(
          'Camera stream ended or permission was revoked. Click Retry Camera or choose from your gallery.'
        );
      };

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video element play notice:', playErr);
        }
      }
      setIsStreamReady(true);
      setIsInitializing(false);
    } catch (err: any) {
      stopCamera();
      setIsInitializing(false);

      const errName = err?.name || '';
      const errMsg = String(err?.message || '');
      console.warn('Camera access status:', errName || errMsg || 'unavailable');

      if (
        errName === 'NotAllowedError' ||
        errName === 'PermissionDeniedError' ||
        errMsg.toLowerCase().includes('permission')
      ) {
        setPermissionError(
          'Camera permission was denied. In Android Chrome, tap the lock/tune icon in the address bar → Permissions → allow Camera, or use the Gallery / Native Camera buttons below.'
        );
      } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        setPermissionError('No camera hardware was detected on this device. Please select media from your gallery below.');
      } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        setPermissionError(
          'Your camera is currently in use by another application. Please close other camera apps and tap Retry Camera.'
        );
      } else {
        setPermissionError(
          `Camera unavailable (${errMsg || errName || 'Hardware restriction'}). You can select photos or videos from your device gallery below.`
        );
      }
    }
  }, [facingMode, captureMode, stopCamera]);

  useEffect(() => {
    if (isOpen && !previewUrl) {
      startCamera();
    } else if (!isOpen) {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, previewUrl, captureMode, startCamera, stopCamera]);

  // Monitor permission state changes if supported by browser
  useEffect(() => {
    if (!isOpen || !navigator.permissions || !navigator.permissions.query) return;
    let permStatus: PermissionStatus | null = null;
    navigator.permissions
      .query({ name: 'camera' as PermissionName })
      .then((status) => {
        permStatus = status;
        status.onchange = () => {
          if (status.state === 'denied') {
            stopCamera();
            setPermissionError(
              'Camera permission was revoked in browser settings. Please re-enable Camera access or choose from your gallery.'
            );
          } else if (status.state === 'granted' && !streamRef.current && !previewUrl) {
            startCamera();
          }
        };
      })
      .catch(() => {});

    return () => {
      if (permStatus) permStatus.onchange = null;
    };
  }, [isOpen, previewUrl, startCamera, stopCamera]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const capabilities: any = track.getCapabilities?.() || {};
        if (capabilities.torch) {
          const nextState = !isTorchOn;
          await (track as any).applyConstraints({
            advanced: [{ torch: nextState }],
          });
          setIsTorchOn(nextState);
        }
      } catch (e) {
        console.warn('Torch toggle not supported on this camera lens:', e);
      }
    }
  };

  const handleFileFallbackSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setPermissionError('Selected file exceeds the 25 MB size limit. Please choose a smaller photo or video.');
      e.target.value = '';
      return;
    }
    const isVid = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        stopCamera();
        setPermissionError(null);
        setPreviewUrl(res);
        setCapturedType(isVid ? 'video' : 'image');
      }
    };
    reader.onerror = () => {
      setPermissionError('Failed to read the selected file from your device.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const switchCamera = () => {
    if (isRecording) return;
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Capture Photo from active video stream
  const capturePhoto = () => {
    if (!videoRef.current || !streamRef.current || !isStreamReady) {
      setPermissionError('Camera stream is not active. Please allow camera access or select from gallery.');
      return;
    }
    const videoEl = videoRef.current;
    const width = videoEl.videoWidth || 1280;
    const height = videoEl.videoHeight || 720;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopCamera();
    setPreviewUrl(dataUrl);
    setCapturedType('image');
  };

  // Start Video Recording with MIME type negotiation
  const startRecording = () => {
    if (!streamRef.current || !isStreamReady) {
      setPermissionError('Camera stream is not active. Cannot start video recording.');
      return;
    }
    if (typeof MediaRecorder === 'undefined') {
      setPermissionError('Video recording (MediaRecorder) is not supported in this browser. Please use the Native Camera or Gallery option.');
      return;
    }

    recordedChunksRef.current = [];
    try {
      const mimeType = getSupportedVideoMimeType();
      const recorder = mimeType
        ? new MediaRecorder(streamRef.current, { mimeType })
        : new MediaRecorder(streamRef.current);

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (ev: any) => {
        console.warn('MediaRecorder video notice:', ev?.error?.message || 'recording error');
        stopCamera();
        setPermissionError('Video recording encountered a hardware error. Please try again or use gallery upload.');
      };

      recorder.onstop = () => {
        const effectiveType = recorder.mimeType || mimeType || 'video/webm';
        const blob = new Blob(recordedChunksRef.current, { type: effectiveType });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setPreviewUrl(reader.result);
            setCapturedType('video');
          }
          stopCamera();
        };
        reader.readAsDataURL(blob);
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Video recording start notice:', err?.message || err);
      setPermissionError(`Video recording could not start: ${err?.message || 'Unsupported format'}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleConfirm = () => {
    if (previewUrl) {
      onCapture(previewUrl, capturedType);
      handleClose();
    }
  };

  const handleRetake = () => {
    setPreviewUrl(null);
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    setPreviewUrl(null);
    setPermissionError(null);
    setAudioWarning(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="relative w-full max-w-md h-[88vh] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-slate-800">
        {/* Top Header Bar */}
        <div className="relative z-20 p-4 flex items-center justify-between text-white bg-gradient-to-b from-black/75 to-transparent">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-rose-500" />
            <span className="text-xs font-bold uppercase tracking-wider">
              YourBby Camera ({facingMode === 'user' ? 'Front' : 'Rear'})
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!previewUrl && isStreamReady && !permissionError && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-1.5 rounded-full ${
                  isTorchOn ? 'bg-amber-400 text-black' : 'bg-black/50 hover:bg-black/70 text-white'
                }`}
                title="Torch / Flashlight"
              >
                {isTorchOn ? <Zap className="w-4 h-4 fill-black" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white"
              title="Close camera"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audio fallback notice banner */}
        {audioWarning && !permissionError && (
          <div className="relative z-20 mx-4 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[11px] text-center">
            {audioWarning}
          </div>
        )}

        {/* Viewfinder / Preview Screen */}
        <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
          {permissionError ? (
            <div className="p-6 text-center text-white space-y-4 max-w-sm">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-rose-500" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-extrabold text-white">Camera Access Unavailable</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{permissionError}</p>
              </div>
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => nativeCameraInputRef.current?.click()}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-rose-500 to-indigo-600 hover:opacity-95 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  <Smartphone className="w-4 h-4" /> Use System Camera App
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full px-4 py-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
                >
                  <ImageIcon className="w-4 h-4" /> Choose from Device Gallery
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-300"
                >
                  Retry Live Camera Permission
                </button>
              </div>
            </div>
          ) : previewUrl ? (
            capturedType === 'video' ? (
              <video
                src={previewUrl}
                controls
                autoPlay
                playsInline
                loop
                className="w-full h-full object-contain"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Captured Preview"
                className="w-full h-full object-contain"
              />
            )
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              {isInitializing && (
                <div className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center gap-2 text-white">
                  <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                  <span className="text-xs font-semibold text-slate-300">Starting camera...</span>
                </div>
              )}
            </>
          )}

          {/* Hidden Gallery Input */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileFallbackSelect}
          />

          {/* Hidden Native Mobile OS Camera Input */}
          <input
            ref={nativeCameraInputRef}
            type="file"
            accept={captureMode === 'video' ? 'video/*' : 'image/*'}
            capture={facingMode === 'user' ? 'user' : 'environment'}
            className="hidden"
            onChange={handleFileFallbackSelect}
          />

          {/* Live Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-rose-600/90 text-white rounded-full text-xs font-bold font-mono flex items-center gap-2 animate-pulse shadow-lg">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              <span>
                {Math.floor(recordingSeconds / 60)}:
                {recordingSeconds % 60 < 10 ? `0${recordingSeconds % 60}` : recordingSeconds % 60}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Control Rail */}
        <div className="relative z-20 p-5 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col items-center gap-4">
          {previewUrl ? (
            <div className="flex items-center justify-center gap-6 w-full">
              <button
                type="button"
                onClick={handleRetake}
                className="px-5 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all"
              >
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-500/30 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" /> Use {capturedType === 'video' ? 'Video' : 'Photo'}
              </button>
            </div>
          ) : !permissionError ? (
            <div className="w-full flex items-center justify-between px-3">
              {/* Gallery Direct Access Button */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all flex items-center justify-center"
                title="Choose from Device Gallery"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Shutter Button — only active when stream is genuinely live */}
              {captureMode === 'photo' ? (
                <button
                  type="button"
                  disabled={!isStreamReady || isInitializing}
                  onClick={capturePhoto}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40 disabled:pointer-events-none"
                  title="Take Photo"
                >
                  <div className="w-full h-full rounded-full bg-white" />
                </button>
              ) : isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-rose-500 p-2 flex items-center justify-center animate-pulse"
                  title="Stop Recording"
                >
                  <Square className="w-6 h-6 fill-rose-500 text-rose-500 rounded-sm" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!isStreamReady || isInitializing}
                  onClick={startRecording}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40 disabled:pointer-events-none"
                  title="Start Video Recording"
                >
                  <div className="w-full h-full rounded-full bg-rose-500" />
                </button>
              )}

              {/* Switch Camera (Front/Rear) & Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!isStreamReady || isRecording || isInitializing}
                  onClick={switchCamera}
                  className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all disabled:opacity-40"
                  title={`Switch to ${facingMode === 'user' ? 'Rear' : 'Front'} Camera`}
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                {mode === 'both' && !isRecording && (
                  <button
                    type="button"
                    onClick={() => setCaptureMode(captureMode === 'photo' ? 'video' : 'photo')}
                    className="px-3 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all"
                  >
                    {captureMode === 'photo' ? 'Video' : 'Photo'}
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
