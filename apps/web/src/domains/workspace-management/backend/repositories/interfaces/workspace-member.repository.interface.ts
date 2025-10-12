// apps/web/src/domains/workspace-management/backend/repositories/interfaces/workspace-member.repository.interface.ts

import { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';

/**
 * Workspace Member Repository Interface
 *
 * Workspace 멤버십 데이터 영속성 담당
 * Note: role은 organization_members에서 관리 (권한 단일화)
 */
export interface WorkspaceMemberRepository {
  /**
   * Workspace 멤버십 확인 (초대 여부만)
   *
   * @param workspaceId - Workspace ID
   * @param userId - 사용자 ID
   * @returns 멤버 여부 (초대 여부)
   */
  isMember(workspaceId: WorkspaceId, userId: string): Promise<boolean>;

  /**
   * Workspace 멤버 추가 (초대)
   *
   * ⚠️ 주의: Service Layer에서 조직 admin 이상 권한 확인 후에만 호출!
   *
   * @param workspaceId - Workspace ID
   * @param userId - 초대할 사용자 ID
   */
  addMember(workspaceId: WorkspaceId, userId: string): Promise<void>;

  /**
   * Workspace 멤버 제거
   *
   * ⚠️ 주의: Service Layer에서 권한 확인 후에만 호출!
   *
   * @param workspaceId - Workspace ID
   * @param userId - 제거할 사용자 ID
   */
  removeMember(workspaceId: WorkspaceId, userId: string): Promise<void>;
}
