/**
 * ProfileId Value Object
 *
 * X Profile Aggregate의 UUID를 나타내는 Value Object
 */
import { XAppSpaceError } from '../errors/x-app-space.error';

export class ProfileId {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new XAppSpaceError('INVALID_PROFILE_ID', 'Invalid ProfileId format', {
        profileId: value,
      });
    }
    this._value = value;
  }

  static generate(): ProfileId {
    return new ProfileId(crypto.randomUUID());
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
}
