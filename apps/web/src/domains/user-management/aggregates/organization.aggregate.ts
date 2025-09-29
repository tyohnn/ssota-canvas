import { Organization } from '../entities/organization.entity';
import { Membership } from '../entities/membership.entity';
import { OrganizationId, UserId, OrganizationSlug } from '../value-objects/ids.vo';
import { UserManagementError } from '../errors/user-management.error';

// Commands
export interface CreateDefaultOrganizationCommand {
  userId: UserId;
  userEmail: string;
  userName: string;
  clerkUserId: string;
  timestamp: Date;
}

export interface CreateOrganizationCommand {
  name: string;
  description?: string;
  slug?: string;
  createdBy: UserId;
  timestamp: Date;
}

export interface UpdateOrganizationCommand {
  organizationId: OrganizationId;
  name?: string;
  description?: string;
  slug?: string;
  updatedBy: UserId;
  timestamp: Date;
}

export interface DeleteOrganizationCommand {
  organizationId: OrganizationId;
  organizationName: string;
  deletedBy: UserId;
  timestamp: Date;
}

export interface RestoreOrganizationCommand {
  organizationId: OrganizationId;
  restoredBy: UserId;
  timestamp: Date;
}

export interface TransferOrganizationOwnershipCommand {
  organizationId: OrganizationId;
  currentOwnerId: UserId;
  newOwnerId: UserId;
  confirmationCode: string;
  timestamp: Date;
}

// Events
export class DefaultOrganizationCreatedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly userId: UserId,
    public readonly organizationName: string,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationCreatedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly name: string,
    public readonly slug: OrganizationSlug,
    public readonly createdBy: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationUpdatedEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly updatedFields: string[],
    public readonly updatedBy: UserId,
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

export class OwnershipTransferredEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly previousOwnerId: UserId,
    public readonly newOwnerId: UserId,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class OrganizationAggregate {
  constructor(
    private organization: Organization,
    private memberships: Membership[] = []
  ) {}

  // Command 처리
  static createDefaultOrganization(
    command: CreateDefaultOrganizationCommand
  ): { organization: OrganizationAggregate; event: DefaultOrganizationCreatedEvent } {
    const orgName = `${command.userName}의 개인 조직`;
    const orgSlug = OrganizationSlug.fromName(orgName);

    const organization = new Organization(
      OrganizationId.generate(),
      `org_${command.clerkUserId}`,
      orgName,
      orgSlug,
      command.userId,
      true, // isDefault
      new Date(),
      new Date()
    );

    const event = new DefaultOrganizationCreatedEvent(
      organization.id,
      command.userId,
      orgName
    );

    return { organization: new OrganizationAggregate(organization), event };
  }

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

  updateFromClerkOrganization(clerkOrg: any): OrganizationUpdatedEvent {
    const hasChanges =
      this.organization.name !== clerkOrg.name ||
      this.organization.slug.value !== clerkOrg.slug;

    if (hasChanges) {
      this.organization.updateName(clerkOrg.name);
      this.organization.updateSlug(new OrganizationSlug(clerkOrg.slug));
      return new OrganizationUpdatedEvent(
        this.organization.id,
        ['name', 'slug'],
        this.organization.ownerId
      );
    }

    return new OrganizationUpdatedEvent(
      this.organization.id,
      [],
      this.organization.ownerId
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
      m.userId?.equals(newOwnerId) && !m.isDeleted
    );

    if (!newOwnerMembership) {
      throw new UserManagementError('USER_NOT_MEMBER', 'New owner must be a member of the organization');
    }

    // 소유권 이전
    this.organization.transferOwnership(newOwnerId);

    // 기존 소유자를 Admin으로 변경
    const currentOwnerMembership = this.memberships.find(m =>
      m.userId?.equals(currentOwnerId) && !m.isDeleted
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