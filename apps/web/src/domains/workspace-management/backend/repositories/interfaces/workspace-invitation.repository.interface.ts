import { WorkspaceInvitation } from '../../../shared/entities/workspace-invitation.entity';
import { WorkspaceInvitationId } from '../../../shared/value-objects/workspace-invitation-id.vo';
import { WorkspaceId } from '../../../shared/value-objects/workspace-id.vo';

export interface WorkspaceInvitationWithProfiles {
  id: WorkspaceInvitationId;
  workspaceId: WorkspaceId;
  invitedUserId: string;
  invitedUserName: string;
  invitedUserEmail: string;
  invitedBy: string;
  inviterName: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  processedAt: Date | null;
}

/**
 * WorkspaceInvitationRepository Interface
 *
 * Workspace 초대 데이터 영속성 계약
 */
export interface IWorkspaceInvitationRepository {
  /**
   * 초대 저장
   *
   * @param invitation - WorkspaceInvitation Entity
   */
  save(invitation: WorkspaceInvitation): Promise<void>;

  /**
   * ID로 초대 조회
   *
   * @param id - 초대 ID
   * @returns WorkspaceInvitation 또는 null
   */
  findById(id: WorkspaceInvitationId): Promise<WorkspaceInvitation | null>;

  /**
   * 사용자별 초대 목록 조회
   *
   * @param userId - 사용자 ID
   * @returns 초대 목록
   */
  findByUserId(userId: string): Promise<WorkspaceInvitation[]>;

  /**
   * Workspace별 pending 초대 목록 조회
   *
   * @param workspaceId - Workspace ID
   * @returns pending 상태 초대 목록
   */
  findPendingByWorkspace(
    workspaceId: WorkspaceId
  ): Promise<WorkspaceInvitation[]>;

  /**
   * Workspace별 pending 초대 목록 조회 (Profile JOIN)
   *
   * @param workspaceId - Workspace ID
   * @returns pending 초대 + 프로필 정보
   */
  findPendingByWorkspaceWithProfiles(
    workspaceId: WorkspaceId
  ): Promise<WorkspaceInvitationWithProfiles[]>;

  /**
   * 특정 초대 조회 (중복 확인용)
   *
   * @param workspaceId - Workspace ID
   * @param userId - 사용자 ID
   * @param status - 초대 상태
   * @returns WorkspaceInvitation 또는 null
   */
  findInvitation(
    workspaceId: WorkspaceId,
    userId: string,
    status: 'pending' | 'accepted' | 'rejected' | 'expired'
  ): Promise<WorkspaceInvitation | null>;

  /**
   * 초대 상태 변경
   *
   * @param id - 초대 ID
   * @param status - 새 상태
   */
  updateStatus(
    id: WorkspaceInvitationId,
    status: 'accepted' | 'rejected'
  ): Promise<void>;
}
