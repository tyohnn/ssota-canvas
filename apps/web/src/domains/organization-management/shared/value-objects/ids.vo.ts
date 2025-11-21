// apps/web/src/domains/organization-management/shared/value-objects/ids.vo.ts

import { OrganizationManagementError } from '../errors/organization-management.error';

export class OrganizationId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new OrganizationManagementError(
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

export class InvitationId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new OrganizationManagementError(
        'INVALID_INVITATION_ID',
        'Invitation ID cannot be empty'
      );
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  equals(other: InvitationId): boolean {
    return this._value === other._value;
  }

  static generate(): InvitationId {
    return new InvitationId(crypto.randomUUID());
  }
}

export class NotificationId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new OrganizationManagementError(
        'INVALID_NOTIFICATION_ID',
        'Notification ID cannot be empty'
      );
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  equals(other: NotificationId): boolean {
    return this._value === other._value;
  }

  static generate(): NotificationId {
    return new NotificationId(crypto.randomUUID());
  }
}

// Re-export UserId from user-management for cross-domain usage
export { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
