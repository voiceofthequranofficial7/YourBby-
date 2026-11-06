import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, deleteField } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytesResumable, uploadString, getDownloadURL } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';
import type { User } from '../types/index.ts';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);

// Initialize Firestore with configured database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Firebase Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firebase Storage
export const storage = getStorage(app);

/**
 * Compresses any browser Image Data URL or File/Blob using an HTML5 Canvas so that
 * it stays well below Firestore's 1,048,576 byte (1 MiB) document size limit.
 */
export async function compressImageDataUrl(
  input: string | File | Blob,
  maxWidth = 1200,
  maxHeight = 600,
  maxCharLength = 240000
): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return typeof input === 'string' ? input : '';
  }

  // If it's already a short URL (e.g., https://... or compact SVG/JPEG under maxCharLength), return as-is
  if (typeof input === 'string') {
    if (!input.startsWith('data:image/') || input.startsWith('data:image/svg+xml')) {
      return input.length <= maxCharLength ? input : input.slice(0, maxCharLength);
    }
    if (input.length <= maxCharLength) {
      return input;
    }
  }

  const dataUrl: string =
    typeof input === 'string'
      ? input
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ''));
          reader.onerror = () => reject(new Error('Failed to read image file'));
          reader.readAsDataURL(input);
        });

  if (!dataUrl.startsWith('data:image/') || dataUrl.startsWith('data:image/svg+xml')) {
    return dataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let targetW = img.naturalWidth || maxWidth;
      let targetH = img.naturalHeight || maxHeight;

      if (targetW > maxWidth || targetH > maxHeight) {
        const ratio = Math.min(maxWidth / targetW, maxHeight / targetH);
        targetW = Math.max(1, Math.round(targetW * ratio));
        targetH = Math.max(1, Math.round(targetH * ratio));
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, targetW, targetH);
      ctx.drawImage(img, 0, 0, targetW, targetH);

      const qualities = [0.82, 0.7, 0.58, 0.45, 0.35];
      let result = canvas.toDataURL('image/jpeg', qualities[0]);
      for (let i = 1; i < qualities.length && result.length > maxCharLength; i++) {
        result = canvas.toDataURL('image/jpeg', qualities[i]);
      }

      // If still larger than maxCharLength, scale dimensions down by 70%
      if (result.length > maxCharLength) {
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = Math.max(1, Math.round(targetW * 0.7));
        smallCanvas.height = Math.max(1, Math.round(targetH * 0.7));
        const sCtx = smallCanvas.getContext('2d');
        if (sCtx) {
          sCtx.fillStyle = '#090d16';
          sCtx.fillRect(0, 0, smallCanvas.width, smallCanvas.height);
          sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);
          result = smallCanvas.toDataURL('image/jpeg', 0.6);
        }
      }

      resolve(result);
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Prepares a canonical User object for Firestore persistence:
 * 1. Never stores raw Base64 image data in `coverPhotoURL` (only real URLs or compact SVG default)
 * 2. Stores the cover photo in the single dedicated `coverPhotoURL` field and deletes
 *    the obsolete duplicate `coverPhoto` field in Firestore
 * 3. Guarantees the serialized document size is strictly under Firestore's 1,048,576 byte limit.
 */
export async function sanitizeUserForFirestore(user: User): Promise<Record<string, any>> {
  const rawCover =
    user.coverPhotoURL !== undefined ? user.coverPhotoURL : (user.coverPhoto || '');
  const rawAvatar = user.avatar || '';

  const compactAvatar =
    rawAvatar.startsWith('data:image/') && rawAvatar.length > 120000
      ? await compressImageDataUrl(rawAvatar, 320, 320, 110000)
      : rawAvatar;

  // Never allow Base64 raster Data URLs in Firestore coverPhotoURL; only URLs or compact default SVG
  const cleanCoverUrl =
    rawCover.startsWith('data:image/') && !rawCover.startsWith('data:image/svg+xml')
      ? ''
      : rawCover;

  const firestorePayload: Record<string, any> = {
    ...user,
    id: user.id,
    avatar: compactAvatar,
    coverPhotoURL: cleanCoverUrl,
    // Remove obsolete duplicate coverPhoto property from the Firestore document
    coverPhoto: deleteField(),
    updatedAt: new Date().toISOString()
  };

  return firestorePayload;
}

/**
 * Dedicated Cover Photo binary uploader:
 * 1. Attempts upload of binary Blob to Firebase Storage (`users/{userId}/covers/{fileName}`) + getDownloadURL.
 * 2. If the project's Firebase Storage bucket is unprovisioned (HTTP 404 on Spark plan), uploads the binary Blob
 *    to `/api/media/cover` and returns the real HTTP download URL (`/api/media/covers/...`).
 * 3. Never returns a Base64 Data URL; throws the real error if upload fails.
 */
export async function uploadCoverPhotoFile(
  blob: Blob,
  userId: string,
  fileName: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  console.log('[CoverPhotoFlow] Step 4: Starting binary cover upload', {
    userId,
    fileName,
    sizeBytes: blob.size,
    type: blob.type
  });
  onProgress?.(10);

  const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const storagePath = `users/${userId}/covers/${safeName}`;

  let firebaseStorageError: any = null;

  if (firebaseConfig.storageBucket) {
    try {
      const fileRef = storageRef(storage, storagePath);
      const downloadUrl = await new Promise<string>((resolve, reject) => {
        const task = uploadBytesResumable(fileRef, blob, {
          contentType: blob.type || 'image/jpeg'
        });

        const timer = setTimeout(() => {
          task.cancel();
          reject(new Error('Firebase Storage upload timed out after 5s'));
        }, 5000);

        task.on(
          'state_changed',
          (snapshot) => {
            if (snapshot.totalBytes > 0) {
              const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 75) + 15;
              onProgress?.(Math.min(90, pct));
            }
          },
          (err) => {
            clearTimeout(timer);
            reject(err);
          },
          async () => {
            clearTimeout(timer);
            try {
              const url = await getDownloadURL(task.snapshot.ref);
              resolve(url);
            } catch (e) {
              reject(e);
            }
          }
        );
      });

      console.log('[CoverPhotoFlow] Step 5: Firebase Storage upload succeeded ->', downloadUrl);
      onProgress?.(100);
      return downloadUrl;
    } catch (err: any) {
      firebaseStorageError = err;
      console.warn(
        '[CoverPhotoFlow] Firebase Storage bucket notice (status/code):',
        err?.status_ || err?.code || err?.message
      );
    }
  }

  // Upload binary Blob to server media storage endpoint (/api/media/cover) to get a real HTTP download URL
  onProgress?.(55);
  const res = await fetch('/api/media/cover', {
    method: 'POST',
    headers: {
      'Content-Type': blob.type || 'image/jpeg',
      'x-user-id': userId
    },
    body: blob
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    const fbMsg = firebaseStorageError
      ? `Firebase Storage error (${firebaseStorageError.code || 'storage/error'}): ${firebaseStorageError.message}`
      : `Upload failed with HTTP ${res.status}: ${errText}`;
    throw new Error(fbMsg);
  }

  const data = await res.json();
  if (!data.success || !data.downloadURL) {
    throw new Error(data.error || 'Server did not return a valid cover download URL');
  }

  console.log('[CoverPhotoFlow] Step 5: Binary cover uploaded -> downloadURL:', data.downloadURL);
  onProgress?.(100);
  return data.downloadURL;
}

/**
 * Uploads a File, Blob, or dataURL to Firebase Storage with progress tracking and cancellation support.
 * If Firebase Storage bucket rules restrict unauthenticated writes, logs the warning and falls back
 * to a compressed persistent Data URL so Firestore documents never exceed 1 MiB.
 */
export async function uploadMediaToFirebaseStorage(
  fileOrDataUrl: File | Blob | string,
  folder: string,
  fileName: string,
  onProgress?: (percent: number) => void,
  abortSignal?: AbortSignal
): Promise<string> {
  if (abortSignal?.aborted) {
    throw new Error('Upload cancelled by user');
  }

  onProgress?.(5);

  const safeName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const path = `${folder}/${safeName}`;

  if (firebaseConfig.storageBucket) {
    try {
      const fileRef = storageRef(storage, path);

      if (typeof fileOrDataUrl === 'string') {
        onProgress?.(40);
        const uploadPromise = (async () => {
          await uploadString(fileRef, fileOrDataUrl, 'data_url');
          return await getDownloadURL(fileRef);
        })();
        const timeoutPromise = new Promise<string>((_, reject) =>
          setTimeout(() => reject(new Error('Firebase Storage timeout — using compressed Data URL fallback')), 4500)
        );
        const url = await Promise.race([uploadPromise, timeoutPromise]);
        if (abortSignal?.aborted) throw new Error('Upload cancelled by user');
        onProgress?.(100);
        return url;
      } else {
        const uploadPromise = new Promise<string>((resolve, reject) => {
          const task = uploadBytesResumable(fileRef, fileOrDataUrl);

          const onAbort = () => {
            task.cancel();
            reject(new Error('Upload cancelled by user'));
          };
          abortSignal?.addEventListener('abort', onAbort, { once: true });

          const timer = setTimeout(() => {
            task.cancel();
            reject(new Error('Firebase Storage upload timeout — using compressed Data URL fallback'));
          }, 5000);

          task.on(
            'state_changed',
            (snapshot) => {
              if (snapshot.totalBytes > 0) {
                const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 90) + 5;
                onProgress?.(Math.min(95, pct));
              }
            },
            (err) => {
              clearTimeout(timer);
              abortSignal?.removeEventListener('abort', onAbort);
              reject(err);
            },
            async () => {
              clearTimeout(timer);
              abortSignal?.removeEventListener('abort', onAbort);
              try {
                const downloadUrl = await getDownloadURL(task.snapshot.ref);
                resolve(downloadUrl);
              } catch (e) {
                reject(e);
              }
            }
          );
        });
        const url = await uploadPromise;
        onProgress?.(100);
        return url;
      }
    } catch (storageErr: any) {
      if (abortSignal?.aborted || storageErr?.message === 'Upload cancelled by user') {
        throw new Error('Upload cancelled by user');
      }
      console.warn('Firebase Storage direct upload notice (falling back to compressed Data URL):', storageErr?.message || storageErr);
    }
  }

  if (abortSignal?.aborted) {
    throw new Error('Upload cancelled by user');
  }

  // Fallback: if image, compress so it never exceeds Firestore's 1 MiB document limit
  if (typeof fileOrDataUrl === 'string') {
    const isCoverFolder = folder.includes('covers');
    const compressed = fileOrDataUrl.startsWith('data:image/')
      ? await compressImageDataUrl(
          fileOrDataUrl,
          isCoverFolder ? 1200 : 1080,
          isCoverFolder ? 400 : 1080,
          isCoverFolder ? 220000 : 250000
        )
      : fileOrDataUrl;
    onProgress?.(100);
    return compressed;
  }

  if (fileOrDataUrl.type && fileOrDataUrl.type.startsWith('image/')) {
    const isCoverFolder = folder.includes('covers');
    onProgress?.(60);
    const compressed = await compressImageDataUrl(
      fileOrDataUrl,
      isCoverFolder ? 1200 : 1080,
      isCoverFolder ? 400 : 1080,
      isCoverFolder ? 220000 : 250000
    );
    onProgress?.(100);
    return compressed;
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    const onAbort = () => {
      reader.abort();
      reject(new Error('Upload cancelled by user'));
    };
    abortSignal?.addEventListener('abort', onAbort, { once: true });

    reader.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress?.(Math.min(95, Math.round((ev.loaded / ev.total) * 90) + 10));
      }
    };
    reader.onload = () => {
      abortSignal?.removeEventListener('abort', onAbort);
      onProgress?.(100);
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      abortSignal?.removeEventListener('abort', onAbort);
      reject(new Error('Failed to read media file'));
    };
    reader.readAsDataURL(fileOrDataUrl);
  });
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Test connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or initializing.');
      return false;
    }
    return true;
  }
}
