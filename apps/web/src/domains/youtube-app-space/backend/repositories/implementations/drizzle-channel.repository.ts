/**
 * Drizzle Channel Repository Implementation
 *
 * Drizzle ORM을 사용한 Channel Repository 구현
 *
 * ⚠️ adminDb 사용: Service Layer에서 권한 체크 완료 후 호출
 */
import { randomUUID } from 'crypto';
import { eq } from 'drizzle-orm';

import { adminDb } from '@/db';
import { type Channel, channels } from '@/db/schemas/youtube-app-space-schema';

import { ChannelAggregate } from '../../../shared/aggregates/channel.aggregate';
import { ChannelEntity } from '../../../shared/entities/channel.entity';
import { YoutubeChannelId } from '../../../shared/value-objects/youtube-channel-id.vo';
import type { IChannelRepository } from '../interfaces/channel.repository.interface';

/**
 * Drizzle ORM 기반 Channel Repository 구현체
 */
export class DrizzleChannelRepository implements IChannelRepository {
  /**
   * Channel 생성
   *
   * UUID 충돌 시 자동 재시도 (최대 3번)
   */
  async create(channelAggregate: ChannelAggregate): Promise<void> {
    let currentAggregate = channelAggregate;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const channel = currentAggregate.getChannel();

        await adminDb.insert(channels).values({
          id: channel.id,
          channel_id: channel.channelId.value,
          channel_name: channel.channelName,
          channel_description: channel.channelDescription ?? null,
          channel_thumbnail_url: channel.channelThumbnailUrl ?? null,
          subscriber_count: channel.subscriberCount ?? null,
          video_count: channel.videoCount ?? null,
          created_at: channel.createdAt,
          updated_at: channel.updatedAt,
        });

        // 성공 시 종료
        return;
      } catch (error) {
        // UUID 충돌인지 확인 (PostgreSQL unique constraint violation)
        if (
          (error as any).code === '23505' &&
          (error as any).constraint === 'channels_pkey'
        ) {
          attempts++;
          if (attempts < maxAttempts) {
            // 새로운 ID로 Entity 재구성 및 Aggregate 재생성
            const channel = currentAggregate.getChannel();
            const newId = randomUUID();
            console.warn(
              `[DrizzleChannelRepository] ID collision detected (attempt ${attempts}), retrying with new ID: ${newId}`
            );

            // Entity 재구성 (새 ID로)
            const newEntity = ChannelEntity.reconstitute({
              id: newId,
              channelId: channel.channelId,
              channelName: channel.channelName,
              channelDescription: channel.channelDescription,
              channelThumbnailUrl: channel.channelThumbnailUrl,
              subscriberCount: channel.subscriberCount,
              videoCount: channel.videoCount,
              createdAt: channel.createdAt,
              updatedAt: channel.updatedAt,
            });

            // Aggregate 재구성
            const newAggregate = ChannelAggregate.reconstitute(newEntity);
            currentAggregate = newAggregate;
          } else {
            console.error(
              '❌ [DrizzleChannelRepository] Failed to generate unique ID after multiple attempts'
            );
            throw new Error(
              'Failed to generate unique ID after multiple attempts'
            );
          }
        } else {
          console.error(
            '❌ [DrizzleChannelRepository.create] Failed to create channel:',
            error
          );
          throw error;
        }
      }
    }
  }

  /**
   * ID로 Aggregate 조회
   */
  async findById(id: string): Promise<ChannelAggregate | null> {
    const result = await adminDb.query.channels.findFirst({
      where: eq(channels.id, id),
    });

    if (!result) {
      return null;
    }

    return this.toDomain(result);
  }

  /**
   * YouTube Channel ID로 Aggregate 조회
   */
  async findByChannelId(channelId: string): Promise<ChannelAggregate | null> {
    const result = await adminDb.query.channels.findFirst({
      where: eq(channels.channel_id, channelId),
    });

    if (!result) {
      return null;
    }

    return this.toDomain(result);
  }

  /**
   * DB Row → Domain Model 변환
   */
  private toDomain(data: Channel): ChannelAggregate {
    const entity = ChannelEntity.reconstitute({
      id: data.id,
      channelId: new YoutubeChannelId(data.channel_id),
      channelName: data.channel_name,
      channelDescription: data.channel_description ?? undefined,
      channelThumbnailUrl: data.channel_thumbnail_url ?? undefined,
      subscriberCount: data.subscriber_count ?? undefined,
      videoCount: data.video_count ?? undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });

    return ChannelAggregate.reconstitute(entity);
  }
}
