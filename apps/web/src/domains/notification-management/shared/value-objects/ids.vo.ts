// apps/web/src/domains/notification-management/shared/value-objects/ids.vo.ts

export class NotificationId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Notification ID cannot be empty');
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

// Re-export from other domains
export { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';
export {
  InvitationId,
  OrganizationId,
} from '@/domains/organization-management/shared/value-objects/ids.vo';
