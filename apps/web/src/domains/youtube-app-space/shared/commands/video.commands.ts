/**
 * Video Commands
 *
 * 비즈니스 의도를 명확히 표현하는 Command 패턴
 */
import type { UserId } from '@/domains/user-management/shared/value-objects/ids.vo';

import type { YoutubeScript } from '../types/transcript.types';
import type { ChannelId } from '../value-objects/channel-id.vo';
import type { VideoId } from '../value-objects/video-id.vo';
import type { VideoSlug } from '../value-objects/video-slug.vo';

/**
 * Video 생성 Command
 *
 * Video 메타데이터를 생성하거나 기존 것을 조회
 * Value Object를 최대한 활용하여 타입 안정성과 검증 보장
 */
export interface CreateVideoCommand {
  videoId: VideoId; // Video Aggregate ID (UUID) - Value Object
  slug: VideoSlug; // YouTube Video ID (11자리) - Value Object
  title: string;
  description?: string;
  channelId?: ChannelId; // Channel Aggregate ID (UUID) - Value Object
  publishedAt?: Date;
  durationSeconds?: number;
  thumbnailUrl?: string;
  thumbnailHighUrl?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  userId: UserId; // User ID - Value Object
}

/**
 * 스크립트 업데이트 Command
 *
 * Video의 스크립트를 업데이트하여 저장
 */
export interface UpdateScriptCommand {
  videoId: string;
  script: YoutubeScript;
  scriptLanguage: string;
}
