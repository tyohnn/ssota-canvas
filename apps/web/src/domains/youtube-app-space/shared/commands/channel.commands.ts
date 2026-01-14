/**
 * Channel Commands
 *
 * 비즈니스 의도를 명확히 표현하는 Command 패턴
 */
import type { ChannelId } from '../value-objects/channel-id.vo';
import type { YoutubeChannelId } from '../value-objects/youtube-channel-id.vo';

/**
 * Channel 생성 Command
 *
 * YouTube 채널 정보를 생성하거나 기존 것을 조회
 * Value Object를 최대한 활용하여 타입 안정성과 검증 보장
 */
export interface CreateChannelCommand {
  channelId: ChannelId; // Channel Aggregate ID (UUID) - Value Object
  youtubeChannelId: YoutubeChannelId; // YouTube Channel ID
  channelName: string;
  channelDescription?: string;
  channelThumbnailUrl?: string;
  subscriberCount?: number;
  videoCount?: number;
}
