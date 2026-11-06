import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  Upload,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCcw,
  Trash2,
  Check,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { uploadCoverPhotoFile } from '../../firebase/config.ts';
import { CameraCaptureModal } from '../camera/CameraCaptureModal.tsx';

interface CoverPhotoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCoverUrl?: string;
  defaultCoverUrl: string;
  onSuccess?: (message: string) => void;
}

const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 400;

export const CoverPhotoEditorModal: React.FC<CoverPhotoEditorModalProps> = ({
  isOpen,
  onClose,
  currentCoverUrl,
  defaultCoverUrl,
  onSuccess
}) => {
  const { currentUser, updateCurrentUserProfile } = useApp();

  const [sourceImageSrc, setSourceImageSrc] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loadedImageRef = useRef<HTMLImageElement | null>(null);

  const hasCustomCover = Boolean(
    currentCoverUrl &&
      currentCoverUrl.trim() !== '' &&
      currentCoverUrl !== defaultCoverUrl
  );

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('[CoverPhotoFlow] Step 1b: CoverPhotoEditorModal opened');
      setSourceImageSrc(null);
      setNaturalSize(null);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsUploading(false);
      setUploadProgress(0);
      setErrorMessage(null);
      setConfirmingRemove(false);
    }
  }, [isOpen]);

  const loadSelectedImage = useCallback((dataUrl: string) => {
    setErrorMessage(null);
    setConfirmingRemove(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      loadedImageRef.current = img;
      const w = img.naturalWidth || 1200;
      const h = img.naturalHeight || 400;
      console.log('[CoverPhotoFlow] Step 2: Image loaded into preview ->', { width: w, height: h });
      setNaturalSize({ width: w, height: h });
      setSourceImageSrc(dataUrl);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    img.onerror = () => {
      setErrorMessage('Could not load the selected image. Please choose a valid JPG, PNG, or WebP image.');
    };
    img.src = dataUrl;
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    console.log('[CoverPhotoFlow] Step 2a: Gallery file selected ->', {
      name: file.name,
      type: file.type,
      sizeBytes: file.size
    });

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 18 * 1024 * 1024) {
      setErrorMessage('Image file is too large (max 18 MB). Please select a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        loadSelectedImage(result);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image from device storage.');
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = (mediaUrl: string) => {
    setIsCameraOpen(false);
    if (mediaUrl) {
      loadSelectedImage(mediaUrl);
    }
  };

  // Pointer drag handlers for repositioning
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sourceImageSrc || isUploading) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !sourceImageSrc) return;
    const nextX = e.clientX - dragStart.x;
    const nextY = e.clientY - dragStart.y;
    // Clamp pan within reasonable bounds so image stays inside frame
    const maxPanX = 360 * zoom;
    const maxPanY = 260 * zoom;
    setPan({
      x: Math.max(-maxPanX, Math.min(maxPanX, nextX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, nextY))
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {}
      setIsDragging(false);
    }
  };

  // Render cropped 1200x400 cover photo via HTML5 Canvas
  const renderCroppedCoverBlob = async (): Promise<{ blob: Blob; dataUrl: string }> => {
    const img = loadedImageRef.current;
    if (!img || !naturalSize) {
      throw new Error('No cover image selected for cropping.');
    }

    const canvas = document.createElement('canvas');
    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context unavailable in this browser.');
    }

    // Dark navy base background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, TARGET_WIDTH, TARGET_HEIGHT);

    // Compute base "cover" scale so the image fills 1200x400 at zoom=1
    const scaleX = TARGET_WIDTH / naturalSize.width;
    const scaleY = TARGET_HEIGHT / naturalSize.height;
    const baseScale = Math.max(scaleX, scaleY);
    const finalScale = baseScale * zoom;

    const drawWidth = naturalSize.width * finalScale;
    const drawHeight = naturalSize.height * finalScale;

    // Map UI container pan pixels proportionally to the 1200x400 target canvas
    const containerWidth = containerRef.current?.clientWidth || 600;
    const ratioToTarget = TARGET_WIDTH / containerWidth;

    const drawX = (TARGET_WIDTH - drawWidth) / 2 + pan.x * ratioToTarget;
    const drawY = (TARGET_HEIGHT - drawHeight) / 2 + pan.y * ratioToTarget;

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    let chosenQuality = 0.82;
    let dataUrl = canvas.toDataURL('image/jpeg', chosenQuality);
    const qualities = [0.7, 0.58, 0.45];
    for (const q of qualities) {
      if (dataUrl.length <= 200000) break;
      chosenQuality = q;
      dataUrl = canvas.toDataURL('image/jpeg', chosenQuality);
    }

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to encode cropped cover photo.'));
        },
        'image/jpeg',
        chosenQuality
      );
    });

    return { blob, dataUrl };
  };

  const handleSaveCoverPhoto = async () => {
    if (!currentUser) {
      setErrorMessage('You must be signed in to update your cover photo.');
      return;
    }
    if (!sourceImageSrc) {
      setErrorMessage('Please select or capture a cover photo first.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);
    setErrorMessage(null);

    try {
      // 1. Render cropped, repositioned & zoomed cover image as binary JPEG Blob
      const { blob } = await renderCroppedCoverBlob();
      console.log('[CoverPhotoFlow] Step 3: Cropped 1200x400 JPEG Blob generated ->', {
        sizeBytes: blob.size,
        type: blob.type
      });
      setUploadProgress(20);

      // 2. Upload binary Blob to Firebase Storage (or binary /api/media/cover endpoint) and obtain real download URL
      const fileName = `cover_${currentUser.id}_${Date.now()}.jpg`;
      const downloadUrl = await uploadCoverPhotoFile(
        blob,
        currentUser.id,
        fileName,
        (pct) => {
          setUploadProgress(20 + Math.round((pct / 100) * 65));
        }
      );

      setUploadProgress(90);
      console.log('[CoverPhotoFlow] Step 6: Saving downloadUrl to Firestore coverPhotoURL ->', downloadUrl);

      // 3. Persist downloadUrl in Firestore user profile document under dedicated coverPhotoURL field
      //    Strictly updates ONLY coverPhotoURL & coverPhoto — NEVER touches currentUser.avatar!
      await updateCurrentUserProfile({
        coverPhotoURL: downloadUrl,
        coverPhoto: downloadUrl
      });

      setUploadProgress(100);
      console.log('[CoverPhotoFlow] Step 7: Firestore update verified & profile refreshed');
      onSuccess?.('Cover photo uploaded and saved to your profile!');
      onClose();
    } catch (err: any) {
      console.error('[CoverPhotoFlow] Cover photo save FAILED:', err);
      setErrorMessage(err?.message || 'Failed to upload and save cover photo. Please retry.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmRemoveCover = async () => {
    if (!currentUser) return;
    setIsUploading(true);
    setUploadProgress(30);
    setErrorMessage(null);

    try {
      // Clear coverPhotoURL and coverPhoto without touching avatar
      await updateCurrentUserProfile({
        coverPhotoURL: '',
        coverPhoto: ''
      });
      setUploadProgress(100);
      setConfirmingRemove(false);
      onSuccess?.('Cover photo removed.');
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to remove cover photo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-4">
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-900/80">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  Edit Cover Photo
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select, reposition, zoom, and save your profile cover banner
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="p-2 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Hidden File Input for Gallery / File Picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="p-5 space-y-4">
            {/* Error Banner with Retry */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                {sourceImageSrc && !isUploading && (
                  <button
                    type="button"
                    onClick={handleSaveCoverPhoto}
                    className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry</span>
                  </button>
                )}
              </div>
            )}

            {/* Source Selection Buttons: Gallery & Camera */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm disabled:opacity-50 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>{sourceImageSrc ? 'Choose Another Photo' : 'Select from Gallery'}</span>
                </button>

                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsCameraOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  <Camera className="w-4 h-4 text-rose-500" />
                  <span>Take Photo</span>
                </button>
              </div>

              {hasCustomCover && !confirmingRemove && (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setConfirmingRemove(true)}
                  className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Cover</span>
                </button>
              )}
            </div>

            {/* Confirmation Dialog Before Removing Cover Photo */}
            {confirmingRemove && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Remove your current cover photo?
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Your profile will revert to the default YourBby gradient banner. Your profile picture will not be affected.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={handleConfirmRemoveCover}
                    className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    <span>Yes, Remove Cover</span>
                  </button>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => setConfirmingRemove(false)}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Interactive 3:1 Cover Preview & Crop Viewport */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-bold uppercase tracking-wider">
                  {sourceImageSrc ? 'Interactive Crop & Reposition Preview (3:1 Banner)' : 'Current Cover Photo'}
                </span>
                {sourceImageSrc && (
                  <span className="flex items-center gap-1 text-rose-500 font-semibold">
                    <Move className="w-3.5 h-3.5" /> Drag image to reposition
                  </span>
                )}
              </div>

              <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                className={`relative w-full aspect-[3/1] rounded-2xl overflow-hidden bg-slate-950 border-2 ${
                  sourceImageSrc
                    ? 'border-rose-500/60 cursor-grab active:cursor-grabbing touch-none select-none'
                    : 'border-slate-200 dark:border-slate-800'
                } shadow-inner`}
              >
                {sourceImageSrc ? (
                  <>
                    <img
                      src={sourceImageSrc}
                      alt="Cover crop preview"
                      draggable={false}
                      style={{
                        transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
                        transformOrigin: 'center center'
                      }}
                      className="w-full h-full object-cover pointer-events-none transition-transform duration-75"
                    />
                    {/* Rule-of-thirds alignment grid overlay */}
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                      <div className="border-r border-b border-white/20" />
                      <div className="border-r border-b border-white/20" />
                      <div className="border-b border-white/20" />
                      <div className="border-r border-b border-white/20" />
                      <div className="border-r border-b border-white/20" />
                      <div className="border-b border-white/20" />
                      <div className="border-r border-white/20" />
                      <div className="border-r border-white/20" />
                      <div />
                    </div>
                  </>
                ) : (
                  <img
                    src={currentCoverUrl || defaultCoverUrl}
                    alt="Current cover"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Avatar position guide overlay (shows where avatar overlaps without altering avatar) */}
                <div className="absolute bottom-2 left-4 flex items-center gap-2 pointer-events-none opacity-85">
                  <img
                    src={currentUser?.avatar}
                    alt={currentUser?.displayName}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-white dark:ring-slate-900 shadow-lg"
                  />
                  <span className="px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-semibold backdrop-blur-xs">
                    Profile photo preview (unchanged)
                  </span>
                </div>
              </div>
            </div>

            {/* Zoom & Reset Controls when a new image is loaded */}
            {sourceImageSrc && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                  <button
                    type="button"
                    onClick={() => setZoom(z => Math.max(1, Number((z - 0.15).toFixed(2))))}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 accent-rose-500 cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setZoom(z => Math.min(3, Number((z + 0.15).toFixed(2))))}
                    className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300 w-12 text-right">
                    {Math.round(zoom * 100)}%
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setPan({ x: 0, y: 0 });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 hover:text-rose-500"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Crop</span>
                </button>
              </div>
            )}

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                    <span>Uploading to Firebase Storage & saving to Firestore...</span>
                  </span>
                  <span className="font-mono text-rose-500">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Footer: Save & Cancel */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isUploading}
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!sourceImageSrc || isUploading}
                onClick={handleSaveCoverPhoto}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-500/20 disabled:opacity-40 transition-all"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Cover...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Cover Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Capture Modal for snapping a Cover Photo */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
        mode="photo"
      />
    </>
  );
};
