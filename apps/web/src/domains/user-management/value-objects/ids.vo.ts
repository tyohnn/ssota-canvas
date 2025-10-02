// apps/web/src/domains/user-management/value-objects/ids.vo.ts

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

  get value(): string {
    return this._value;
  }

  equals(other: UserId): boolean {
    return this._value === other._value;
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

  get value(): string {
    return this._value;
  }

  equals(other: OrganizationId): boolean {
    return this._value === other._value;
  }

  static generate(): OrganizationId {
    return new OrganizationId(crypto.randomUUID());
  }
}
