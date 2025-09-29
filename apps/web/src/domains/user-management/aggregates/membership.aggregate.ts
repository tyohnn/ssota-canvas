import { Membership } from '../entities/membership.entity';
import { Organization } from '../entities/organization.entity';
import { User } from '../entities/user.entity';
import { MembershipId, OrganizationId, UserId, UserEmail, MembershipRole, MembershipStatus } from '../value-objects/ids.vo';
import { UserManagementError } from '../errors/user-management.error';

// Commands
export interface InviteUserToOrganizationCommand {
  organizationId: OrganizationId;
  inviteeEmail: UserEmail;
  inviterId: UserId;
  role: MembershipRole;
  timestamp: Date;
}

export interface AcceptInvitationCommand {
  invitationId: MembershipId;
  userId: UserId;
  timestamp: Date;
}

export interface RejectInvitationCommand {
  invitationId: MembershipId;
  timestamp: Date;
}

export interface ChangeMemberRoleCommand {
  membershipId: MembershipId;
  newRole: MembershipRole;
  changedBy: UserId;
  timestamp: Date;
}

export interface RemoveMemberCommand {
  membershipId: MembershipId;
  removedBy: UserId;
  timestamp: Date;
}

export interface CancelInvitationCommand {
  invitationId: MembershipId;
  cancelledBy: UserId;
  timestamp: Date;
}

// Events
export class MemberInvitationSentEvent {
  constructor(
    public readonly invitationId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly inviteeEmail: UserEmail,
    public readonly inviterUserId: UserId,
    public readonly role: MembershipRole,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class InvitationAcceptedEvent {
  constructor(
    public readonly invitationId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly role: MembershipRole,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class InvitationRejectedEvent {
  constructor(
    public readonly invitationId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly inviteeEmail: UserEmail,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class MemberRoleChangedEvent {
  constructor(
    public readonly membershipId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly oldRole: MembershipRole,
    public readonly newRole: MembershipRole,
    public readonly changedBy: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class MemberRemovedEvent {
  constructor(
    public readonly membershipId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly removedBy: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class InvitationCancelledEvent {
  constructor(
    public readonly invitationId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly inviteeEmail: UserEmail,
    public readonly cancelledBy: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class MembershipAggregate {
  constructor(
    private membership: Membership,
    private organization: Organization,
    private user: User
  ) {}

  // Command 처리
  static invite(
    organizationId: OrganizationId,
    inviteeEmail: UserEmail,
    inviterId: UserId,
    role: MembershipRole
  ): MembershipAggregate {
    const membership = new Membership(
      MembershipId.generate(),
      organizationId,
      null, // userId는 초대 수락 시 설정
      role,
      inviterId,
      new Date(), // invitedAt
      null, // joinedAt
      'pending', // status
      new Date(),
      new Date()
    );

    // 임시 Organization, User 객체 생성 (실제로는 Repository에서 조회)
    const tempOrganization = {} as Organization;
    const tempUser = {} as User;

    return new MembershipAggregate(membership, tempOrganization, tempUser);
  }

  acceptInvitation(userId: UserId): InvitationAcceptedEvent {
    if (this.membership.status !== 'pending') {
      throw new UserManagementError('INVITATION_NOT_PENDING', 'Invitation is not pending');
    }

    if (this.membership.isExpired()) {
      throw new UserManagementError('INVITATION_EXPIRED', 'Invitation has expired');
    }

    this.membership.accept(userId);

    return new InvitationAcceptedEvent(
      this.membership.id,
      this.membership.organizationId,
      userId,
      this.membership.role
    );
  }

  rejectInvitation(): InvitationRejectedEvent {
    if (this.membership.status !== 'pending') {
      throw new UserManagementError('INVITATION_NOT_PENDING', 'Invitation is not pending');
    }

    this.membership.reject();

    return new InvitationRejectedEvent(
      this.membership.id,
      this.membership.organizationId,
      this.membership.inviteeEmail!
    );
  }

  changeRole(newRole: MembershipRole, changedBy: UserId): MemberRoleChangedEvent {
    // 권한 검증: Owner만 역할 변경 가능
    if (!this.organization.ownerId.equals(changedBy)) {
      throw new UserManagementError('INSUFFICIENT_PERMISSIONS', 'Only owner can change member roles');
    }

    // Owner는 자신의 역할을 변경할 수 없음
    if (this.membership.userId?.equals(changedBy) && newRole !== 'owner') {
      throw new UserManagementError('CANNOT_CHANGE_OWN_ROLE', 'Owner cannot change their own role');
    }

    const oldRole = this.membership.role;
    this.membership.changeRole(newRole);

    return new MemberRoleChangedEvent(
      this.membership.id,
      this.membership.organizationId,
      this.membership.userId!,
      oldRole,
      newRole,
      changedBy
    );
  }

  remove(removedBy: UserId): MemberRemovedEvent {
    // 권한 검증: Owner 또는 Admin만 멤버 제거 가능
    const canRemove = this.organization.ownerId.equals(removedBy) ||
                     this.membership.role === 'admin';

    if (!canRemove) {
      throw new UserManagementError('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions to remove member');
    }

    // Owner는 자신을 제거할 수 없음
    if (this.membership.userId?.equals(removedBy)) {
      throw new UserManagementError('CANNOT_REMOVE_SELF', 'Cannot remove yourself from organization');
    }

    this.membership.remove();

    return new MemberRemovedEvent(
      this.membership.id,
      this.membership.organizationId,
      this.membership.userId!,
      removedBy
    );
  }

  cancelInvitation(cancelledBy: UserId): InvitationCancelledEvent {
    // 권한 검증: Owner, Admin, 또는 초대한 사람만 취소 가능
    const canCancel = this.organization.ownerId.equals(cancelledBy) ||
                     this.membership.invitedBy?.equals(cancelledBy) ||
                     this.membership.role === 'admin';

    if (!canCancel) {
      throw new UserManagementError('INSUFFICIENT_PERMISSIONS', 'Cannot cancel this invitation');
    }

    if (this.membership.status !== 'pending') {
      throw new UserManagementError('INVITATION_NOT_PENDING', 'Can only cancel pending invitations');
    }

    this.membership.cancel();

    return new InvitationCancelledEvent(
      this.membership.id,
      this.membership.organizationId,
      this.membership.inviteeEmail!,
      cancelledBy
    );
  }

  // 비즈니스 규칙 검증
  canInviteMembers(): boolean {
    return this.membership.role === 'owner' || this.membership.role === 'admin';
  }

  isExpired(): boolean {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this.membership.invitedAt! < thirtyDaysAgo;
  }

  // Getters
  get id() { return this.membership.id; }
  get entity() { return this.membership; }
  get organizationId() { return this.membership.organizationId; }
  get userId() { return this.membership.userId; }
  get role() { return this.membership.role; }
  get status() { return this.membership.status; }
}