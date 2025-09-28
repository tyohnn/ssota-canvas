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

  get value() {
    return this._value;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  equals(other: UserEmail): boolean {
    return this.value === other.value;
  }

  getDomain(): string {
    const parts = this.value.split('@');
    return parts.length > 1 ? parts[1] : '';
  }
}
