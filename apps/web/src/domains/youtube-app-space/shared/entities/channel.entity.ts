/**
 * Channel Entity
 *
 * YouTube 채널 정보를 나타내는 도메인 엔티티
 */
import { YoutubeChannelId } from '../value-objects/youtube-channel-id.vo';

export class ChannelEntity {
  constructor(
    public readonly id: string,
    public readonly channelId: YoutubeChannelId,
    public readonly channelName: string,
    public readonly channelDescription: string | undefined,
    public readonly channelThumbnailUrl: string | undefined,
    public readonly subscriberCount: number | undefined,
    public readonly videoCount: number | undefined,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * 기존 데이터로 Channel 재구성 (Repository에서 사용)
   *
   * @param params - Channel 재구성에 필요한 모든 파라미터
   * @returns ChannelEntity 인스턴스
   */
  static reconstitute(params: {
    id: string;
    channelId: YoutubeChannelId;
    channelName: string;
    channelDescription?: string;
    channelThumbnailUrl?: string;
    subscriberCount?: number;
    videoCount?: number;
    createdAt: Date;
    updatedAt: Date;
  }): ChannelEntity {
    return new ChannelEntity(
      params.id,
      params.channelId,
      params.channelName,
      params.channelDescription,
      params.channelThumbnailUrl,
      params.subscriberCount,
      params.videoCount,
      params.createdAt,
      params.updatedAt
    );
  }
}
