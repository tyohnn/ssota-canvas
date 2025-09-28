# User Management Domain - Technical Specification

Software Design을 기반으로 한 구체적인 구현 가이드입니다.

**작성자**: AI Assistant  
**작성일**: 2025-09-28  
**버전**: 1.0  
**리뷰어**: [시니어 개발자명]

---

## 🎯 Implementation Overview

### 개발 우선순위
1. **Phase 1**: Clerk 동기화 및 기본 사용자/조직 관리
   - User/Organization Aggregate 구현
   - Clerk Webhook 처리
   - 기본 CRUD 작업
2. **Phase 2**: 멤버십 관리 및 권한 시스템
   - Membership Aggregate 구현
   - 초대/승인 프로세스
   - 역할 기반 권한 검증
3. **Phase 3**: 고급 기능 및 최적화
   - 소프트 삭제 및 복구
   - Read Models 최적화
   - 성능 모니터링

### 선행조건 및 위험요소
- **Clerk 설정 완료**: Organization, User webhook 설정 필요
- **Database 스키마**: users, organizations, memberships 테이블 생성
- **외부 의존성**: Clerk API 안정성에 의존

### 협업 포인트
- **프론트엔드**: Context API를 통한 사용자 상태 관리
- **인프라**: Webhook 엔드포인트 보안 설정
- **QA**: 초대 링크 및 권한 테스트 시나리오

---

## 🏗️ Implementation Details

### 1. Value Objects 구현

#### UserEmail
```typescript
// apps/web/src/domains/user-management/value-objects/user-email.vo.ts
export class UserEmail {
  constructor(private readonly value: string) {
    if (!this.isValidEmail(value)) {
      throw new UserManagementError('INVALID_EMAIL_FORMAT', 'Invalid email format');
    }
  }

  get value() { return this.value; }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  equals(other: UserEmail): boolean {
    return this.value === other.value;
  }

  getDomain(): string {
    return this.value.split('@')[1];
  }
}
```

#### OrganizationSlug
```typescript
// apps/web/src/domains/user-management/value-objects/organization-slug.vo.ts
export class OrganizationSlug {
  constructor(private readonly value: string) {
    if (value.length < 3 || value.length > 50) {
      throw new UserManagementError('INVALID_SLUG_LENGTH', 'Slug must be between 3 and 50 characters');
    }
    if (!/^[a-z0-9-]+$/.test(value)) {
      throw new UserManagementError('INVALID_SLUG_FORMAT', 'Slug can only contain lowercase letters, numbers, and hyphens');
    }
  }

  get value() { return this.value; }

  equals(other: OrganizationSlug): boolean {
    return this.value === other.value;
  }

  static fromName(name: string): OrganizationSlug {
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    return new OrganizationSlug(slug);
  }
}
```

### 2. Entities 구현

#### Value Object IDs
```typescript
// apps/web/src/domains/user-management/value-objects/ids.vo.ts
export class UserId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new UserManagementError('INVALID_USER_ID', 'User ID cannot be empty');
    }
  }

  get value() { return this.value; }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  static generate(): UserId {
    return new UserId(crypto.randomUUID());
  }
}

export class OrganizationId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new UserManagementError('INVALID_ORGANIZATION_ID', 'Organization ID cannot be empty');
    }
  }

  get value() { return this.value; }

  equals(other: OrganizationId): boolean {
    return this.value === other.value;
  }

  static generate(): OrganizationId {
    return new OrganizationId(crypto.randomUUID());
  }
}

export class MembershipId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new UserManagementError('INVALID_MEMBERSHIP_ID', 'Membership ID cannot be empty');
    }
  }

  get value() { return this.value; }

  equals(other: MembershipId): boolean {
    return this.value === other.value;
  }

  static generate(): MembershipId {
    return new MembershipId(crypto.randomUUID());
  }
}

export type MembershipRole = 'owner' | 'admin' | 'member';
export type MembershipStatus = 'pending' | 'active' | 'removed';
```

#### User Entity
```typescript
// apps/web/src/domains/user-management/entities/user.entity.ts
export class User {
  constructor(
    public readonly id: UserId,
    public readonly clerkId: string,
    private _email: UserEmail,
    private _name: string,
    private _avatarUrl: string | null,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _deletedAt: Date | null = null
  ) {}

  // Getters
  get email() { return this._email; }
  get name() { return this._name; }
  get avatarUrl() { return this._avatarUrl; }
  get updatedAt() { return this._updatedAt; }
  get deletedAt() { return this._deletedAt; }
  get isDeleted() { return this._deletedAt !== null; }

  // 상태 변경 메서드
  updateProfile(name: string, avatarUrl: string | null): void {
    if (this.isDeleted) {
      throw new UserManagementError('USER_DELETED', 'Cannot update deleted user');
    }
    this._name = name;
    this._avatarUrl = avatarUrl;
    this._updatedAt = new Date();
  }

  updateEmail(email: UserEmail): void {
    if (this.isDeleted) {
      throw new UserManagementError('USER_DELETED', 'Cannot update deleted user');
    }
    this._email = email;
    this._updatedAt = new Date();
  }

  softDelete(): void {
    if (this.isDeleted) {
      throw new UserManagementError('USER_ALREADY_DELETED', 'User is already deleted');
    }
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  restore(): void {
    if (!this.isDeleted) {
      throw new UserManagementError('USER_NOT_DELETED', 'User is not deleted');
    }
    this._deletedAt = null;
    this._updatedAt = new Date();
  }
}
```

#### Organization Entity
```typescript
// apps/web/src/domains/user-management/entities/organization.entity.ts
export class Organization {
  constructor(
    public readonly id: OrganizationId,
    public readonly clerkId: string,
    private _name: string,
    private _slug: OrganizationSlug,
    private _ownerId: UserId,
    private _isDefault: boolean,
    public readonly createdAt: Date,
    private _updatedAt: Date,
    private _deletedAt: Date | null = null
  ) {}

  // Getters
  get name() { return this._name; }
  get slug() { return this._slug; }
  get ownerId() { return this._ownerId; }
  get isDefault() { return this._isDefault; }
  get updatedAt() { return this._updatedAt; }
  get deletedAt() { return this._deletedAt; }
  get isDeleted() { return this._deletedAt !== null; }

  // 상태 변경 메서드
  updateName(name: string): void {
    if (this.isDeleted) {
      throw new UserManagementError('ORGANIZATION_DELETED', 'Cannot update deleted organization');
    }
    this._name = name;
    this._updatedAt = new Date();
  }

  updateSlug(slug: OrganizationSlug): void {
    if (this.isDeleted) {
      throw new UserManagementError('ORGANIZATION_DELETED', 'Cannot update deleted organization');
    }
    this._slug = slug;
    this._updatedAt = new Date();
  }

  transferOwnership(newOwnerId: UserId): void {
    if (this.isDeleted) {
      throw new UserManagementError('ORGANIZATION_DELETED', 'Cannot transfer ownership of deleted organization');
    }
    if (this._isDefault) {
      throw new UserManagementError('CANNOT_TRANSFER_DEFAULT', 'Cannot transfer ownership of default organization');
    }
    this._ownerId = newOwnerId;
    this._updatedAt = new Date();
  }

  softDelete(): void {
    if (this.isDeleted) {
      throw new UserManagementError('ORGANIZATION_ALREADY_DELETED', 'Organization is already deleted');
    }
    if (this._isDefault) {
      throw new UserManagementError('CANNOT_DELETE_DEFAULT', 'Cannot delete default organization');
    }
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  restore(): void {
    if (!this.isDeleted) {
      throw new UserManagementError('ORGANIZATION_NOT_DELETED', 'Organization is not deleted');
    }
    this._deletedAt = null;
    this._updatedAt = new Date();
  }

  // 30일 후 완전 삭제 여부 확인
  canBePermanentlyDeleted(): boolean {
    if (!this.isDeleted) return false;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return this._deletedAt! < thirtyDaysAgo;
  }
}
```

#### Membership Entity
```typescript
// apps/web/src/domains/user-management/entities/membership.entity.ts
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
      throw new UserManagementError('INVITATION_NOT_PENDING', 'Invitation is not pending');
    }
    if (this.isExpired()) {
      throw new UserManagementError('INVITATION_EXPIRED', 'Invitation has expired');
    }
    this._userId = userId;
    this._joinedAt = new Date();
    this._status = 'active';
    this._updatedAt = new Date();
  }

  reject(): void {
    if (this._status !== 'pending') {
      throw new UserManagementError('INVITATION_NOT_PENDING', 'Invitation is not pending');
    }
    this._status = 'removed';
    this._updatedAt = new Date();
  }

  changeRole(newRole: MembershipRole): void {
    if (this._status !== 'active') {
      throw new UserManagementError('MEMBERSHIP_NOT_ACTIVE', 'Cannot change role of inactive membership');
    }
    this._role = newRole;
    this._updatedAt = new Date();
  }

  remove(): void {
    if (this.isDeleted) {
      throw new UserManagementError('MEMBERSHIP_ALREADY_DELETED', 'Membership is already deleted');
    }
    this._status = 'removed';
    this._deletedAt = new Date();
    this._updatedAt = new Date();
  }

  cancel(): void {
    if (this._status !== 'pending') {
      throw new UserManagementError('INVITATION_NOT_PENDING', 'Can only cancel pending invitations');
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
```

### 3. Aggregates 구현

#### UserAggregate
```typescript
// apps/web/src/domains/user-management/aggregates/user.aggregate.ts
export class UserAggregate {
  constructor(
    private user: User,
    private memberships: Membership[] = []
  ) {}

  // Command 처리
  static createFromClerkUser(clerkUser: ClerkUser): UserAggregate {
    const user = new User(
      UserId.generate(),
      clerkUser.id,
      new UserEmail(clerkUser.emailAddresses[0].emailAddress),
      clerkUser.firstName + ' ' + clerkUser.lastName,
      clerkUser.imageUrl,
      new Date(),
      new Date()
    );
    return new UserAggregate(user);
  }

  updateFromClerkUser(clerkUser: ClerkUser): UserCreatedEvent | UserUpdatedEvent {
    const newEmail = new UserEmail(clerkUser.emailAddresses[0].emailAddress);
    const newName = clerkUser.firstName + ' ' + clerkUser.lastName;
    
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
  canJoinOrganization(organizationId: OrganizationId): boolean {
    if (this.user.isDeleted) return false;
    return !this.memberships.some(m => 
      m.organizationId.equals(organizationId) && !m.isDeleted
    );
  }

  getDefaultOrganization(): Membership | null {
    return this.memberships.find(m => m.isDefault && !m.isDeleted) || null;
  }

  // Getters
  get id() { return this.user.id; }
  get entity() { return this.user; }
  get activeMemberships() { 
    return this.memberships.filter(m => !m.isDeleted); 
  }
}
```

#### OrganizationAggregate
```typescript
// apps/web/src/domains/user-management/aggregates/organization.aggregate.ts
export class OrganizationAggregate {
  constructor(
    private organization: Organization,
    private memberships: Membership[] = []
  ) {}

  // Command 처리
  static create(
    name: string,
    slug: OrganizationSlug,
    clerkId: string,
    ownerId: UserId
  ): OrganizationAggregate {
    const organization = new Organization(
      OrganizationId.generate(),
      clerkId,
      name,
      slug,
      ownerId,
      false, // isDefault
      new Date(),
      new Date()
    );
    return new OrganizationAggregate(organization);
  }

  static createDefault(
    name: string,
    slug: OrganizationSlug,
    clerkId: string,
    ownerId: UserId
  ): OrganizationAggregate {
    const organization = new Organization(
      OrganizationId.generate(),
      clerkId,
      name,
      slug,
      ownerId,
      true, // isDefault
      new Date(),
      new Date()
    );
    return new OrganizationAggregate(organization);
  }

  updateFromClerkOrganization(clerkOrg: ClerkOrganization): OrganizationUpdatedEvent {
    const hasChanges = 
      this.organization.name !== clerkOrg.name ||
      this.organization.slug.value !== clerkOrg.slug;

    if (hasChanges) {
      this.organization.updateName(clerkOrg.name);
      this.organization.updateSlug(new OrganizationSlug(clerkOrg.slug));
      return new OrganizationUpdatedEvent(
        this.organization.id,
        this.organization.name,
        this.organization.slug
      );
    }

    return new OrganizationUpdatedEvent(
      this.organization.id,
      this.organization.name,
      this.organization.slug
    );
  }

  transferOwnership(newOwnerId: UserId, currentOwnerId: UserId): OwnershipTransferredEvent {
    if (!this.organization.ownerId.equals(currentOwnerId)) {
      throw new UserManagementError('INSUFFICIENT_PERMISSIONS', 'Only current owner can transfer ownership');
    }

    if (this.organization.isDefault) {
      throw new UserManagementError('CANNOT_TRANSFER_DEFAULT', 'Cannot transfer ownership of default organization');
    }

    // 새 소유자 멤버십 확인
    const newOwnerMembership = this.memberships.find(m => 
      m.userId.equals(newOwnerId) && !m.isDeleted
    );

    if (!newOwnerMembership) {
      throw new UserManagementError('USER_NOT_MEMBER', 'New owner must be a member of the organization');
    }

    // 소유권 이전
    this.organization.transferOwnership(newOwnerId);
    
    // 기존 소유자를 Admin으로 변경
    const currentOwnerMembership = this.memberships.find(m => 
      m.userId.equals(currentOwnerId) && !m.isDeleted
    );
    if (currentOwnerMembership) {
      currentOwnerMembership.changeRole('admin');
    }

    // 새 소유자를 Owner로 변경
    newOwnerMembership.changeRole('owner');

    return new OwnershipTransferredEvent(
      this.organization.id,
      currentOwnerId,
      newOwnerId
    );
  }

  softDelete(deletedBy: UserId): OrganizationSoftDeletedEvent {
    if (!this.organization.ownerId.equals(deletedBy)) {
      throw new UserManagementError('INSUFFICIENT_PERMISSIONS', 'Only owner can delete organization');
    }

    if (this.organization.isDefault) {
      throw new UserManagementError('CANNOT_DELETE_DEFAULT', 'Cannot delete default organization');
    }

    this.organization.softDelete();
    
    // 모든 멤버십 비활성화
    this.memberships.forEach(membership => {
      if (!membership.isDeleted) {
        membership.remove();
      }
    });

    return new OrganizationSoftDeletedEvent(
      this.organization.id,
      this.organization.name,
      deletedBy
    );
  }

  restoreOrganization(restoredBy: UserId): OrganizationRestoredEvent {
    if (!this.organization.ownerId.equals(restoredBy)) {
      throw new UserManagementError('INSUFFICIENT_PERMISSIONS', 'Only owner can restore organization');
    }

    if (!this.organization.isDeleted) {
      throw new UserManagementError('ORGANIZATION_NOT_DELETED', 'Organization is not deleted');
    }

    if (this.organization.canBePermanentlyDeleted()) {
      throw new UserManagementError('ORGANIZATION_PERMANENTLY_DELETED', 'Organization cannot be restored after 30 days');
    }

    this.organization.restore();

    return new OrganizationRestoredEvent(
      this.organization.id,
      this.organization.name,
      restoredBy
    );
  }

  handleClerkOrganizationDeletion(clerkOrgId: string): OrganizationClerkDeletedEvent {
    if (this.organization.clerkId !== clerkOrgId) {
      throw new UserManagementError('CLERK_ID_MISMATCH', 'Clerk organization ID does not match');
    }

    // Clerk에서 삭제된 조직은 강제로 소프트 삭제
    this.organization.softDelete();
    
    // 모든 멤버십 비활성화
    this.memberships.forEach(membership => {
      if (!membership.isDeleted) {
        membership.remove();
      }
    });

    return new OrganizationClerkDeletedEvent(
      this.organization.id,
      clerkOrgId
    );
  }

  // 비즈니스 규칙 검증
  canBeDeletedBy(userId: UserId): boolean {
    return this.organization.ownerId.equals(userId) && !this.organization.isDefault;
  }

  getActiveMembers(): Membership[] {
    return this.memberships.filter(m => !m.isDeleted);
  }

  getMemberCount(): number {
    return this.getActiveMembers().length;
  }

  // Getters
  get id() { return this.organization.id; }
  get entity() { return this.organization; }
  get ownerId() { return this.organization.ownerId; }
  get isDefault() { return this.organization.isDefault; }
}
```

#### MembershipAggregate
```typescript
// apps/web/src/domains/user-management/aggregates/membership.aggregate.ts
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

    return new MembershipAggregate(membership, organization, user);
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
      this.membership.inviteeEmail
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
    return this.membership.invitedAt < thirtyDaysAgo;
  }

  // Getters
  get id() { return this.membership.id; }
  get entity() { return this.membership; }
  get organizationId() { return this.membership.organizationId; }
  get userId() { return this.membership.userId; }
  get role() { return this.membership.role; }
  get status() { return this.membership.status; }
}
```

### 4. Commands & Events 구현

#### Commands
```typescript
// apps/web/src/domains/user-management/commands/index.ts
export interface CreateUserFromClerkCommand {
  clerkUserId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface UpdateUserFromClerkCommand {
  clerkUserId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
}

export interface InviteUserToOrganizationCommand {
  organizationId: string;
  inviterUserId: string;
  inviteeEmail: string;
  role: MembershipRole;
}
```

#### Events
```typescript
// apps/web/src/domains/user-management/events/index.ts
export class UserCreatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: UserEmail,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class UserUpdatedEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: UserEmail,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class UserInvitedToOrganizationEvent {
  constructor(
    public readonly invitationId: InvitationId,
    public readonly organizationId: OrganizationId,
    public readonly inviteeEmail: UserEmail,
    public readonly inviterUserId: UserId,
    public readonly role: MembershipRole,
    public readonly timestamp: Date = new Date()
  ) {}
}

// Organization Events
export class OrganizationUpdatedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly name: string,
    public readonly slug: OrganizationSlug,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class ClerkOrganizationSyncedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly clerkId: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class DefaultOrganizationCreatedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly ownerId: UserId,
    public readonly name: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OwnershipTransferRequestedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly currentOwnerId: UserId,
    public readonly newOwnerId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OwnershipTransferredEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly previousOwnerId: UserId,
    public readonly newOwnerId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class NewOwnerPromotedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class PreviousOwnerDemotedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationDeletionRequestedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly requestedBy: UserId,
    public readonly organizationName: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationSoftDeletedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly organizationName: string,
    public readonly deletedBy: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationRestoredEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly organizationName: string,
    public readonly restoredBy: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class PermanentDeletionScheduledEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly scheduledDate: Date,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationClerkDeletedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly clerkId: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

// Membership Events
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

export class ClerkInvitationLinkGeneratedEvent {
  constructor(
    public readonly invitationId: MembershipId,
    public readonly clerkInvitationId: string,
    public readonly invitationUrl: string,
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

export class NewMemberAddedEvent {
  constructor(
    public readonly membershipId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly role: MembershipRole,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class MemberRoleAssignedEvent {
  constructor(
    public readonly membershipId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly role: MembershipRole,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class MemberPromotedToAdminEvent {
  constructor(
    public readonly membershipId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly promotedBy: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class AdminDemotedToMemberEvent {
  constructor(
    public readonly membershipId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly demotedBy: UserId,
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

export class InvitationExpiredEvent {
  constructor(
    public readonly invitationId: MembershipId,
    public readonly organizationId: OrganizationId,
    public readonly inviteeEmail: UserEmail,
    public readonly expiredAt: Date,
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
```

### 5. Error Types 구현

```typescript
// apps/web/src/domains/user-management/errors/user-management.error.ts
export class UserManagementError extends Error {
  constructor(
    public readonly code: UserManagementErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'UserManagementError';
  }
}

export type UserManagementErrorCode =
  | 'USER_NOT_FOUND'
  | 'USER_ALREADY_EXISTS'
  | 'USER_DELETED'
  | 'USER_ALREADY_DELETED'
  | 'USER_NOT_DELETED'
  | 'ORGANIZATION_NOT_FOUND'
  | 'ORGANIZATION_DELETED'
  | 'ORGANIZATION_ALREADY_DELETED'
  | 'ORGANIZATION_NOT_DELETED'
  | 'ORGANIZATION_PERMANENTLY_DELETED'
  | 'INVALID_EMAIL_FORMAT'
  | 'INVALID_SLUG_FORMAT'
  | 'INVALID_USER_ID'
  | 'INVALID_ORGANIZATION_ID'
  | 'INVALID_MEMBERSHIP_ID'
  | 'MEMBERSHIP_ALREADY_EXISTS'
  | 'MEMBERSHIP_NOT_ACTIVE'
  | 'MEMBERSHIP_ALREADY_DELETED'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'INVITATION_EXPIRED'
  | 'INVITATION_NOT_PENDING'
  | 'CANNOT_TRANSFER_DEFAULT'
  | 'CANNOT_DELETE_DEFAULT'
  | 'CANNOT_CHANGE_OWN_ROLE'
  | 'CANNOT_REMOVE_SELF'
  | 'USER_NOT_MEMBER'
  | 'CLERK_SYNC_FAILED'
  | 'CLERK_ID_MISMATCH';

// 사용자 메시지 매핑
export const USER_MANAGEMENT_ERROR_MESSAGES: Record<UserManagementErrorCode, string> = {
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  USER_ALREADY_EXISTS: '이미 존재하는 사용자입니다.',
  USER_DELETED: '삭제된 사용자입니다.',
  USER_ALREADY_DELETED: '이미 삭제된 사용자입니다.',
  USER_NOT_DELETED: '삭제되지 않은 사용자입니다.',
  ORGANIZATION_NOT_FOUND: '조직을 찾을 수 없습니다.',
  ORGANIZATION_DELETED: '삭제된 조직입니다.',
  ORGANIZATION_ALREADY_DELETED: '이미 삭제된 조직입니다.',
  ORGANIZATION_NOT_DELETED: '삭제되지 않은 조직입니다.',
  ORGANIZATION_PERMANENTLY_DELETED: '영구 삭제된 조직은 복구할 수 없습니다.',
  INVALID_EMAIL_FORMAT: '올바른 이메일 형식이 아닙니다.',
  INVALID_SLUG_FORMAT: '올바른 슬러그 형식이 아닙니다.',
  INVALID_USER_ID: '올바르지 않은 사용자 ID입니다.',
  INVALID_ORGANIZATION_ID: '올바르지 않은 조직 ID입니다.',
  INVALID_MEMBERSHIP_ID: '올바르지 않은 멤버십 ID입니다.',
  MEMBERSHIP_ALREADY_EXISTS: '이미 조직의 멤버입니다.',
  MEMBERSHIP_NOT_ACTIVE: '활성화되지 않은 멤버십입니다.',
  MEMBERSHIP_ALREADY_DELETED: '이미 삭제된 멤버십입니다.',
  INSUFFICIENT_PERMISSIONS: '권한이 부족합니다.',
  INVITATION_EXPIRED: '초대 링크가 만료되었습니다.',
  INVITATION_NOT_PENDING: '대기 중인 초대가 아닙니다.',
  CANNOT_TRANSFER_DEFAULT: '기본 조직의 소유권은 이전할 수 없습니다.',
  CANNOT_DELETE_DEFAULT: '기본 조직은 삭제할 수 없습니다.',
  CANNOT_CHANGE_OWN_ROLE: '자신의 역할은 변경할 수 없습니다.',
  CANNOT_REMOVE_SELF: '자신을 조직에서 제거할 수 없습니다.',
  USER_NOT_MEMBER: '조직의 멤버가 아닙니다.',
  CLERK_SYNC_FAILED: '외부 인증 시스템과 동기화에 실패했습니다.',
  CLERK_ID_MISMATCH: 'Clerk ID가 일치하지 않습니다.'
};
```

---

## 🔧 Service & Repository 계획

### 1. Service 레이어

#### UserManagementService
```typescript
// apps/web/src/domains/user-management/services/user-management.service.ts
export class UserManagementService {
  constructor(
    private userRepository: UserRepository,
    private organizationRepository: OrganizationRepository,
    private membershipRepository: MembershipRepository,
    private clerkService: ClerkService
  ) {}

  async syncUserFromClerk(clerkUserId: string): Promise<Result<UserAggregate, UserManagementError>> {
    try {
      // 1. Clerk에서 사용자 정보 조회
      const clerkUser = await this.clerkService.getUser(clerkUserId);
      if (!clerkUser) {
        return Result.error(new UserManagementError('USER_NOT_FOUND', 'User not found in Clerk'));
      }

      // 2. 기존 사용자 확인
      const existingUser = await this.userRepository.findByClerkId(clerkUserId);
      
      if (existingUser) {
        // 업데이트
        const event = existingUser.updateFromClerkUser(clerkUser);
        await this.userRepository.save(existingUser);
        return Result.success(existingUser);
      } else {
        // 신규 생성
        const newUser = UserAggregate.createFromClerkUser(clerkUser);
        await this.userRepository.save(newUser);
        
        // 기본 조직 생성
        await this.createDefaultOrganization(newUser);
        
        return Result.success(newUser);
      }
    } catch (error) {
      return Result.error(new UserManagementError('CLERK_SYNC_FAILED', 'Failed to sync user from Clerk', { error }));
    }
  }

  async inviteUserToOrganization(
    command: InviteUserToOrganizationCommand
  ): Promise<Result<void, UserManagementError>> {
    // 1. 권한 검증
    const inviter = await this.userRepository.findById(new UserId(command.inviterUserId));
    if (!inviter) {
      return Result.error(new UserManagementError('USER_NOT_FOUND', 'Inviter not found'));
    }

    const membership = await this.membershipRepository.findByUserAndOrganization(
      inviter.id, 
      new OrganizationId(command.organizationId)
    );
    
    if (!membership || !membership.canInviteMembers()) {
      return Result.error(new UserManagementError('INSUFFICIENT_PERMISSIONS', 'Cannot invite members'));
    }

    // 2. Clerk를 통한 초대
    try {
      const invitation = await this.clerkService.inviteUser({
        emailAddress: command.inviteeEmail,
        organizationId: command.organizationId,
        role: command.role
      });

      // 3. 내부 초대 기록 생성
      // ... 초대 로직 구현

      return Result.success(undefined);
    } catch (error) {
      return Result.error(new UserManagementError('CLERK_SYNC_FAILED', 'Failed to send invitation', { error }));
    }
  }

  private async createDefaultOrganization(user: UserAggregate): Promise<void> {
    // 기본 조직 생성 로직
    const orgName = `${user.entity.name}'s Organization`;
    const orgSlug = OrganizationSlug.fromName(orgName);
    
    // Clerk에 조직 생성
    const clerkOrg = await this.clerkService.createOrganization({
      name: orgName,
      slug: orgSlug.value,
      createdBy: user.entity.clerkId
    });

    // 내부 조직 생성
    const organization = OrganizationAggregate.create(
      orgName,
      orgSlug,
      clerkOrg.id,
      user.id
    );
    
    await this.organizationRepository.save(organization);
  }
}
```

### 2. Repository 레이어

#### UserRepository
```typescript
// apps/web/src/domains/user-management/repositories/user.repository.ts
export interface UserRepository {
  findById(id: UserId): Promise<UserAggregate | null>;
  findByClerkId(clerkId: string): Promise<UserAggregate | null>;
  findByEmail(email: UserEmail): Promise<UserAggregate | null>;
  save(user: UserAggregate): Promise<void>;
  delete(id: UserId): Promise<void>;
}

export class DrizzleUserRepository implements UserRepository {
  constructor(private db: Database) {}

  async findById(id: UserId): Promise<UserAggregate | null> {
    const result = await this.db
      .select()
      .from(users)
      .leftJoin(memberships, eq(users.id, memberships.userId))
      .leftJoin(organizations, eq(memberships.organizationId, organizations.id))
      .where(eq(users.id, id.value));

    if (result.length === 0) return null;

    return this.mapToAggregate(result);
  }

  async findByClerkId(clerkId: string): Promise<UserAggregate | null> {
    const result = await this.db
      .select()
      .from(users)
      .leftJoin(memberships, eq(users.id, memberships.userId))
      .where(eq(users.clerkId, clerkId));

    if (result.length === 0) return null;

    return this.mapToAggregate(result);
  }

  async save(userAggregate: UserAggregate): Promise<void> {
    await this.db.transaction(async (tx) => {
      // User 저장
      await tx
        .insert(users)
        .values({
          id: userAggregate.id.value,
          clerkId: userAggregate.entity.clerkId,
          email: userAggregate.entity.email.value,
          name: userAggregate.entity.name,
          avatarUrl: userAggregate.entity.avatarUrl,
          createdAt: userAggregate.entity.createdAt,
          updatedAt: userAggregate.entity.updatedAt,
          deletedAt: userAggregate.entity.deletedAt
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: userAggregate.entity.email.value,
            name: userAggregate.entity.name,
            avatarUrl: userAggregate.entity.avatarUrl,
            updatedAt: userAggregate.entity.updatedAt,
            deletedAt: userAggregate.entity.deletedAt
          }
        });
    });
  }

  private mapToAggregate(result: any[]): UserAggregate {
    // DB 결과를 UserAggregate로 변환하는 로직
    // ...
  }
}
```

#### OrganizationRepository
```typescript
// apps/web/src/domains/user-management/repositories/organization.repository.ts
export interface OrganizationRepository {
  findById(id: OrganizationId): Promise<OrganizationAggregate | null>;
  findByClerkId(clerkId: string): Promise<OrganizationAggregate | null>;
  findByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]>;
  findBySlug(slug: OrganizationSlug): Promise<OrganizationAggregate | null>;
  save(organization: OrganizationAggregate): Promise<void>;
  delete(id: OrganizationId): Promise<void>;
  findSoftDeleted(): Promise<OrganizationAggregate[]>;
}

export class DrizzleOrganizationRepository implements OrganizationRepository {
  constructor(private db: Database) {}

  async findById(id: OrganizationId): Promise<OrganizationAggregate | null> {
    const result = await this.db
      .select()
      .from(organizations)
      .leftJoin(memberships, eq(organizations.id, memberships.organizationId))
      .leftJoin(users, eq(memberships.userId, users.id))
      .where(eq(organizations.id, id.value));

    if (result.length === 0) return null;

    return this.mapToAggregate(result);
  }

  async findByClerkId(clerkId: string): Promise<OrganizationAggregate | null> {
    const result = await this.db
      .select()
      .from(organizations)
      .leftJoin(memberships, eq(organizations.id, memberships.organizationId))
      .leftJoin(users, eq(memberships.userId, users.id))
      .where(eq(organizations.clerkId, clerkId));

    if (result.length === 0) return null;

    return this.mapToAggregate(result);
  }

  async findByOwnerId(ownerId: UserId): Promise<OrganizationAggregate[]> {
    const result = await this.db
      .select()
      .from(organizations)
      .leftJoin(memberships, eq(organizations.id, memberships.organizationId))
      .leftJoin(users, eq(memberships.userId, users.id))
      .where(eq(organizations.ownerId, ownerId.value));

    return this.mapToAggregates(result);
  }

  async save(organizationAggregate: OrganizationAggregate): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Organization 저장
      await tx
        .insert(organizations)
        .values({
          id: organizationAggregate.id.value,
          clerkId: organizationAggregate.entity.clerkId,
          name: organizationAggregate.entity.name,
          slug: organizationAggregate.entity.slug.value,
          ownerId: organizationAggregate.entity.ownerId.value,
          isDefault: organizationAggregate.entity.isDefault,
          createdAt: organizationAggregate.entity.createdAt,
          updatedAt: organizationAggregate.entity.updatedAt,
          deletedAt: organizationAggregate.entity.deletedAt
        })
        .onConflictDoUpdate({
          target: organizations.id,
          set: {
            name: organizationAggregate.entity.name,
            slug: organizationAggregate.entity.slug.value,
            ownerId: organizationAggregate.entity.ownerId.value,
            updatedAt: organizationAggregate.entity.updatedAt,
            deletedAt: organizationAggregate.entity.deletedAt
          }
        });

      // Memberships 저장
      for (const membership of organizationAggregate.getActiveMembers()) {
        await tx
          .insert(memberships)
          .values({
            id: membership.id.value,
            organizationId: membership.organizationId.value,
            userId: membership.userId?.value,
            role: membership.role,
            invitedBy: membership.invitedBy?.value,
            invitedAt: membership.invitedAt,
            joinedAt: membership.joinedAt,
            status: membership.status,
            createdAt: membership.createdAt,
            updatedAt: membership.updatedAt,
            deletedAt: membership.deletedAt
          })
          .onConflictDoUpdate({
            target: memberships.id,
            set: {
              role: membership.role,
              status: membership.status,
              updatedAt: membership.updatedAt,
              deletedAt: membership.deletedAt
            }
          });
      }
    });
  }

  private mapToAggregate(result: any[]): OrganizationAggregate {
    // DB 결과를 OrganizationAggregate로 변환하는 로직
    // ...
  }

  private mapToAggregates(result: any[]): OrganizationAggregate[] {
    // DB 결과를 OrganizationAggregate 배열로 변환하는 로직
    // ...
  }
}
```

#### MembershipRepository
```typescript
// apps/web/src/domains/user-management/repositories/membership.repository.ts
export interface MembershipRepository {
  findById(id: MembershipId): Promise<MembershipAggregate | null>;
  findByUserAndOrganization(userId: UserId, organizationId: OrganizationId): Promise<MembershipAggregate | null>;
  findByOrganization(organizationId: OrganizationId): Promise<MembershipAggregate[]>;
  findByUser(userId: UserId): Promise<MembershipAggregate[]>;
  findByInviteeEmail(email: UserEmail): Promise<MembershipAggregate[]>;
  save(membership: MembershipAggregate): Promise<void>;
  delete(id: MembershipId): Promise<void>;
  findPendingInvitations(): Promise<MembershipAggregate[]>;
}

export class DrizzleMembershipRepository implements MembershipRepository {
  constructor(private db: Database) {}

  async findById(id: MembershipId): Promise<MembershipAggregate | null> {
    const result = await this.db
      .select()
      .from(memberships)
      .leftJoin(organizations, eq(memberships.organizationId, organizations.id))
      .leftJoin(users, eq(memberships.userId, users.id))
      .where(eq(memberships.id, id.value));

    if (result.length === 0) return null;

    return this.mapToAggregate(result[0]);
  }

  async findByUserAndOrganization(
    userId: UserId, 
    organizationId: OrganizationId
  ): Promise<MembershipAggregate | null> {
    const result = await this.db
      .select()
      .from(memberships)
      .leftJoin(organizations, eq(memberships.organizationId, organizations.id))
      .leftJoin(users, eq(memberships.userId, users.id))
      .where(and(
        eq(memberships.userId, userId.value),
        eq(memberships.organizationId, organizationId.value),
        isNull(memberships.deletedAt)
      ));

    if (result.length === 0) return null;

    return this.mapToAggregate(result[0]);
  }

  async findByOrganization(organizationId: OrganizationId): Promise<MembershipAggregate[]> {
    const result = await this.db
      .select()
      .from(memberships)
      .leftJoin(organizations, eq(memberships.organizationId, organizations.id))
      .leftJoin(users, eq(memberships.userId, users.id))
      .where(and(
        eq(memberships.organizationId, organizationId.value),
        isNull(memberships.deletedAt)
      ));

    return result.map(row => this.mapToAggregate(row));
  }

  async findByUser(userId: UserId): Promise<MembershipAggregate[]> {
    const result = await this.db
      .select()
      .from(memberships)
      .leftJoin(organizations, eq(memberships.organizationId, organizations.id))
      .leftJoin(users, eq(memberships.userId, users.id))
      .where(and(
        eq(memberships.userId, userId.value),
        isNull(memberships.deletedAt)
      ));

    return result.map(row => this.mapToAggregate(row));
  }

  async save(membershipAggregate: MembershipAggregate): Promise<void> {
    await this.db
      .insert(memberships)
      .values({
        id: membershipAggregate.id.value,
        organizationId: membershipAggregate.organizationId.value,
        userId: membershipAggregate.userId?.value,
        role: membershipAggregate.role,
        invitedBy: membershipAggregate.entity.invitedBy?.value,
        invitedAt: membershipAggregate.entity.invitedAt,
        joinedAt: membershipAggregate.entity.joinedAt,
        status: membershipAggregate.status,
        createdAt: membershipAggregate.entity.createdAt,
        updatedAt: membershipAggregate.entity.updatedAt,
        deletedAt: membershipAggregate.entity.deletedAt
      })
      .onConflictDoUpdate({
        target: memberships.id,
        set: {
          role: membershipAggregate.role,
          status: membershipAggregate.status,
          updatedAt: membershipAggregate.entity.updatedAt,
          deletedAt: membershipAggregate.entity.deletedAt
        }
      });
  }

  private mapToAggregate(result: any): MembershipAggregate {
    // DB 결과를 MembershipAggregate로 변환하는 로직
    // ...
  }
}
```

### 3. Read Models 구현

#### UserOrganizationView
```typescript
// apps/web/src/domains/user-management/read-models/user-organization.view.ts
export interface UserOrganizationView {
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  organizations: {
    id: string;
    name: string;
    slug: string;
    role: MembershipRole;
    isDefault: boolean;
    memberCount: number;
  }[];
  currentOrganizationId: string | null;
}

export class UserOrganizationViewRepository {
  constructor(private db: Database) {}

  async getByUserId(userId: string): Promise<UserOrganizationView | null> {
    // 복잡한 조인 쿼리로 사용자와 조직 정보를 한 번에 조회
    const result = await this.db
      .select({
        userId: users.id,
        userName: users.name,
        userEmail: users.email,
        userAvatarUrl: users.avatarUrl,
        orgId: organizations.id,
        orgName: organizations.name,
        orgSlug: organizations.slug,
        membershipRole: memberships.role,
        membershipIsDefault: memberships.isDefault,
        memberCount: sql<number>`count(${memberships.id}) over (partition by ${organizations.id})`
      })
      .from(users)
      .leftJoin(memberships, eq(users.id, memberships.userId))
      .leftJoin(organizations, eq(memberships.organizationId, organizations.id))
      .where(and(
        eq(users.id, userId),
        isNull(users.deletedAt),
        isNull(memberships.deletedAt),
        isNull(organizations.deletedAt)
      ));

    if (result.length === 0) return null;

    // 결과를 UserOrganizationView 형태로 변환
    const user = result[0];
    const organizations = result
      .filter(r => r.orgId)
      .map(r => ({
        id: r.orgId!,
        name: r.orgName!,
        slug: r.orgSlug!,
        role: r.membershipRole!,
        isDefault: r.membershipIsDefault!,
        memberCount: r.memberCount
      }));

    return {
      user: {
        id: user.userId,
        name: user.userName,
        email: user.userEmail,
        avatarUrl: user.userAvatarUrl
      },
      organizations,
      currentOrganizationId: organizations.find(o => o.isDefault)?.id || null
    };
  }
}
```

---

## 🌐 Anti-Corruption Layer & Server Actions

### 1. Clerk Anti-Corruption Layer

```typescript
// apps/web/src/domains/user-management/infrastructure/clerk.service.ts
export class ClerkService {
  constructor(private clerkClient: ClerkClient) {}

  async getUser(clerkUserId: string): Promise<ClerkUser | null> {
    try {
      const user = await this.clerkClient.users.getUser(clerkUserId);
      return this.mapClerkUser(user);
    } catch (error) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  async inviteUser(params: {
    emailAddress: string;
    organizationId: string;
    role: string;
  }): Promise<ClerkInvitation> {
    const invitation = await this.clerkClient.organizations.createOrganizationInvitation({
      organizationId: params.organizationId,
      emailAddress: params.emailAddress,
      role: params.role
    });

    return this.mapClerkInvitation(invitation);
  }

  private mapClerkUser(clerkUser: any): ClerkUser {
    return {
      id: clerkUser.id,
      emailAddresses: clerkUser.emailAddresses,
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      imageUrl: clerkUser.imageUrl
    };
  }

  private mapClerkInvitation(invitation: any): ClerkInvitation {
    return {
      id: invitation.id,
      emailAddress: invitation.emailAddress,
      organizationId: invitation.organizationId,
      status: invitation.status
    };
  }
}
```

### 2. Server Actions

```typescript
// apps/web/src/domains/user-management/actions/user-management.actions.ts
export async function syncUserFromClerkAction(
  clerkUserId: string
): Promise<Result<UserOrganizationView, UserManagementError>> {
  try {
    // 의존성 주입
    const userRepository = new DrizzleUserRepository(db);
    const organizationRepository = new DrizzleOrganizationRepository(db);
    const membershipRepository = new DrizzleMembershipRepository(db);
    const clerkService = new ClerkService(clerkClient);
    
    const service = new UserManagementService(
      userRepository,
      organizationRepository,
      membershipRepository,
      clerkService
    );

    // 비즈니스 로직 실행
    const result = await service.syncUserFromClerk(clerkUserId);
    
    if (result.isError()) {
      return Result.error(result.error);
    }

    // Read Model 조회
    const viewRepository = new UserOrganizationViewRepository(db);
    const view = await viewRepository.getByUserId(result.value.id.value);
    
    if (!view) {
      return Result.error(new UserManagementError('USER_NOT_FOUND', 'User view not found'));
    }

    return Result.success(view);
  } catch (error) {
    console.error('syncUserFromClerkAction error:', error);
    return Result.error(new UserManagementError('CLERK_SYNC_FAILED', 'Unexpected error occurred'));
  }
}

export async function inviteUserToOrganizationAction(
  command: InviteUserToOrganizationCommand
): Promise<Result<void, UserManagementError>> {
  try {
    // Input validation
    const validatedCommand = InviteUserToOrganizationCommandSchema.parse(command);
    
    // 의존성 주입
    const service = new UserManagementService(
      new DrizzleUserRepository(db),
      new DrizzleOrganizationRepository(db),
      new DrizzleMembershipRepository(db),
      new ClerkService(clerkClient)
    );

    return await service.inviteUserToOrganization(validatedCommand);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Result.error(new UserManagementError('INVALID_INPUT', 'Invalid input data'));
    }
    
    console.error('inviteUserToOrganizationAction error:', error);
    return Result.error(new UserManagementError('INVITATION_FAILED', 'Failed to send invitation'));
  }
}
```

### 3. Webhook 처리

```typescript
// apps/web/src/app/api/webhooks/clerk/route.ts
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const headers = request.headers;
    
    // Webhook 검증
    const isValid = await verifyClerkWebhook(payload, headers);
    if (!isValid) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 이벤트 타입별 처리
    switch (payload.type) {
      case 'user.created':
      case 'user.updated':
        const result = await syncUserFromClerkAction(payload.data.id);
        if (result.isError()) {
          console.error('Webhook user sync failed:', result.error);
          return new Response('Internal Server Error', { status: 500 });
        }
        break;
        
      case 'organization.created':
        // 조직 생성 처리
        break;
        
      case 'organizationMembership.created':
        // 멤버십 생성 처리
        break;
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Clerk webhook error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
```

---

## 🧪 Testing Strategy

### 1. Unit Tests

#### Aggregate 테스트
```typescript
// apps/web/src/domains/user-management/aggregates/__tests__/user.aggregate.test.ts
describe('UserAggregate', () => {
  describe('createFromClerkUser', () => {
    it('should create user aggregate from clerk user data', () => {
      const clerkUser = {
        id: 'clerk_123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'John',
        lastName: 'Doe',
        imageUrl: 'https://example.com/avatar.jpg'
      };

      const aggregate = UserAggregate.createFromClerkUser(clerkUser);

      expect(aggregate.entity.clerkId).toBe('clerk_123');
      expect(aggregate.entity.email.value).toBe('test@example.com');
      expect(aggregate.entity.name).toBe('John Doe');
    });
  });

  describe('canJoinOrganization', () => {
    it('should return false if user is deleted', () => {
      const user = createTestUser();
      user.entity.softDelete();
      const aggregate = new UserAggregate(user);

      const result = aggregate.canJoinOrganization(new OrganizationId('org_123'));

      expect(result).toBe(false);
    });

    it('should return false if user is already a member', () => {
      const user = createTestUser();
      const orgId = new OrganizationId('org_123');
      const membership = createTestMembership(user.id, orgId);
      const aggregate = new UserAggregate(user, [membership]);

      const result = aggregate.canJoinOrganization(orgId);

      expect(result).toBe(false);
    });
  });
});
```

### 2. Integration Tests

#### Server Actions 테스트
```typescript
// apps/web/src/domains/user-management/actions/__tests__/user-management.actions.test.ts
describe('User Management Actions', () => {
  let testDb: Database;
  
  beforeEach(async () => {
    testDb = await createTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase(testDb);
  });

  describe('syncUserFromClerkAction', () => {
    it('should sync new user from clerk', async () => {
      // Mock Clerk API
      const mockClerkService = {
        getUser: jest.fn().mockResolvedValue({
          id: 'clerk_123',
          emailAddresses: [{ emailAddress: 'test@example.com' }],
          firstName: 'John',
          lastName: 'Doe',
          imageUrl: null
        })
      };

      const result = await syncUserFromClerkAction('clerk_123');

      expect(result.isSuccess()).toBe(true);
      expect(result.value.user.email).toBe('test@example.com');
    });

    it('should handle clerk user not found', async () => {
      const mockClerkService = {
        getUser: jest.fn().mockResolvedValue(null)
      };

      const result = await syncUserFromClerkAction('nonexistent');

      expect(result.isError()).toBe(true);
      expect(result.error.code).toBe('USER_NOT_FOUND');
    });
  });
});
```

### 3. CI/CD 체크리스트

```yaml
# .github/workflows/user-management-tests.yml
name: User Management Domain Tests

on:
  push:
    paths:
      - 'apps/web/src/domains/user-management/**'
  pull_request:
    paths:
      - 'apps/web/src/domains/user-management/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run unit tests
        run: pnpm test:unit --testPathPattern=user-management
      
      - name: Run integration tests
        run: pnpm test:integration --testPathPattern=user-management
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
          CLERK_SECRET_KEY: ${{ secrets.TEST_CLERK_SECRET_KEY }}
      
      - name: Check test coverage
        run: pnpm test:coverage --testPathPattern=user-management
        env:
          COVERAGE_THRESHOLD: 80
```

---

## 📋 검증 체크리스트

### 설계 일관성
- [ ] 모든 Command에 입력 검증 로직이 정의되어 있는가?
- [ ] Repository가 반환하는 Entity의 불변식이 깨지지 않는가?
- [ ] Clerk 연동 실패 시 사용자 경험이 명확한가?
- [ ] 소프트 삭제된 엔티티에 대한 처리가 일관되는가?

### 보안 및 성능
- [ ] Webhook 엔드포인트가 적절히 보호되어 있는가?
- [ ] 사용자 권한 검증이 모든 작업에서 수행되는가?
- [ ] Read Model 쿼리가 최적화되어 있는가?
- [ ] 민감한 정보(이메일, 개인정보)가 적절히 보호되는가?

### 테스트 커버리지
- [ ] 모든 Aggregate의 핵심 비즈니스 로직이 테스트되는가?
- [ ] Happy path와 edge case가 모두 다뤄지는가?
- [ ] 외부 의존성(Clerk)에 대한 적절한 Mock이 있는가?
- [ ] Integration test가 실제 데이터베이스 상호작용을 검증하는가?

---

이 Technical Specification은 User Management Domain의 Software Design을 기반으로 실제 구현 가능한 코드 구조와 패턴을 제시합니다. 구현 시 이 문서를 참고하여 일관된 아키텍처를 유지하시기 바랍니다.
