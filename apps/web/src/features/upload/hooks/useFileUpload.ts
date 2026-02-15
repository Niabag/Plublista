import { useState, useCallback, useRef } from 'react';
import { apiPost } from '@/lib/apiClient';
import { ALLOWED_FILE_TYPES, UPLOAD_LIMITS } from '@publista/shared';
import type { SubscriptionTier } from '@publista/shared';

interface PresignedUrlResponse {
  data: {
    presignedUrl: string;
    fileKey: string;
  };
}

interface UploadResult {
  fileKey: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

interface UploadError {
  code: string;
  message: string;
}

export interface FileUploadState {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  fileKey?: string;
}

export function useFileUpload(tier: SubscriptionTier = 'free') {
  const [uploads, setUploads] = useState<FileUploadState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const xhrRefs = useRef<Map<string, XMLHttpRequest>>(new Map());

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!ALLOWED_FILE_TYPES.includes(file.type as (typeof ALLOWED_FILE_TYPES)[number])) {
        return 'Unsupported file type. Allowed: MP4, MOV, WebM, JPG, PNG, WebP';
      }

      const limits = UPLOAD_LIMITS[tier];
      if (file.size > limits.maxFileSizeBytes) {
        return `File too large. Maximum size for your plan: ${limits.maxFileSizeMB}MB`;
      }

      return null;
    },
    [tier],
  );

  const uploadToR2 = useCallback(
    (presignedUrl: string, file: File): Promise<void> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRefs.current.set(file.name, xhr);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploads((prev) =>
              prev.map((u) => (u.file === file ? { ...u, progress } : u)),
            );
          }
        };

        xhr.onload = () => {
          xhrRefs.current.delete(file.name);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          xhrRefs.current.delete(file.name);
          reject(new Error('Upload failed. Please check your connection and try again.'));
        };

        xhr.open('PUT', presignedUrl);
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file);
      });
    },
    [],
  );

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult | null> => {
      const validationError = validateFile(file);
      if (validationError) {
        setUploads((prev) => [
          ...prev,
          { file, progress: 0, status: 'error', error: validationError },
        ]);
        return null;
      }

      // Add file to state as pending
      setUploads((prev) => [...prev, { file, progress: 0, status: 'pending' }]);
      setIsUploading(true);

      try {
        // Mark as uploading
        setUploads((prev) =>
          prev.map((u) => (u.file === file ? { ...u, status: 'uploading' } : u)),
        );

        // Request presigned URL
        const response = await apiPost<PresignedUrlResponse>('/api/upload/presigned-url', {
          fileName: file.name,
          contentType: file.type,
          fileSize: file.size,
        });

        const { presignedUrl, fileKey } = response.data;

        // Upload to R2
        await uploadToR2(presignedUrl, file);

        // Mark as complete
        setUploads((prev) =>
          prev.map((u) =>
            u.file === file ? { ...u, progress: 100, status: 'complete', fileKey } : u,
          ),
        );

        return {
          fileKey,
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
        };
      } catch (err) {
        const error = err as UploadError;
        const message = error.message || 'Upload failed. Please try again.';
        setUploads((prev) =>
          prev.map((u) => (u.file === file ? { ...u, status: 'error', error: message } : u)),
        );
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [validateFile, uploadToR2],
  );

  const removeUpload = useCallback((file: File) => {
    // Abort XHR if still in progress
    const xhr = xhrRefs.current.get(file.name);
    if (xhr) {
      xhr.abort();
      xhrRefs.current.delete(file.name);
    }
    setUploads((prev) => prev.filter((u) => u.file !== file));
  }, []);

  const clearUploads = useCallback(() => {
    // Abort all in-progress uploads
    for (const xhr of xhrRefs.current.values()) {
      xhr.abort();
    }
    xhrRefs.current.clear();
    setUploads([]);
    setIsUploading(false);
  }, []);

  const completedKeys = uploads
    .filter((u) => u.status === 'complete' && u.fileKey)
    .map((u) => u.fileKey!);

  return {
    uploads,
    isUploading,
    uploadFile,
    removeUpload,
    clearUploads,
    completedKeys,
  };
}
