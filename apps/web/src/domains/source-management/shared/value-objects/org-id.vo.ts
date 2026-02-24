import { SourceManagementError } from '../errors/source-management.error';

/**
 * Organization ID (UUID). Kept in source-management to avoid coupling to organization-management.
 * Use for source_action_transactions.org_id and any org-scoped source APIs.
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class OrgId {
  private readonly _value: string;

  constructor(value: string) {
    if (!value || typeof value !== 'string') {
      throw new SourceManagementError('INVALID_ORG_ID', 'Org ID is required');
    }
    const trimmed = value.trim();
    if (!UUID_REGEX.test(trimmed)) {
      throw new SourceManagementError(
        'INVALID_ORG_ID',
        'Invalid org ID format (expected UUID)'
      );
    }
    this._value = trimmed;
  }

  get value(): string {
    return this._value;
  }

  equals(other: OrgId): boolean {
    return other ? this._value === other._value : false;
  }
}
