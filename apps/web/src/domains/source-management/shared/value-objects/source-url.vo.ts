import { createHash } from 'node:crypto';

import { SourceManagementError } from '../errors/source-management.error';

/**
 * Canonicalizes URL for deduplication (trim, sort query params).
 * url_hash is computed in the VO (server SSOT) and stored in DB.
 */
function canonicalize(url: string): string {
  try {
    const u = new URL(url.trim());
    u.searchParams.sort();
    return u.toString();
  } catch {
    return url.trim();
  }
}

function computeUrlHash(canonicalUrl: string): string {
  return createHash('sha256').update(canonicalUrl, 'utf8').digest('hex');
}

export class SourceUrl {
  private readonly _value: string;
  private readonly _urlHash: string;

  constructor(value: string) {
    if (!value || typeof value !== 'string' || !value.trim()) {
      throw new SourceManagementError(
        'INVALID_SOURCE_URL',
        'Source URL is required'
      );
    }
    this._value = canonicalize(value);
    this._urlHash = computeUrlHash(this._value);
  }

  get value(): string {
    return this._value;
  }

  /** SHA-256 hex of canonical URL (server SSOT for deduplication). */
  get urlHash(): string {
    return this._urlHash;
  }

  equals(other: SourceUrl): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
