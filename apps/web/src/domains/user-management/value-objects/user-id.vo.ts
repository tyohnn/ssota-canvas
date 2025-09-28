import { UserManagementError } from '../errors/user-management.error';

export class UserId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new UserManagementError('INVALID_USER_ID', 'User ID cannot be empty');
    }
    this._value = value;
  }

  get value() { return this._value; }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  static generate(): UserId {
    return new UserId(crypto.randomUUID());
  }
}