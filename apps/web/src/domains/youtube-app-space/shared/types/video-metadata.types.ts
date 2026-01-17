/**
 * Video Metadata Types
 *
 * YouTube 비디오 메타데이터 타입 정의
 * Value Object가 아닌 단순 Type으로 정의
 */

/**
 * YouTube Video Metadata
 *
 * YouTube Data API v3에서 조회한 비디오 메타데이터
 */
export interface VideoMetadata {
  /**
   * 비디오 제목
   */
  title: string;

  /**
   * 비디오 설명
   */
  description?: string;

  /**
   * YouTube 채널 ID
   */
  channelId?: string;

  /**
   * 채널 제목
   */
  channelTitle?: string;

  /**
   * 게시일
   */
  publishedAt?: Date;

  /**
   * 영상 길이 (초)
   */
  durationSeconds?: number;

  /**
   * 썸네일 URL (우선순위: maxres > high > default)
   */
  thumbnailUrl?: string;

  /**
   * 고해상도 썸네일 URL
   */
  thumbnailHighUrl?: string;

  /**
   * 조회수
   */
  viewCount?: number;

  /**
   * 좋아요 수
   */
  likeCount?: number;

  /**
   * 댓글 수
   */
  commentCount?: number;
}
