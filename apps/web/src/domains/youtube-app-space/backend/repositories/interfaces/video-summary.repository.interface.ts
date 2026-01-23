/**
 * Video Summary Repository Interface
 *
 * Domain Layer에서 사용할 Repository 인터페이스 정의
 *
 * DDD 원칙: Infrastructure 레이어(Drizzle)에 의존하지 않음
 */
import type { VideoSummaryAggregate } from '../../../shared/aggregates/video-summary.aggregate';

/**
 * Video Summary Repository Interface
 *
 * Video Summary 데이터 액세스 계약
 * edge 패턴: Aggregate로 주고받음
 */
export interface IVideoSummaryRepository {
  /**
   * VideoSummary 생성
   */
  create(summaryAggregate: VideoSummaryAggregate): Promise<void>;

  /**
   * ID로 Aggregate 조회
   */
  findById(id: string): Promise<VideoSummaryAggregate | null>;

  /**
   * Video ID와 Language로 Aggregate 조회
   */
  findByVideoIdAndLanguage(
    videoId: string,
    language: string
  ): Promise<VideoSummaryAggregate | null>;

  /**
   * Video ID로 모든 언어의 Aggregate 조회
   */
  findAllByVideoId(videoId: string): Promise<VideoSummaryAggregate[]>;

  /**
   * Aggregate 업데이트
   */
  update(summaryAggregate: VideoSummaryAggregate): Promise<void>;
}
