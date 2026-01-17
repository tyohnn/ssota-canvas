/**
 * Channel Metadata Types
 *
 * YouTube 채널 메타데이터 타입 정의
 * Value Object가 아닌 단순 Type으로 정의
 */

/**
 * YouTube Channel Metadata
 *
 * YouTube Data API v3에서 조회한 채널 메타데이터
 */
export interface ChannelMetadata {
  /**
   * 채널 이름
   */
  channelName: string;

  /**
   * 채널 설명
   */
  channelDescription?: string;

  /**
   * 채널 썸네일 URL (우선순위: high > medium > default)
   */
  channelThumbnailUrl?: string;

  /**
   * 구독자 수 (비공개인 경우 undefined)
   */
  subscriberCount?: number;

  /**
   * 비디오 수
   */
  videoCount?: number;
}
