import { MembershipId, OrganizationId, UserId, UserEmail, MembershipRole, MembershipStatus } from '../value-objects/ids.vo';
import { UserManagementError } from '../errors/user-management.error';

export class Membership {
  constructor(
    public readonly id: MembershipId,
    public readonly organizationId: OrganizationId,
    private _userId: UserId | null,
    private _role: MembershipRole,
    private _invitedBy: UserId | null,
    private _invitedAt: Date | null,
    private _joinedAt: Date | null,
    private _status: MembershipStatus,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _deletedAt: Date | null = null,
    private _inviteeEmail?: UserEmail
  ) {}

  // Getters
  get userId() { return this._userId; }
  get role() { return this._role; }
  get invitedBy() { return this._invitedBy; }
  get invitedAt() { return this._invitedAt; }
  get joinedAt() { return this._joinedAt; }
  get status() { return this._status; }
  get updatedAt() { return this._updatedAt; }
  get deletedAt() { return this._deletedAt; }
  get isDeleted() { return this._deletedAt !== null; }
  get inviteeEmail() { return this._inviteeEmail; }
  get isDefault() { return this._role === 'owner'; } // 기본 조직에서는 owner가 default

  // 상태 변경 메서드
  accept(userId: UserId): void {
    if (this._status !== 'pending') {
      throw new UserManagementError(
        'INVITATION_NOT_PENDING',
        'Invitation is not pending'
      );
    }
    if (this.isExpired()) {
      throw new UserManagementError(
        'INVITATION_EXPIRED',
        'Invitation has expired'
      );
    }
    this._userId = userId;
    this._joinedAt = new Date();
    this._status = 'active';
    this._updatedAt = new Date();
  }

  reject(): void {
    if (this._status !== 'pending') {
      throw new UserManagementError(
        'INVITATION_NOT_PENDING',
        'Invitation is not pending'
      );
    }
    this._status = 'removed';
    this._updatedAt = new Date();
  }

  changeRole(newRole: MembershipRole): void {
    if (this._status !== 'active') {
      throw new UserManagementError(
        'MEMBERSHIP_NOT_ACTIVE',
        'Cannot change role of inactive membership'
      );
    }
    this._role = newRole;
    this._updatedAt = new Date();
  }

  remove(): void {
    if (this.isDeleted) {
      throw new UserManagementError(
        'MEMBERSHIP_ALREADY_DELETED',
        'Membership is already deleted'
      );
    }
    this._status = 'removed';
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  cancel(): void {
    if (this._status !== 'pending') {
      throw new UserManagementError(
        'INVITATION_NOT_PENDING',
        'Can only cancel pending invitations'
      );
    }
    this._status = 'removed';
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  // 비즈니스 규칙 검증
  isExpired(): boolean {
    if (!this._invitedAt || this._status !== 'pending') return false;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this._invitedAt < thirtyDaysAgo;
  }

  canInviteMembers(): boolean {
    return this._status === 'active' && (this._role === 'owner' || this._role === 'admin');
  }
}