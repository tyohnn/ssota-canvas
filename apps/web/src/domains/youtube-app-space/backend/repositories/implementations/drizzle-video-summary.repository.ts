/**
 * Drizzle Video Summary Repository Implementation
 *
 * Drizzle ORM을 사용한 Video Summary Repository 구현
 *
 * ⚠️ adminDb 사용: Service Layer에서 권한 체크 완료 후 호출
 */
import { and, eq } from 'drizzle-orm';

import { adminDb } from '@/db';
import {
  type VideoSummary,
  videoSummaries,
} from '@/db/schemas/youtube-app-space-schema';

import { VideoSummaryAggregate } from '../../../shared/aggregates/video-summary.aggregate';
import { VideoSummaryEntity } from '../../../shared/entities/video-summary.entity';
import { LanguageCode } from '../../../shared/value-objects/language-code.vo';
import { VideoId } from '../../../shared/value-objects/video-id.vo';
import { VideoSummaryId } from '../../../shared/value-objects/video-summary-id.vo';
import type { IVideoSummaryRepository } from '../interfaces/video-summary.repository.interface';

/**
 * Drizzle ORM 기반 Video Summary Repository 구현체
 */
export class DrizzleVideoSummaryRepository implements IVideoSummaryRepository {
  /**
   * VideoSummary 생성
   *
   * UUID 충돌 시 자동 재시도 (최대 3번)
   */
  async create(summaryAggregate: VideoSummaryAggregate): Promise<void> {
    let currentAggregate = summaryAggregate;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const summary = currentAggregate.getSummary();

        await adminDb.insert(videoSummaries).values({
          id: summary.id.value,
          video_id: summary.videoId.value,
          language: summary.language.value,
          summary: summary.summary,
          created_at: summary.createdAt,
          updated_at: summary.updatedAt,
        });

        // 성공 시 종료
        return;
      } catch (error) {
        // UUID 충돌인지 확인 (PostgreSQL unique constraint violation)
        if (
          (error as any).code === '23505' &&
          ((error as any).constraint === 'video_summaries_pkey' ||
            (error as any).constraint ===
            'video_summaries_video_id_language_unique')
        ) {
          attempts++;
          if (attempts < maxAttempts) {
            // 새로운 ID로 Entity 재구성 및 Aggregate 재생성
            const summary = currentAggregate.getSummary();
            const newId = VideoSummaryId.generate();
            console.warn(
              `[DrizzleVideoSummaryRepository] ID collision detected (attempt ${attempts}), retrying with new ID: ${newId.value}`
            );

            // Entity 재구성 (새 ID로)
            const newEntity = VideoSummaryEntity.reconstitute({
              id: newId,
              videoId: summary.videoId,
              language: summary.language,
              summary: summary.summary,
              createdAt: summary.createdAt,
              updatedAt: summary.updatedAt,
            });

            // Aggregate 재구성
            const newAggregate = VideoSummaryAggregate.reconstitute(newEntity);
            currentAggregate = newAggregate;
          } else {
            console.error(
              '❌ [DrizzleVideoSummaryRepository] Failed to generate unique ID after multiple attempts'
            );
            throw new Error(
              'Failed to generate unique ID after multiple attempts'
            );
          }
        } else {
          console.error(
            '❌ [DrizzleVideoSummaryRepository.create] Failed to create video summary:',
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
  async findById(id: string): Promise<VideoSummaryAggregate | null> {
    const result = await adminDb.query.videoSummaries.findFirst({
      where: eq(videoSummaries.id, id),
    });

    if (!result) {
      return null;
    }

    return this.toDomain(result);
  }

  /**
   * Video ID와 Language로 Aggregate 조회
   */
  async findByVideoIdAndLanguage(
    videoId: string,
    language: string
  ): Promise<VideoSummaryAggregate | null> {
    const result = await adminDb.query.videoSummaries.findFirst({
      where: and(
        eq(videoSummaries.video_id, videoId),
        eq(videoSummaries.language, language)
      ),
    });

    if (!result) {
      return null;
    }

    return this.toDomain(result);
  }

  /**
   * Video ID로 모든 언어의 Aggregate 조회
   */
  async findAllByVideoId(
    videoId: string
  ): Promise<VideoSummaryAggregate[]> {
    const results = await adminDb.query.videoSummaries.findMany({
      where: eq(videoSummaries.video_id, videoId),
    });

    return results.map(r => this.toDomain(r));
  }

  /**
   * Aggregate 업데이트
   */
  async update(summaryAggregate: VideoSummaryAggregate): Promise<void> {
    const summary = summaryAggregate.getSummary();

    await adminDb
      .update(videoSummaries)
      .set({
        summary: summary.summary,
        updated_at: summary.updatedAt,
      })
      .where(eq(videoSummaries.id, summary.id.value));
  }

  /**
   * DB Row → Domain Model 변환
   */
  private toDomain(data: VideoSummary): VideoSummaryAggregate {
    const entity = VideoSummaryEntity.reconstitute({
      id: new VideoSummaryId(data.id),
      videoId: new VideoId(data.video_id),
      language: new LanguageCode(data.language),
      summary: data.summary,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });

    return VideoSummaryAggregate.reconstitute(entity);
  }
}
