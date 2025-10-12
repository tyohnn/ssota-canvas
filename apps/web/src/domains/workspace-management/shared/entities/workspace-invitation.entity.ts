import { WorkspaceInvitationId } from '../value-objects/workspace-invitation-id.vo';
import { WorkspaceId } from '../value-objects/workspace-id.vo';
import {
  WorkspaceManagementError,
  createWorkspaceManagementError,
} from '../errors/workspace-management.error';

/**
 * WorkspaceInvitation Entity
 *
 * Workspace 초대를 나타내는 엔티티
 *
 * 비즈니스 규칙:
 * - 초대 상태: pending, accepted, rejected, expired
 * - pending 상태만 처리 가능 (accept/reject)
 * - 처리 시 processedAt 타임스탬프 자동 설정
 */
export class WorkspaceInvitation {
  constructor(
    public readonly id: WorkspaceInvitationId,
    public readonly workspaceId: WorkspaceId,
    public readonly invitedUserId: string,
    public readonly invitedBy: string,
    private _status: 'pending' | 'accepted' | 'rejected' | 'expired',
    private _notificationId: string | null,
    public readonly createdAt: Date,
    private _processedAt: Date | null
  ) {}

  // Getters
  get status(): 'pending' | 'accepted' | 'rejected' | 'expired' {
    return this._status;
  }

  get notificationId(): string | null {
    return this._notificationId;
  }

  get processedAt(): Date | null {
    return this._processedAt;
  }

  /**
   * 초대 수락
   *
   * - pending 상태만 수락 가능
   * - 상태를 accepted로 변경
   * - processedAt 타임스탬프 설정
   */
  accept(): void {
    if (!this.canBeProcessed()) {
      throw createWorkspaceManagementError('INVITATION_ALREADY_PROCESSED');
    }

    this._status = 'accepted';
    this._processedAt = new Date();
  }

  /**
   * 초대 거절
   *
   * - pending 상태만 거절 가능
   * - 상태를 rejected로 변경
   * - processedAt 타임스탬프 설정
   */
  reject(): void {
    if (!this.canBeProcessed()) {
      throw createWorkspaceManagementError('INVITATION_ALREADY_PROCESSED');
    }

    this._status = 'rejected';
    this._processedAt = new Date();
  }

  /**
   * 알림 ID 설정
   *
   * @param notificationId - Notification Domain에서 생성된 알림 ID
   */
  setNotificationId(notificationId: string): void {
    this._notificationId = notificationId;
  }

  // 상태 확인 메서드
  isPending(): boolean {
    return this._status === 'pending';
  }

  isAccepted(): boolean {
    return this._status === 'accepted';
  }

  isRejected(): boolean {
    return this._status === 'rejected';
  }

  /**
   * 처리 가능 여부 확인
   *
   * @returns pending 상태이면 true
   */
  canBeProcessed(): boolean {
    return this._status === 'pending';
  }
}
