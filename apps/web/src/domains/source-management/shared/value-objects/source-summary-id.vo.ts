import { SourceManagementError } from '../errors/source-management.error';

export class SourceSummaryId {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new SourceManagementError(
        'INVALID_SOURCE_ID',
        'Invalid SourceSummaryId format'
      );
    }
    this._value = value;
  }

  static generate(): SourceSummaryId {
    return new SourceSummaryId(crypto.randomUUID());
  }

  get value(): string {
    return this._value;
  }

  private isValid(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value.trim());
  }

  equals(other: SourceSummaryId): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
