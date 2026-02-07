/**
 * SummaryJobId Value Object
 *
 * Summary Job의 UUID를 나타내는 Value Object
 * - UUID v4 형식 검증
 * - generate() 메서드 제공
 */
import { YoutubeError } from '../errors/youtube-app-space.error';

export class SummaryJobId {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new YoutubeError(
        'INVALID_SUMMARY_JOB_ID',
        'Invalid SummaryJobId format',
        {
          summaryJobId: value,
        }
      );
    }
    this._value = value;
  }

  static generate(): SummaryJobId {
    const uuid = crypto.randomUUID();
    return new SummaryJobId(uuid);
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

  equals(other: SummaryJobId): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
