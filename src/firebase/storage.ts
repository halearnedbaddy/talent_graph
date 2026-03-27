'use client';

import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import type { FirebaseApp } from 'firebase/app';

export function getFirebaseStorage(app: FirebaseApp) {
  return getStorage(app);
}

export interface UploadProgress {
  progress: number; // 0-100
  state: 'running' | 'paused' | 'success' | 'error';
  downloadUrl?: string;
  error?: string;
}

/**
 * Compresses and resizes an image file to a target size using the Canvas API.
 * Returns a Blob of the compressed image.
 */
export async function compressImage(
  file: File,
  maxDimension = 600,
  quality = 0.82
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > height) {
        if (width > maxDimension) { height = Math.round((height * maxDimension) / width); width = maxDimension; }
      } else {
        if (height > maxDimension) { width = Math.round((width * maxDimension) / height); height = maxDimension; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => { if (blob) resolve(blob); else reject(new Error('Canvas compression failed')); },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not load image')); };
    img.src = url;
  });
}

/**
 * Uploads a file to Firebase Storage and reports progress via callback.
 * Returns a promise that resolves with the download URL.
 */
export function uploadFileWithProgress(
  app: FirebaseApp,
  storagePath: string,
  file: File | Blob,
  onProgress: (progress: UploadProgress) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const storage = getFirebaseStorage(app);
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      snapshot => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        onProgress({ progress, state: 'running' });
      },
      error => {
        onProgress({ progress: 0, state: 'error', error: error.message });
        reject(error);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        onProgress({ progress: 100, state: 'success', downloadUrl });
        resolve(downloadUrl);
      }
    );
  });
}
