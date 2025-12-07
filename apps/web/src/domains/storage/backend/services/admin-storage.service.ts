/**
 * Admin Storage Service
 *
 * Storage 파일 접근을 위한 Signed URL 생성
 *
 * ⚠️ 주의: 이 서비스는 권한 체크를 수행하지 않습니다.
 * 호출하는 상위 레이어(Action Layer)에서 이미 권한 체크를 완료한 상태에서만 호출해야 합니다.
 *
 * 의존성:
 * - utils/supabase: supabaseAdmin (Singleton)
 */

import { supabaseAdmin } from '@/utils/supabase/server';

/**
 * Admin Storage Service
 *
 * Admin Client를 사용하여 Storage RLS를 우회합니다.
 *
 * ⚠️ 주의: 이 서비스는 권한 체크를 수행하지 않습니다.
 * 호출하는 상위 레이어(Action Layer)에서 이미 권한 체크를 완료한 상태에서만 호출해야 합니다.
 *
 * 레이어 구조:
 * - Service Layer (이 파일)
 * - Infrastructure Layer (utils/supabase/server - supabaseAdmin)
 */
export class AdminStorageService {
  /**
   * 이미지 자산 Signed URL 생성
   *
   * ⚠️ 주의: 이 메서드는 권한 체크를 수행하지 않습니다.
   * 호출하는 상위 레이어에서 이미 권한 체크를 완료한 상태에서만 호출해야 합니다.
   *
   * @param storagePath - Storage 경로
   * @param workspaceId - 워크스페이스 ID (로깅/디버깅용)
   * @param userId - 요청 사용자 ID (로깅/디버깅용)
   * @param isPublic - 공개 이미지 여부 (로깅/디버깅용)
   * @returns Signed URL (24시간 유효)
   */
  async createImageSignedUrl(
    storagePath: string,
    workspaceId: string,
    userId: string,
    isPublic: boolean
  ): Promise<string> {
    // Signed URL 생성 (Admin Client - RLS 우회)
    const { data, error } = await supabaseAdmin.storage
      .from('image-assets')
      .createSignedUrl(storagePath, 86400); // ✅ 24시간 (1시간 → 24시간)

    if (error) {
      console.error('[AdminStorageService] Error creating signed URL:', error);
      throw new Error(`Failed to create signed URL: ${error.message}`);
    }

    if (!data?.signedUrl) {
      throw new Error('No signed URL returned from Supabase');
    }

    return data.signedUrl;
  }

  /**
   * 파일 삭제 (Admin 권한)
   *
   * @param bucket - 버킷 이름
   * @param path - Storage 경로
   */
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await supabaseAdmin.storage.from(bucket).remove([path]);

    if (error) {
      console.error('[AdminStorageService] Error deleting file:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }
}
