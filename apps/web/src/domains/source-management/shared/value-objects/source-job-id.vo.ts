/**
 * SourceJobId Value Object
 *
 * Source Job의 UUID를 나타내는 Value Object
 * - UUID v4 형식 검증
 * - generate() 메서드 제공
 */
import { SourceManagementError } from '../errors/source-management.error';

export class SourceJobId {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new SourceManagementError(
        'INVALID_SOURCE_JOB_ID',
        'Invalid SourceJobId format',
        { sourceJobId: value }
      );
    }
    this._value = value;
  }

  static generate(): SourceJobId {
    const uuid = crypto.randomUUID();
    return new SourceJobId(uuid);
  }

  get value(): string {
    return this._value;
  }

  private isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return false;
    }
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(trimmedValue);
  }

  equals(other: SourceJobId): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
