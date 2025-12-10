/**
 * Workspace Membership Service
 *
 * 워크스페이스 멤버십 검증 서비스
 *
 * 다른 도메인에서 재사용 가능:
 * - storage 도메인: Signed URL 권한 체크
 * - image-app-space 도메인: 이미지 접근 권한 체크
 */

import { DrizzleWorkspaceMemberRepository } from '../repositories/implementations/drizzle-workspace-member.repository';
import { WorkspaceId } from '../../shared/value-objects/workspace-id.vo';

/**
 * 워크스페이스 멤버십 검증
 *
 * Repository 레이어를 통해 멤버십 확인
 *
 * @param workspaceId - 워크스페이스 ID
 * @param userId - 사용자 ID
 * @returns 멤버 여부
 */
export async function isWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  try {
    const repository = new DrizzleWorkspaceMemberRepository();
    const workspaceIdVO = new WorkspaceId(workspaceId);

    return await repository.isMember(workspaceIdVO, userId);
  } catch (error) {
    console.error('[isWorkspaceMember] Error:', error);
    return false;
  }
}
