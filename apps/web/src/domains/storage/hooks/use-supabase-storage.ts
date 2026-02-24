/**
 * useSupabaseStorage Hook
 *
 * Supabase Storage 파일 업로드/삭제/접근을 위한 훅
 */

'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/browser';
import {
  UploadOptions,
  UploadResult,
  StorageBucket,
  StorageError,
} from '../types/storage.types';
import { validateFile } from '../lib/validation';
import { generateCanvasAssetPath } from '../lib/path-generator';

export function useSupabaseStorage() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<StorageError | null>(null);

  const supabase = createClient();

  const upload = useCallback(
    async (options: UploadOptions): Promise<UploadResult> => {
      const {
        bucket,
        file,
        path: providedPath,
        onProgress,
        orgId,
        workspaceId,
      } = options;

      setIsUploading(true);
      setError(null);
      setProgress(0);

      try {
        // 1. Validate file
        validateFile(file);
        setProgress(10);

        // 2. Generate path (if not provided)
        let path = providedPath;
        if (!path) {
          if (
            bucket === StorageBucket.CANVAS_ASSETS &&
            orgId &&
            workspaceId
          ) {
            path = generateCanvasAssetPath({
              orgId,
              workspaceId,
              fileName: file.name,
            });
          } else {
            // Fallback: temp folder (e.g. clipboard paste without context)
            const timestamp = Date.now();
            const uuid = crypto.randomUUID();
            const ext = file.name.split('.').pop() || '';
            path = `temp/${timestamp}-${uuid}.${ext}`;
            console.warn('Path not provided, using temp path:', path);
          }
        }

        setProgress(30);
        if (onProgress) onProgress(30);

        // 3. Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        setProgress(70);
        if (onProgress) onProgress(70);

        // 4. Get URLs
        let url: string;
        let publicUrl: string | undefined;

        if (bucket === StorageBucket.USER_AVATARS) {
          // Public bucket
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);
          url = publicUrlData.publicUrl;
          publicUrl = publicUrlData.publicUrl;
        } else {
          // Private bucket - 1 day expiry (보안·워크스페이스 권한 회수 대응)
          const ONE_DAY_IN_SECONDS = 86400;
          const { data: signedUrlData, error: signedUrlError } =
            await supabase.storage
              .from(bucket)
              .createSignedUrl(path, ONE_DAY_IN_SECONDS);

          if (signedUrlError) {
            throw signedUrlError;
          }

          url = signedUrlData.signedUrl;
        }

        setProgress(100);
        if (onProgress) onProgress(100);

        return {
          url,
          path,
          publicUrl,
          size: file.size,
          mimeType: file.type,
        };
      } catch (err: any) {
        const storageError: StorageError = {
          code: err.code || 'UNKNOWN_ERROR',
          message: err.message || '파일 업로드에 실패했습니다.',
          details: err,
        };
        setError(storageError);
        throw storageError;
      } finally {
        setIsUploading(false);
      }
    },
    [supabase]
  );

  const deleteFile = useCallback(
    async (bucket: StorageBucket, path: string): Promise<void> => {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        throw error;
      }
    },
    [supabase]
  );

  const getSignedUrl = useCallback(
    async (
      bucket: StorageBucket,
      path: string,
      expiresIn: number = 31536000 // 1 year default
    ): Promise<string> => {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw error;
      }

      return data.signedUrl;
    },
    [supabase]
  );

  const getPublicUrl = useCallback(
    (bucket: StorageBucket, path: string): string => {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl;
    },
    [supabase]
  );

  return {
    upload,
    deleteFile,
    getSignedUrl,
    getPublicUrl,
    isUploading,
    progress,
    error,
  };
}
