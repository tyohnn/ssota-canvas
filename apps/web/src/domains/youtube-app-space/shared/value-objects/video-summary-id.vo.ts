/**
 * VideoSummaryId Value Object
 *
 * Video Summary의 UUID를 나타내는 Value Object
 * - UUID v4 형식 검증
 * - generate() 메서드 제공
 * - video-id.vo 패턴 준수
 */
import { YoutubeError } from '../errors/youtube-app-space.error';

export class VideoSummaryId {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new YoutubeError(
        'INVALID_VIDEO_SUMMARY_ID',
        'Invalid VideoSummaryId format',
        {
          videoSummaryId: value,
        }
      );
    }
    this._value = value;
  }

  /**
   * 새로운 VideoSummaryId 생성
   */
  static generate(): VideoSummaryId {
    // UUID v4 생성
    const uuid = crypto.randomUUID();
    return new VideoSummaryId(uuid);
  }

  get value(): string {
    return this._value;
  }

  private isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }

    // 공백 제거 후 빈 문자열 체크
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return false;
    }

    // UUID v4 형식 검증
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(trimmedValue);
  }

  equals(other: VideoSummaryId): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
