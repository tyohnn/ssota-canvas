'use client';

import { useCallback } from 'react';

import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

export interface DriveAssetUploadResult {
  path: string;
  url: string;
  initialProperties: Record<string, unknown>;
}

export interface UseDriveAssetUploadParams {
  orgId: string;
}

export interface UploadContext {
  workspaceId: string;
}

export function useDriveAssetUpload({ orgId }: UseDriveAssetUploadParams) {
  const { upload, isUploading } = useSupabaseStorage();

  const uploadForPdf = useCallback(
    async (
      file: File,
      context: UploadContext
    ): Promise<DriveAssetUploadResult> => {
      const result = await upload({
        bucket: StorageBucket.CANVAS_ASSETS,
        file,
        orgId,
        workspaceId: context.workspaceId,
      });

      const accessUrlExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();

      return {
        path: result.path,
        url: result.url,
        initialProperties: {
          pathUrl: result.path,
          accessUrl: result.url,
          accessUrlExpiresAt,
          filename: file.name,
        },
      };
    },
    [upload, orgId]
  );

  const uploadForImage = useCallback(
    async (
      file: File,
      context: UploadContext
    ): Promise<DriveAssetUploadResult> => {
      const result = await upload({
        bucket: StorageBucket.CANVAS_ASSETS,
        file,
        orgId,
        workspaceId: context.workspaceId,
      });

      return {
        path: result.path,
        url: result.url,
        initialProperties: {
          imageUrl: result.url,
          imageSource: 'user-upload',
          objectFit: 'contain',
        },
      };
    },
    [upload, orgId]
  );

  const uploadForAudio = useCallback(
    async (
      file: File,
      context: UploadContext
    ): Promise<DriveAssetUploadResult> => {
      const result = await upload({
        bucket: StorageBucket.CANVAS_ASSETS,
        file,
        orgId,
        workspaceId: context.workspaceId,
      });

      const accessUrlExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ).toISOString();

      return {
        path: result.path,
        url: result.url,
        initialProperties: {
          pathUrl: result.path,
          accessUrl: result.url,
          accessUrlExpiresAt,
          filename: file.name,
          fileSize: file.size,
        },
      };
    },
    [upload, orgId]
  );

  return {
    uploadForPdf,
    uploadForImage,
    uploadForAudio,
    isUploading,
  };
}
