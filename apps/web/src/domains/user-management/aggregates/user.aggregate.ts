import { User } from '../entities/user.entity';
import { Membership } from '../entities/membership.entity';
import { UserId, OrganizationId } from '../value-objects/ids.vo';
import { UserManagementError } from '../errors/user-management.error';
import { UserCreatedEvent, UserUpdatedEvent, UserLoggedInEvent, UserLoggedOutEvent, OrganizationSelectedByUserEvent, OrganizationContextSetEvent } from '../events';

export class UserAggregate {
  constructor(
    private user: User,
    private memberships: Membership[] = [],
    private currentOrganizationId?: OrganizationId
  ) {}

  // Command 처리
  static createFromClerkUser(clerkUser: any): UserAggregate {
    const user = new User(
      UserId.generate(),
      clerkUser.id,
      new UserEmail(clerkUser.emailAddresses[0].emailAddress),
      `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      clerkUser.imageUrl,
      new Date(),
      new Date()
    );
    return new UserAggregate(user);
  }

  updateFromClerkUser(clerkUser: any): UserCreatedEvent | UserUpdatedEvent {
    const newEmail = new UserEmail(clerkUser.emailAddresses[0].emailAddress);
    const newName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();

    const hasChanges =
      !this.user.email.equals(newEmail) ||
      this.user.name !== newName ||
      this.user.avatarUrl !== clerkUser.imageUrl;

    if (hasChanges) {
      this.user.updateProfile(newName, clerkUser.imageUrl);
      if (!this.user.email.equals(newEmail)) {
        this.user.updateEmail(newEmail);
      }
      return new UserUpdatedEvent(this.user.id, this.user.email, this.user.name);
    }

    return new UserCreatedEvent(this.user.id, this.user.email, this.user.name);
  }

  // Command Handlers
  selectOrganization(organizationId: OrganizationId): OrganizationSelectedByUserEvent {
    // 사용자의 조직 멤버십 검증
    const membership = this.memberships.find(m =>
      m.organizationId.equals(organizationId) && !m.isDeleted
    );

    if (!membership) {
      throw new UserManagementError('USER_NOT_MEMBER', 'User is not a member of this organization');
    }

    if (membership.status !== 'active') {
      throw new UserManagementError('MEMBERSHIP_NOT_ACTIVE', 'Membership is not active');
    }

    // 현재 조직 업데이트
    this.currentOrganizationId = organizationId;

    return new OrganizationSelectedByUserEvent(
      this.user.id,
      organizationId,
      'Organization Name', // TODO: 실제 조직명 조회
      membership.role
    );
  }

  setOrganizationContext(organizationId: OrganizationId): OrganizationContextSetEvent {
    // 조직 멤버십 검증
    const membership = this.memberships.find(m =>
      m.organizationId.equals(organizationId) && !m.isDeleted
    );

    if (!membership) {
      throw new UserManagementError('USER_NOT_MEMBER', 'User is not a member of this organization');
    }

    // 기본 조직인 경우 자동으로 설정
    if (membership.isDefault) {
      this.currentOrganizationId = organizationId;
    }

    return new OrganizationContextSetEvent(
      this.user.id,
      organizationId,
      'Organization Name', // TODO: 실제 조직명 조회
      membership.role
    );
  }

  loginUser(clerkUserId: string, sessionId: string, loginMethod: string): UserLoggedInEvent {
    if (this.user.isDeleted) {
      throw new UserManagementError('USER_DELETED', 'Cannot login with deleted user account');
    }

    // 사용자 마지막 로그인 시간 업데이트
    this.user.updateLastLogin();

    return new UserLoggedInEvent(
      this.user.id,
      clerkUserId,
      sessionId,
      loginMethod
    );
  }

  logoutUser(sessionId: string): UserLoggedOutEvent {
    return new UserLoggedOutEvent(this.user.id, sessionId);
  }

  // 비즈니스 규칙 검증
  canJoinOrganization(organizationId: OrganizationId): boolean {
    if (this.user.isDeleted) return false;
    return !this.memberships.some(m =>
      m.organizationId.equals(organizationId) && !m.isDeleted
    );
  }

  getDefaultOrganization(): Membership | null {
    return this.memberships.find(m => m.isDefault && !m.isDeleted) || null;
  }

  getCurrentOrganization(): OrganizationId | undefined {
    return this.currentOrganizationId;
  }

  // Getters
  get id() { return this.user.id; }
  get entity() { return this.user; }
  get activeMemberships() {
    return this.memberships.filter(m => !m.isDeleted);
  }
}