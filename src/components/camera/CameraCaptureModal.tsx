import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RefreshCw,
  X,
  Check,
  Video,
  Square,
  Sparkles,
  AlertCircle,
  Zap,
  ZapOff,
  Image as ImageIcon
} from 'lucide-react';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (mediaUrl: string, mediaType: 'image' | 'video') => void;
  mode?: 'photo' | 'video' | 'both';
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  mode = 'both',
}) => {
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [captureMode, setCaptureMode] = useState<'photo' | 'video'>(mode === 'video' ? 'video' : 'photo');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [capturedType, setCapturedType] = useState<'image' | 'video'>('image');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const [isTorchOn, setIsTorchOn] = useState(false);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && !previewUrl) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, previewUrl, captureMode]);

  const startCamera = async () => {
    stopCamera();
    setPermissionError(null);
    try {
      let stream: MediaStream;
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: captureMode === 'video',
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Fallback constraint cascade for devices or emulators that fail exact resolution/facingMode
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: captureMode === 'video',
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Camera play warning:', playErr);
        }
      }
    } catch (err: any) {
      console.warn('Camera access unavailable:', err?.name || err?.message || err);
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || String(err?.message || '').toLowerCase().includes('permission');
      if (isDenied) {
        setPermissionError('Camera permission was denied. Please allow camera permissions or upload directly from your gallery.');
      } else {
        setPermissionError('Could not initialize camera: ' + (err.message || 'Unknown camera error') + '. You can select photos/videos from your device gallery below.');
      }
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track) {
      try {
        const capabilities: any = track.getCapabilities?.() || {};
        if (capabilities.torch) {
          const nextState = !isTorchOn;
          await (track as any).applyConstraints({
            advanced: [{ torch: nextState }]
          });
          setIsTorchOn(nextState);
        }
      } catch (e) {
        console.warn('Torch toggle not supported on this browser/track', e);
      }
    }
  };

  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVid = file.type.startsWith('video/');
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) {
        setPreviewUrl(res);
        setCapturedType(isVid ? 'video' : 'image');
        stopCamera();
      }
    };
    reader.readAsDataURL(file);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTorchOn(false);
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  // Photo snap
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally if front camera for natural selfie mirror
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setPreviewUrl(dataUrl);
    setCapturedType('image');
    stopCamera();
  };

  // Video record
  const startRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    try {
      const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setCapturedType('video');
        stopCamera();
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Recording error:', err);
      setPermissionError('Video recording not supported on this device');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
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
    setIsRecording(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="relative w-full max-w-md h-[88vh] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-slate-800">
        {/* Top Header Bar */}
        <div className="relative z-20 p-4 flex items-center justify-between text-white bg-gradient-to-b from-black/70 to-transparent">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-rose-500" />
            <span className="text-xs font-bold uppercase tracking-wider">YourBby Camera</span>
          </div>

          <div className="flex items-center gap-2">
            {!previewUrl && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-1.5 rounded-full ${isTorchOn ? 'bg-amber-400 text-black' : 'bg-black/50 hover:bg-black/70 text-white'}`}
                title="Torch / Flashlight"
              >
                {isTorchOn ? <Zap className="w-4 h-4 fill-black" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder / Preview Screen */}
        <div className="relative flex-1 w-full bg-black flex items-center justify-center overflow-hidden">
          {permissionError ? (
            <div className="p-6 text-center text-white space-y-4 max-w-xs">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <p className="text-xs font-medium text-slate-300 leading-relaxed">{permissionError}</p>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full px-4 py-2.5 bg-rose-500 hover:bg-rose-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-rose-500/20"
                >
                  <ImageIcon className="w-4 h-4" /> Choose from Device Gallery
                </button>
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-200"
                >
                  Retry Camera
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
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}

          {/* Hidden Gallery Input */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleGalleryFileSelect}
          />

          {/* Live Recording Indicator */}
          {isRecording && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-rose-600/90 text-white rounded-full text-xs font-bold font-mono flex items-center gap-2 animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              <span>0:{recordingSeconds < 10 ? `0${recordingSeconds}` : recordingSeconds}</span>
            </div>
          )}
        </div>

        {/* Bottom Control Rail */}
        <div className="relative z-20 p-5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center gap-4">
          {previewUrl ? (
            /* Confirm or Retake */
            <div className="flex items-center justify-center gap-6 w-full">
              <button
                onClick={handleRetake}
                className="px-5 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all"
              >
                Retake
              </button>
              <button
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-500/30 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" /> Use Media
              </button>
            </div>
          ) : (
            /* Live Shutter Controls */
            <div className="w-full flex items-center justify-between px-3">
              {/* Gallery Direct Access Button */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all flex items-center justify-center"
                title="Open Gallery / Photos"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Shutter Button */}
              {captureMode === 'photo' ? (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <div className="w-full h-full rounded-full bg-white" />
                </button>
              ) : isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-rose-500 p-2 flex items-center justify-center animate-pulse"
                >
                  <Square className="w-6 h-6 fill-rose-500 text-rose-500 rounded-sm" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-90 transition-transform"
                >
                  <div className="w-full h-full rounded-full bg-rose-500" />
                </button>
              )}

              {/* Switch Camera Button & Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={switchCamera}
                  className="p-3 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all"
                  title="Switch Camera"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setCaptureMode(captureMode === 'photo' ? 'video' : 'photo')}
                  className="px-3 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all"
                >
                  {captureMode === 'photo' ? 'Video' : 'Photo'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
