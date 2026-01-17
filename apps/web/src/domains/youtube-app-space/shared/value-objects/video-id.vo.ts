/**
 * VideoId Value Object
 *
 * YouTube Video의 UUID를 나타내는 Value Object
 * - UUID v4 형식 검증
 * - generate() 메서드 제공
 * - block-id.vo 패턴 준수
 */
import { YoutubeError } from '../errors/youtube-app-space.error';

export class VideoId {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new YoutubeError('INVALID_VIDEO_ID', 'Invalid VideoId format', {
        videoId: value,
      });
    }
    this._value = value;
  }

  /**
   * 새로운 VideoId 생성
   */
  static generate(): VideoId {
    // UUID v4 생성
    const uuid = crypto.randomUUID();
    return new VideoId(uuid);
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

  equals(other: VideoId): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
}
