/**
 * PostSlug Value Object - X Post ID (numeric string from URL)
 *
 * Extracts post ID from URLs:
 * - https://x.com/username/status/1234567890
 * - https://twitter.com/username/status/1234567890
 * - https://x.com/i/status/1234567890
 */
import { XAppSpaceError } from '../errors/x-app-space.error';

/** X/Twitter post ID: 19-digit numeric string */
const POST_ID_REGEX = /^\d{10,25}$/;

export class PostSlug {
  private readonly _value: string;

  constructor(value: string) {
    if (!PostSlug.isValid(value)) {
      throw new XAppSpaceError('INVALID_POST_SLUG', 'Invalid X post ID format', {
        slug: value,
      });
    }
    this._value = value;
  }

  static isValid(value: string): boolean {
    if (!value || typeof value !== 'string') return false;
    return POST_ID_REGEX.test(value.trim());
  }

  /**
   * Extract post ID from X/Twitter URL
   */
  static fromUrl(url: string): PostSlug | null {
    try {
      const match = url.match(
        /(?:x\.com|twitter\.com)\/(?:\w+\/status\/|i\/status\/)(\d{10,25})/
      );
      const id = match?.[1];
      return id ? new PostSlug(id) : null;
    } catch {
      return null;
    }
  }

  get value(): string {
    return this._value;
  }

  toPostUrl(): string {
    return `https://x.com/i/status/${this._value}`;
  }

  equals(other: PostSlug): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
