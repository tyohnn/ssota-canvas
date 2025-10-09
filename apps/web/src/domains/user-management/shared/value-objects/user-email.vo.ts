// apps/web/src/domains/user-management/value-objects/user-email.vo.ts

import { UserManagementError } from '../errors/user-management.error';

export class UserEmail {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValidEmail(value)) {
      throw new UserManagementError(
        'INVALID_EMAIL_FORMAT',
        'Invalid email format'
      );
    }
    this._value = value;
  }

  get value(): string {
    return this._value;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  equals(other: UserEmail): boolean {
    return this._value === other._value;
  }

  getDomain(): string {
    return this._value.split('@')[1] || '';
  }
}
