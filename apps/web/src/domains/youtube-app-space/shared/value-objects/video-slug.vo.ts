/**
 * VideoSlug Value Object
 *
 * YouTube Video ID (11자리 문자열)를 나타내는 Value Object
 * - YouTube Video ID 형식 검증 (11자리)
 * - URL 생성 메서드 제공
 * - 불변성 보장
 */
import { YoutubeError } from '../errors/youtube-app-space.error';

export class VideoSlug {
  /**
   * YouTube Video ID 형식: 11자리 영문/숫자/하이픈/언더스코어
   * 예: "dQw4w9WgXcQ", "jNQXAC9IVRw"
   */
  private static readonly VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

  private readonly _value: string;

  constructor(value: string) {
    if (!VideoSlug.isValid(value)) {
      throw new YoutubeError(
        'INVALID_VIDEO_SLUG',
        `Invalid YouTube Video ID format: ${value}`,
        { slug: value }
      );
    }
    this._value = value;
  }

  /**
   * Video ID 형식 검증
   */
  static isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    return VideoSlug.VIDEO_ID_REGEX.test(value.trim());
  }

  /**
   * Value getter
   */
  get value(): string {
    return this._value;
  }

  /**
   * YouTube Watch URL 생성
   */
  toWatchUrl(): string {
    return `https://www.youtube.com/watch?v=${this._value}`;
  }

  /**
   * YouTube Embed URL 생성
   */
  toEmbedUrl(): string {
    return `https://www.youtube.com/embed/${this._value}`;
  }

  /**
   * YouTube Short URL 생성
   */
  toShortUrl(): string {
    return `https://youtu.be/${this._value}`;
  }

  /**
   * 값 비교
   */
  equals(other: VideoSlug): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  /**
   * 문자열 변환
   */
  toString(): string {
    return this._value;
  }
}
