import { UserManagementError } from '../errors/user-management.error';

export class OrganizationSlug {
  private readonly _value: string;

  constructor(value: string) {
    if (value.length < 3 || value.length > 50) {
      throw new UserManagementError(
        'INVALID_SLUG_LENGTH',
        'Slug must be between 3 and 50 characters'
      );
    }
    if (!/^[a-z0-9-]+$/.test(value)) {
      throw new UserManagementError(
        'INVALID_SLUG_FORMAT',
        'Slug can only contain lowercase letters, numbers, and hyphens'
      );
    }
    this._value = value;
  }

  get value() {
    return this._value;
  }

  equals(other: OrganizationSlug): boolean {
    return this.value === other.value;
  }

  static fromName(name: string): OrganizationSlug {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    return new OrganizationSlug(slug);
  }
}