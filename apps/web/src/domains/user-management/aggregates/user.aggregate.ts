import { User } from '../entities/user.entity';
import { UserId } from '../value-objects/user-id.vo';
import { UserEmail } from '../value-objects/user-email.vo';
import { UserManagementError } from '../errors/user-management.error';
import { UserCreatedEvent, UserUpdatedEvent, UserLoggedInEvent, UserLoggedOutEvent } from '../events';

export class UserAggregate {
  constructor(
    private user: User,
    private memberships: any[] = [] // Membership entities will be added later
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

  // 비즈니스 규칙 검증
  canJoinOrganization(organizationId: any): boolean {
    if (this.user.isDeleted) return false;
    return !this.memberships.some((m: any) =>
      m.organizationId.equals(organizationId) && !m.isDeleted
    );
  }

  getDefaultOrganization(): any | null {
    return this.memberships.find((m: any) => m.isDefault && !m.isDeleted) || null;
  }

  // Command Handlers
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

  // Getters
  get id() { return this.user.id; }
  get entity() { return this.user; }
  get activeMemberships() {
    return this.memberships.filter((m: any) => !m.isDeleted);
  }
}