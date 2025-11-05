/**
 * Storage Service
 *
 * 파일 스토리지 관련 비즈니스 로직
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { StorageBucket } from '../../types/storage.types';

export interface RefreshUrlResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class StorageService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Signed URL이 만료된 경우 새로운 URL을 생성
   *
   * @param path - Storage path
   * @param bucket - Storage bucket
   * @param expiresIn - Expiration time in seconds (default: 1 year)
   * @returns 새로운 signed URL
   */
  async refreshSignedUrl(
    path: string,
    bucket: StorageBucket = StorageBucket.CANVAS_ASSETS,
    expiresIn: number = 31536000 // 1 year
  ): Promise<RefreshUrlResult> {
    try {
      const { data: signedUrlData, error: signedUrlError } =
        await this.supabase.storage
          .from(bucket)
          .createSignedUrl(path, expiresIn);

      if (signedUrlError || !signedUrlData) {
        console.error('Failed to create signed URL:', signedUrlError);
        return {
          success: false,
          error: 'Failed to create new signed URL',
        };
      }

      return {
        success: true,
        url: signedUrlData.signedUrl,
      };
    } catch (error) {
      console.error('Error in refreshSignedUrl:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Supabase Storage URL에서 path를 추출
   *
   * @param url - Supabase storage URL (signed or public)
   * @returns Extracted path or null
   */
  extractPathFromUrl(url: string): string | null {
    try {
      // Blob URL인 경우 (개발 시 사용될 수 있음)
      if (url.startsWith('blob:')) {
        return null;
      }

      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Signed URL: /storage/v1/object/sign/{bucket}/{path}
      const signedMatch = pathname.match(
        /\/storage\/v1\/object\/sign\/[^/]+\/(.+)/
      );
      if (signedMatch && signedMatch[1]) {
        return signedMatch[1];
      }

      // Public URL: /storage/v1/object/public/{bucket}/{path}
      const publicMatch = pathname.match(
        /\/storage\/v1\/object\/public\/[^/]+\/(.+)/
      );
      if (publicMatch && publicMatch[1]) {
        return publicMatch[1];
      }

      return null;
    } catch (error) {
      console.error('Failed to parse URL:', error);
      return null;
    }
  }

  /**
   * 파일 삭제
   *
   * @param bucket - Storage bucket
   * @param path - File path
   */
  async deleteFile(bucket: StorageBucket, path: string): Promise<void> {
    const { error } = await this.supabase.storage.from(bucket).remove([path]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}
