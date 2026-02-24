import { SourceManagementError } from '../errors/source-management.error';

export class SourceActionTransactionId {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new SourceManagementError(
        'INVALID_SOURCE_ID',
        'Invalid SourceActionTransactionId format'
      );
    }
    this._value = value;
  }

  static generate(): SourceActionTransactionId {
    return new SourceActionTransactionId(crypto.randomUUID());
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

  equals(other: SourceActionTransactionId): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
