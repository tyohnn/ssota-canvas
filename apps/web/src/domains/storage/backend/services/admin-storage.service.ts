/**
 * Admin Storage Service
 *
 * Storage 파일 접근을 위한 Signed URL 생성
 * 비즈니스 로직으로 권한 체크
 *
 * 의존성:
 * - utils/supabase: supabaseAdmin (Singleton)
 * - workspace-management: isWorkspaceMember()
 */

import { supabaseAdmin } from '@/utils/supabase/server';
import { isWorkspaceMember } from '@/domains/workspace-management/backend/services/workspace-membership.service';

/**
 * Admin Storage Service
 *
 * Admin Client를 사용하여 Storage RLS를 우회하고
 * 비즈니스 로직으로 권한을 체크합니다
 *
 * 레이어 구조:
 * - Service Layer (이 파일)
 * - Infrastructure Layer (utils/supabase/server - supabaseAdmin)
 */
export class AdminStorageService {
  /**
   * 이미지 자산 Signed URL 생성
   *
   * 의존성:
   * - workspace-management: isWorkspaceMember()
   *
   * @param storagePath - Storage 경로
   * @param workspaceId - 워크스페이스 ID
   * @param userId - 요청 사용자 ID
   * @param isPublic - 공개 이미지 여부
   * @returns Signed URL (1시간 유효)
   */
  async createImageSignedUrl(
    storagePath: string,
    workspaceId: string,
    userId: string,
    isPublic: boolean
  ): Promise<string> {
    // 권한 체크 (비즈니스 로직)
    const hasAccess =
      isPublic || (await isWorkspaceMember(workspaceId, userId));

    if (!hasAccess) {
      throw new Error('Access denied to image');
    }

    // Signed URL 생성 (Admin Client - RLS 우회)
    const { data, error } = await supabaseAdmin.storage
      .from('image-assets')
      .createSignedUrl(storagePath, 3600); // 1시간

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
