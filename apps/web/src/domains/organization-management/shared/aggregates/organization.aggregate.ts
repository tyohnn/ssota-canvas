// apps/web/src/domains/organization-management/shared/aggregates/organization.aggregate.ts

import { Organization } from '../entities/organization.entity';
import { OrganizationId, UserId } from '../value-objects/ids.vo';
import { OrganizationType } from '../types';
import {
  DefaultOrganizationCreatedEvent,
  NewOrganizationCreatedEvent,
  OrganizationUpdatedEvent,
  MemberPromotedToAdminEvent,
  AdminDemotedToMemberEvent,
} from '../events';
import { OrganizationManagementError } from '../errors/organization-management.error';

export class OrganizationAggregate {
  constructor(private organization: Organization) {}

  // Command 처리
  static createDefault(name: string, ownerId: UserId): OrganizationAggregate {
    const organization = new Organization(
      OrganizationId.generate(),
      name,
      'personal', // 기본 조직은 개인 타입
      ownerId,
      true, // isDefault
      new Date(),
      new Date()
    );
    return new OrganizationAggregate(organization);
  }

  static createNew(
    name: string,
    organizationType: OrganizationType,
    ownerId: UserId
  ): OrganizationAggregate {
    const organization = new Organization(
      OrganizationId.generate(),
      name,
      organizationType,
      ownerId,
      false, // isDefault - 새로운 조직은 기본 조직이 아님
      new Date(),
      new Date()
    );
    return new OrganizationAggregate(organization);
  }

  updateName(name: string): OrganizationUpdatedEvent {
    this.organization.updateName(name);
    return new OrganizationUpdatedEvent(
      this.organization.id,
      this.organization.name
    );
  }

  transferOwnership(newOwnerId: UserId): void {
    this.organization.transferOwnership(newOwnerId);
  }

  changeMemberRole(
    targetUserId: UserId,
    currentUserId: UserId,
    currentUserRole: 'owner' | 'admin' | 'member',
    targetMemberRole: 'owner' | 'admin' | 'member',
    newRole: 'admin' | 'member'
  ): MemberPromotedToAdminEvent | AdminDemotedToMemberEvent {
    // 1. 권한 검증: 일반 멤버는 역할 변경 권한 없음
    if (currentUserRole === 'member') {
      throw new OrganizationManagementError(
        'INSUFFICIENT_PERMISSIONS',
        'Member does not have permission to change roles'
      );
    }

    // 2. 소유자 역할 변경 방지
    if (targetMemberRole === 'owner') {
      throw new OrganizationManagementError(
        'CANNOT_CHANGE_OWNER_ROLE',
        'Owner role can only be changed through ownership transfer'
      );
    }

    // 3. 자기 자신 역할 변경 방지
    if (targetUserId.equals(currentUserId)) {
      throw new OrganizationManagementError(
        'CANNOT_CHANGE_OWN_ROLE',
        'Cannot change your own role'
      );
    }

    // 4. 현재 역할과 동일한 역할로 변경 방지
    if (targetMemberRole === newRole) {
      throw new OrganizationManagementError(
        'ROLE_ALREADY_ASSIGNED',
        `User already has ${newRole} role`
      );
    }

    // 5. 관리자는 관리자를 강등할 수 없음
    if (currentUserRole === 'admin' && targetMemberRole === 'admin') {
      throw new OrganizationManagementError(
        'ADMIN_CANNOT_DEMOTE_ADMIN',
        'Admin cannot demote another admin'
      );
    }

    // 6. 이벤트 발행
    if (targetMemberRole === 'member' && newRole === 'admin') {
      // 멤버 → 관리자 승격
      return new MemberPromotedToAdminEvent(
        this.organization.id,
        targetUserId,
        currentUserId,
        newRole
      );
    } else if (targetMemberRole === 'admin' && newRole === 'member') {
      // 관리자 → 멤버 강등
      return new AdminDemotedToMemberEvent(
        this.organization.id,
        targetUserId,
        currentUserId,
        newRole
      );
    } else {
      throw new OrganizationManagementError(
        'INVALID_ROLE_CHANGE',
        'Invalid role change combination'
      );
    }
  }

  // Getters
  get id(): OrganizationId {
    return this.organization.id;
  }

  get entity(): Organization {
    return this.organization;
  }

  get ownerId(): UserId {
    return this.organization.ownerId;
  }

  get isDefault(): boolean {
    return this.organization.isDefault;
  }
}
