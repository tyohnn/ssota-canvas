/**
 * XUserId Value Object
 *
 * X(트위터) 사용자 ID를 나타내는 Value Object
 */
import { XAppSpaceError } from '../errors/x-app-space.error';

export class XUserId {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new XAppSpaceError('INVALID_X_USER_ID', 'Invalid X User ID format', {
        userId: value,
      });
    }
    this._value = value.trim();
  }

  get value(): string {
    return this._value;
  }

  private isValid(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    return /^\d{6,25}$/.test(trimmed);
  }
}
