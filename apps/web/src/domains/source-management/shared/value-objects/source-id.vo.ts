import { SourceManagementError } from '../errors/source-management.error';

export class SourceId {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new SourceManagementError(
        'INVALID_SOURCE_ID',
        'Invalid SourceId format'
      );
    }
    this._value = value;
  }

  static generate(): SourceId {
    return new SourceId(crypto.randomUUID());
  }

  get value(): string {
    return this._value;
  }

  private isValid(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(trimmed);
  }

  equals(other: SourceId): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
