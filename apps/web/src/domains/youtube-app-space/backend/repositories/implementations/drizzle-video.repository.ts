/**
 * Drizzle Video Repository Implementation
 *
 * Drizzle ORM을 사용한 Video Repository 구현
 *
 * ⚠️ adminDb 사용: Service Layer에서 권한 체크 완료 후 호출
 */
import { eq } from 'drizzle-orm';

import { adminDb } from '@/db';
import { type Video, videos } from '@/db/schemas/youtube-app-space-schema';

import { VideoAggregate } from '../../../shared/aggregates/video.aggregate';
import { VideoEntity } from '../../../shared/entities/video.entity';
import { VideoId } from '../../../shared/value-objects/video-id.vo';
import { VideoSlug } from '../../../shared/value-objects/video-slug.vo';
import type { IVideoRepository } from '../interfaces/video.repository.interface';

/**
 * Drizzle ORM 기반 Video Repository 구현체
 */
export class DrizzleVideoRepository implements IVideoRepository {
  /**
   * YouTube 생성
   *
   * UUID 충돌 시 자동 재시도 (최대 3번)
   */
  async create(videoAggregate: VideoAggregate): Promise<void> {
    let currentAggregate = videoAggregate;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const video = currentAggregate.getVideo();

        await adminDb.insert(videos).values({
          id: video.id.value,
          slug: video.slug.value,
          title: video.title,
          description: video.description ?? null,
          channel_id: video.channelId,
          published_at: video.publishedAt ?? null,
          duration_seconds: video.durationSeconds ?? null,
          thumbnail_url: video.thumbnailUrl ?? null,
          thumbnail_high_url: video.thumbnailHighUrl ?? null,
          view_count: video.viewCount,
          like_count: video.likeCount,
          comment_count: video.commentCount,
          created_at: video.createdAt,
          updated_at: video.updatedAt,
        });

        // 성공 시 종료
        return;
      } catch (error) {
        // UUID 충돌인지 확인 (PostgreSQL unique constraint violation)
        if (
          (error as any).code === '23505' &&
          (error as any).constraint === 'videos_pkey'
        ) {
          attempts++;
          if (attempts < maxAttempts) {
            // 새로운 ID로 Entity 재구성 및 Aggregate 재생성
            const video = currentAggregate.getVideo();
            const newId = VideoId.generate();
            console.warn(
              `[DrizzleVideoRepository] ID collision detected (attempt ${attempts}), retrying with new ID: ${newId.value}`
            );

            // Entity 재구성 (새 ID로)
            const newEntity = VideoEntity.reconstitute({
              id: newId,
              slug: video.slug,
              title: video.title,
              description: video.description,
              channelId: video.channelId,
              publishedAt: video.publishedAt,
              durationSeconds: video.durationSeconds,
              thumbnailUrl: video.thumbnailUrl,
              thumbnailHighUrl: video.thumbnailHighUrl,
              viewCount: video.viewCount,
              likeCount: video.likeCount,
              commentCount: video.commentCount,
              createdAt: video.createdAt,
              updatedAt: video.updatedAt,
            });

            // Aggregate 재구성
            // Note: 이벤트는 Service Layer에서 처리되므로 Repository에서는 재구성만 수행
            const newAggregate = VideoAggregate.reconstitute(newEntity);
            currentAggregate = newAggregate;
          } else {
            console.error(
              '❌ [DrizzleVideoRepository] Failed to generate unique ID after multiple attempts'
            );
            throw new Error(
              'Failed to generate unique ID after multiple attempts'
            );
          }
        } else {
          console.error(
            '❌ [DrizzleVideoRepository.create] Failed to create video:',
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
  async findById(id: string): Promise<VideoAggregate | null> {
    const result = await adminDb.query.videos.findFirst({
      where: eq(videos.id, id),
    });

    if (!result) {
      return null;
    }

    return this.toDomain(result);
  }

  /**
   * Slug로 Aggregate 조회
   */
  async findBySlug(slug: string): Promise<VideoAggregate | null> {
    const result = await adminDb.query.videos.findFirst({
      where: eq(videos.slug, slug),
    });

    if (!result) {
      return null;
    }

    return this.toDomain(result);
  }

  /**
   * Aggregate 업데이트
   */
  async update(videoAggregate: VideoAggregate): Promise<void> {
    const video = videoAggregate.getVideo();

    await adminDb
      .update(videos)
      .set({
        slug: video.slug.value,
        title: video.title,
        description: video.description ?? null,
        channel_id: video.channelId,
        published_at: video.publishedAt ?? null,
        duration_seconds: video.durationSeconds ?? null,
        thumbnail_url: video.thumbnailUrl ?? null,
        thumbnail_high_url: video.thumbnailHighUrl ?? null,
        view_count: video.viewCount,
        like_count: video.likeCount,
        comment_count: video.commentCount,
        updated_at: video.updatedAt,
      })
      .where(eq(videos.id, video.id.value));
  }

  /**
   * DB Row → Domain Model 변환
   */
  private toDomain(data: Video): VideoAggregate {
    const entity = VideoEntity.reconstitute({
      id: new VideoId(data.id),
      slug: new VideoSlug(data.slug),
      title: data.title,
      description: data.description ?? undefined,
      channelId: data.channel_id!,
      publishedAt: data.published_at ? new Date(data.published_at) : undefined,
      durationSeconds: data.duration_seconds ?? undefined,
      thumbnailUrl: data.thumbnail_url ?? undefined,
      thumbnailHighUrl: data.thumbnail_high_url ?? undefined,
      viewCount: data.view_count ?? 0,
      likeCount: data.like_count ?? 0,
      commentCount: data.comment_count ?? 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });

    return VideoAggregate.reconstitute(entity);
  }
}
