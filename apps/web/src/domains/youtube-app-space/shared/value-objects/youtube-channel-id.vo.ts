/**
 * YoutubeChannelId Value Object
 *
 * YouTube Channel ID를 나타내는 Value Object
 * - YouTube Channel ID 형식 검증
 * - URL 생성 메서드 제공
 * - 불변성 보장
 */
import { YoutubeError } from '../errors/youtube-app-space.error';

export class YoutubeChannelId {
  /**
   * YouTube Channel ID 형식:
   * - UC로 시작하는 24자리 문자열 (예: "UC_x5XG1OV2P6uZZ5FSM9Ttw")
   * - 또는 커스텀 채널 ID (예: "channelname")
   */
  private static readonly CHANNEL_ID_REGEX = /^[a-zA-Z0-9_-]{1,100}$/;

  private readonly _value: string;

  constructor(value: string) {
    if (!YoutubeChannelId.isValid(value)) {
      throw new YoutubeError(
        'INVALID_CHANNEL_ID',
        `Invalid YouTube Channel ID format: ${value}`,
        { channelId: value }
      );
    }
    this._value = value.trim();
  }

  /**
   * Channel ID 형식 검증
   */
  static isValid(value: string): boolean {
    if (!value || typeof value !== 'string') {
      return false;
    }
    const trimmed = value.trim();
    if (trimmed.length === 0 || trimmed.length > 100) {
      return false;
    }
    return YoutubeChannelId.CHANNEL_ID_REGEX.test(trimmed);
  }

  /**
   * Value getter
   */
  get value(): string {
    return this._value;
  }

  /**
   * YouTube Channel URL 생성
   */
  toChannelUrl(): string {
    // UC로 시작하면 채널 ID, 아니면 커스텀 채널명
    if (this._value.startsWith('UC')) {
      return `https://www.youtube.com/channel/${this._value}`;
    }
    return `https://www.youtube.com/@${this._value}`;
  }

  /**
   * 값 비교
   */
  equals(other: YoutubeChannelId): boolean {
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
