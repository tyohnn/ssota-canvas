// apps/web/src/domains/organization-management/shared/entities/invitation.entity.ts

import { OrganizationId, UserId, InvitationId } from '../value-objects/ids.vo';
import { MemberRole } from '../value-objects/member-role.vo';
import { InvitationStatus } from '../types';
import { OrganizationManagementError } from '../errors/organization-management.error';

export class Invitation {
  constructor(
    public readonly id: InvitationId,
    public readonly organizationId: OrganizationId,
    public readonly inviterUserId: UserId,
    private _inviteeEmail: string,
    private _inviteeUserId: UserId | null,
    private _role: MemberRole,
    private _status: InvitationStatus,
    public readonly createdAt: Date,
    private _respondedAt: Date | null
  ) {}

  // Getters
  get inviteeEmail(): string {
    return this._inviteeEmail;
  }

  get inviteeUserId(): UserId | null {
    return this._inviteeUserId;
  }

  get role(): MemberRole {
    return this._role;
  }

  get status(): InvitationStatus {
    return this._status;
  }

  get respondedAt(): Date | null {
    return this._respondedAt;
  }

  // 상태 변경 메서드
  accept(): void {
    if (this.hasResponded()) {
      throw new OrganizationManagementError(
        'INVITATION_ALREADY_RESPONDED',
        'Invitation has already been responded to'
      );
    }

    this._status = 'accepted';
    this._respondedAt = new Date();
  }

  reject(): void {
    if (this.hasResponded()) {
      throw new OrganizationManagementError(
        'INVITATION_ALREADY_RESPONDED',
        'Invitation has already been responded to'
      );
    }

    this._status = 'rejected';
    this._respondedAt = new Date();
  }

  expire(): void {
    if (this.hasResponded()) {
      throw new OrganizationManagementError(
        'INVITATION_ALREADY_RESPONDED',
        'Invitation has already been responded to'
      );
    }

    this._status = 'expired';
  }

  setInviteeUserId(userId: UserId): void {
    this._inviteeUserId = userId;
  }

  // 상태 체크 메서드
  isPending(): boolean {
    return this._status === 'pending';
  }

  isAccepted(): boolean {
    return this._status === 'accepted';
  }

  isRejected(): boolean {
    return this._status === 'rejected';
  }

  isExpired(): boolean {
    return this._status === 'expired';
  }

  hasResponded(): boolean {
    return this._status !== 'pending';
  }
}
