// apps/web/src/domains/workspace-management/backend/services/interfaces/workspace-invitation.service.interface.ts

import type { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';
import type { Result } from './common.types';

/**
 * Workspace Invitation Service Interface (Scenario 3)
 *
 * Workspace 멤버 초대, 수락, 거절을 담당
 */
export interface WorkspaceInvitationService {
  /**
   * Workspace 멤버 초대 (Scenario 3)
   *
   * 트랜잭션:
   * 1. 각 이메일에 대해 조직 멤버 검색
   * 2. 이미 Workspace 멤버인지 확인
   * 3. 초대 생성
   * 4. Notification Domain 통합 (알림 생성)
   *
   * @param workspaceId - Workspace ID
   * @param memberEmails - 초대할 멤버 이메일 배열
   * @param userId - 초대하는 사용자 ID
   * @returns 초대한 멤버 수 (성공) | Error code (실패)
   */
  inviteWorkspaceMembers(
    workspaceId: WorkspaceId,
    memberEmails: string[],
    userId: string
  ): Promise<Result<number>>;

  /**
   * Workspace 초대 수락 (Scenario 3)
   *
   * 트랜잭션:
   * 1. 초대 상태를 accepted로 변경
   * 2. Workspace 멤버로 추가
   * 3. Notification Domain 통합 (알림 업데이트)
   *
   * @param invitationId - 초대 ID
   * @param userId - 수락하는 사용자 ID
   * @returns void (성공) | Error code (실패)
   */
  acceptWorkspaceInvitation(
    invitationId: string,
    userId: string
  ): Promise<Result<void>>;

  /**
   * Workspace 초대 거절 (Scenario 3)
   *
   * @param invitationId - 초대 ID
   * @param userId - 거절하는 사용자 ID
   * @returns void (성공) | Error code (실패)
   */
  rejectWorkspaceInvitation(
    invitationId: string,
    userId: string
  ): Promise<Result<void>>;
}

