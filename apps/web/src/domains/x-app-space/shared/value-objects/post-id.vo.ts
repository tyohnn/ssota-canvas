/**
 * PostId Value Object - X Post aggregate UUID
 */
import { XAppSpaceError } from '../errors/x-app-space.error';

export class PostId {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new XAppSpaceError('INVALID_POST_ID', 'Invalid PostId format (UUID)', {
        postId: value,
      });
    }
    this._value = value;
  }

  static generate(): PostId {
    return new PostId(crypto.randomUUID());
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

  equals(other: PostId): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
