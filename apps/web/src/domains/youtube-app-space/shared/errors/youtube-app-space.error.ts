/**
 * YouTube App Space Domain Errors
 *
 * 도메인별 에러 클래스 정의
 */

/**
 * YouTube App Space Error Code
 */
export type YoutubeAppSpaceErrorCode =
  // Video ID 관련 (UUID)
  | 'INVALID_VIDEO_ID'
  | 'VIDEO_ID_NOT_FOUND'
  | 'VIDEO_ID_ALREADY_EXISTS'
  // Video Slug 관련 (YouTube Video ID 11자리)
  | 'INVALID_VIDEO_SLUG'
  | 'VIDEO_SLUG_NOT_FOUND'
  | 'VIDEO_SLUG_ALREADY_EXISTS'
  // Channel ID 관련
  | 'INVALID_CHANNEL_ID'
  | 'CHANNEL_ID_NOT_FOUND'
  | 'CHANNEL_ID_ALREADY_EXISTS'
  // Action Transaction ID 관련 (UUID)
  | 'INVALID_ACTION_TRANSACTION_ID'
  | 'ACTION_TRANSACTION_ID_NOT_FOUND'
  // Action Transaction 엔티티 관련
  | 'ACTION_TRANSACTION_CREATION_FAILED'
  | 'ACTION_TRANSACTION_UPDATE_FAILED'
  // Video Summary ID 관련 (UUID)
  | 'INVALID_VIDEO_SUMMARY_ID'
  // Video Summary 엔티티 관련
  | 'VIDEO_SUMMARY_CREATION_FAILED'
  // Language 관련
  | 'UNSUPPORTED_LANGUAGE'
  // YouTube 엔티티 관련
  | 'YOUTUBE_NOT_FOUND'
  | 'VIDEO_QUERY_FAILED'
  | 'VIDEO_CREATION_FAILED'
  | 'VIDEO_UPDATE_FAILED'
  | 'YOUTUBE_DELETION_FAILED'
  // Channel 엔티티 관련
  | 'CHANNEL_NOT_FOUND'
  | 'CHANNEL_QUERY_FAILED'
  | 'CHANNEL_CREATION_FAILED'
  | 'CHANNEL_UPDATE_FAILED'
  | 'CHANNEL_DELETION_FAILED'
  // 스크립트 관련
  | 'SCRIPT_EXTRACTION_FAILED'
  | 'SCRIPT_NOT_FOUND'
  | 'SCRIPT_ALREADY_EXISTS'
  | 'SCRIPT_LANGUAGE_NOT_SUPPORTED'
  | 'SCRIPT_TRANSCRIPT_EMPTY'
  // 요약 관련
  | 'SUMMARY_GENERATION_FAILED'
  | 'EXTRACT_SUMMARY_FAILED'
  // YouTube API 관련
  | 'YOUTUBE_API_ERROR'
  | 'YOUTUBE_API_KEY_MISSING'
  | 'YOUTUBE_API_RATE_LIMIT_EXCEEDED'
  | 'YOUTUBE_API_QUOTA_EXCEEDED'
  | 'YOUTUBE_API_UNAUTHORIZED'
  | 'YOUTUBE_API_FORBIDDEN'
  | 'YOUTUBE_API_NOT_FOUND'
  | 'YOUTUBE_API_BAD_REQUEST'
  | 'YOUTUBE_API_INTERNAL_ERROR'
  // Transcript API 관련
  | 'TRANSCRIPT_API_ERROR'
  | 'TRANSCRIPT_NOT_AVAILABLE'
  | 'TRANSCRIPT_LANGUAGE_NOT_AVAILABLE'
  // 권한 관련
  | 'UNAUTHORIZED_ACCESS'
  | 'WORKSPACE_ACCESS_DENIED'
  | 'BLOCK_NOT_FOUND'
  // 데이터베이스 관련
  | 'DATABASE_CONNECTION_FAILED'
  | 'DATABASE_QUERY_FAILED'
  | 'DATABASE_TRANSACTION_FAILED'
  // 일반적인 에러
  | 'INVALID_REQUEST'
  | 'VALIDATION_FAILED'
  | 'INTERNAL_SERVER_ERROR';

/**
 * YouTube Domain Error
 */
export class YoutubeError extends Error {
  constructor(
    public readonly code: YoutubeAppSpaceErrorCode,
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'YoutubeError';
  }
}

/**
 * Channel Domain Error
 */
export class ChannelError extends Error {
  constructor(
    public readonly code: YoutubeAppSpaceErrorCode,
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ChannelError';
  }
}

// User message mapping
export const YOUTUBE_APP_SPACE_ERROR_MESSAGES: Record<
  YoutubeAppSpaceErrorCode,
  string
> = {
  // Video ID related (UUID)
  INVALID_VIDEO_ID: 'Invalid video ID format (UUID).',
  VIDEO_ID_NOT_FOUND: 'Video ID not found.',
  VIDEO_ID_ALREADY_EXISTS: 'Video ID already exists.',
  // Video Slug related (YouTube Video ID 11자리)
  INVALID_VIDEO_SLUG: 'Invalid YouTube video ID format.',
  VIDEO_SLUG_NOT_FOUND: 'YouTube video ID not found.',
  VIDEO_SLUG_ALREADY_EXISTS: 'YouTube video ID already exists.',
  // Channel ID related
  INVALID_CHANNEL_ID: 'Invalid YouTube channel ID format.',
  CHANNEL_ID_NOT_FOUND: 'YouTube channel ID not found.',
  CHANNEL_ID_ALREADY_EXISTS: 'YouTube channel ID already exists.',
  // Action Transaction ID related (UUID)
  INVALID_ACTION_TRANSACTION_ID: 'Invalid action transaction ID format (UUID).',
  ACTION_TRANSACTION_ID_NOT_FOUND: 'Action transaction ID not found.',
  // Action Transaction entity related
  ACTION_TRANSACTION_CREATION_FAILED: 'Failed to create action transaction.',
  ACTION_TRANSACTION_UPDATE_FAILED: 'Failed to update action transaction.',
  // Video Summary ID related (UUID)
  INVALID_VIDEO_SUMMARY_ID: 'Invalid video summary ID format (UUID).',
  // Video Summary entity related
  VIDEO_SUMMARY_CREATION_FAILED: 'Failed to create video summary.',
  SUMMARY_GENERATION_FAILED: 'Failed to generate video summary.',
  EXTRACT_SUMMARY_FAILED: 'Failed to extract video summary.',
  // Language related
  UNSUPPORTED_LANGUAGE: 'Unsupported language code.',
  // YouTube entity related
  YOUTUBE_NOT_FOUND: 'YouTube video not found.',
  VIDEO_QUERY_FAILED: 'Failed to query video.',
  VIDEO_CREATION_FAILED: 'Failed to create video.',
  VIDEO_UPDATE_FAILED: 'Failed to update video.',
  YOUTUBE_DELETION_FAILED: 'Failed to delete YouTube video.',
  // Channel entity related
  CHANNEL_NOT_FOUND: 'YouTube channel not found.',
  CHANNEL_QUERY_FAILED: 'Failed to query channel.',
  CHANNEL_CREATION_FAILED: 'Failed to create YouTube channel.',
  CHANNEL_UPDATE_FAILED: 'Failed to update YouTube channel.',
  CHANNEL_DELETION_FAILED: 'Failed to delete YouTube channel.',
  // Script related
  SCRIPT_EXTRACTION_FAILED: 'Failed to extract script.',
  SCRIPT_NOT_FOUND: 'Script not found.',
  SCRIPT_ALREADY_EXISTS: 'Script already exists.',
  SCRIPT_LANGUAGE_NOT_SUPPORTED: 'Script language not supported.',
  SCRIPT_TRANSCRIPT_EMPTY: 'Script transcript is empty.',
  // YouTube API related
  YOUTUBE_API_ERROR: 'YouTube API error occurred.',
  YOUTUBE_API_KEY_MISSING: 'YouTube API key is missing.',
  YOUTUBE_API_RATE_LIMIT_EXCEEDED: 'YouTube API rate limit exceeded.',
  YOUTUBE_API_QUOTA_EXCEEDED: 'YouTube API quota exceeded.',
  YOUTUBE_API_UNAUTHORIZED: 'YouTube API authentication failed.',
  YOUTUBE_API_FORBIDDEN: 'YouTube API access forbidden.',
  YOUTUBE_API_NOT_FOUND: 'YouTube API resource not found.',
  YOUTUBE_API_BAD_REQUEST: 'YouTube API bad request.',
  YOUTUBE_API_INTERNAL_ERROR: 'YouTube API internal error.',
  // Transcript API related
  TRANSCRIPT_API_ERROR: 'Transcript API error occurred.',
  TRANSCRIPT_NOT_AVAILABLE: 'Transcript not available.',
  TRANSCRIPT_LANGUAGE_NOT_AVAILABLE: 'Transcript language not available.',
  // Authorization related
  UNAUTHORIZED_ACCESS: 'Unauthorized access.',
  WORKSPACE_ACCESS_DENIED: 'Workspace access denied.',
  BLOCK_NOT_FOUND: 'Block not found.',
  // Database related
  DATABASE_CONNECTION_FAILED: 'Database connection failed.',
  DATABASE_QUERY_FAILED: 'Database query failed.',
  DATABASE_TRANSACTION_FAILED: 'Database transaction failed.',
  // General errors
  INVALID_REQUEST: 'Invalid request.',
  VALIDATION_FAILED: 'Validation failed.',
  INTERNAL_SERVER_ERROR: 'Internal server error.',
};
