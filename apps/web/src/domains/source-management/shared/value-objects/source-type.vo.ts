import { SourceManagementError } from '../errors/source-management.error';

export const SOURCE_TYPES = [
  'youtube',
  'pdf',
  'x',
  'thread',
  'audio',
  'link',
] as const;

export type SourceTypeValue = (typeof SOURCE_TYPES)[number];

export class SourceType {
  private readonly _value: SourceTypeValue;

  constructor(value: string) {
    const normalized = value?.toLowerCase().trim();
    if (!this.isValid(normalized)) {
      throw new SourceManagementError(
        'INVALID_SOURCE_TYPE',
        `Invalid source type: ${value}. Supported: ${SOURCE_TYPES.join(', ')}`
      );
    }
    this._value = normalized as SourceTypeValue;
  }

  get value(): SourceTypeValue {
    return this._value;
  }

  private isValid(value: string | undefined): value is SourceTypeValue {
    return typeof value === 'string' && SOURCE_TYPES.includes(value as SourceTypeValue);
  }

  equals(other: SourceType): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
