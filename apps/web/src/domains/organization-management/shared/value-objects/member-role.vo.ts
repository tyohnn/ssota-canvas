// apps/web/src/domains/organization-management/shared/value-objects/member-role.vo.ts

import { OrganizationManagementError } from '../errors/organization-management.error';

export type MemberRoleType = 'owner' | 'admin' | 'member';

export class MemberRole {
  private readonly _value: MemberRoleType;

  constructor(value: MemberRoleType) {
    if (!['owner', 'admin', 'member'].includes(value)) {
      throw new OrganizationManagementError(
        'INVALID_MEMBER_ROLE',
        `Invalid member role: ${value}`
      );
    }
    this._value = value;
  }

  get value(): MemberRoleType {
    return this._value;
  }

  equals(other: MemberRole): boolean {
    return this._value === other._value;
  }

  // 권한 체크 메서드
  canInviteMembers(): boolean {
    return this._value === 'owner' || this._value === 'admin';
  }

  canManageOrganization(): boolean {
    return this._value === 'owner' || this._value === 'admin';
  }

  canTransferOwnership(): boolean {
    return this._value === 'owner';
  }

  isOwner(): boolean {
    return this._value === 'owner';
  }

  isAdmin(): boolean {
    return this._value === 'admin';
  }

  isMember(): boolean {
    return this._value === 'member';
  }
}
