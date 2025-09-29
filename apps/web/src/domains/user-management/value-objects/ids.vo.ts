import { UserManagementError } from '../errors/user-management.error';

export class UserId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new UserManagementError(
        'INVALID_USER_ID',
        'User ID cannot be empty'
      );
    }
    this._value = value;
  }

  get value() {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  static generate(): UserId {
    return new UserId(crypto.randomUUID());
  }
}

export class OrganizationId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new UserManagementError(
        'INVALID_ORGANIZATION_ID',
        'Organization ID cannot be empty'
      );
    }
    this._value = value;
  }

  get value() {
    return this._value;
  }

  equals(other: OrganizationId): boolean {
    return this.value === other.value;
  }

  static generate(): OrganizationId {
    return new OrganizationId(crypto.randomUUID());
  }
}

export class MembershipId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new UserManagementError(
        'INVALID_MEMBERSHIP_ID',
        'Membership ID cannot be empty'
      );
    }
    this._value = value;
  }

  get value() {
    return this._value;
  }

  equals(other: MembershipId): boolean {
    return this.value === other.value;
  }

  static generate(): MembershipId {
    return new MembershipId(crypto.randomUUID());
  }
}

export type MembershipRole = 'owner' | 'admin' | 'member';
export type MembershipStatus = 'pending' | 'active' | 'removed';