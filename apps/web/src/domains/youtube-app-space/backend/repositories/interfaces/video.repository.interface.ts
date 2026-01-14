/**
 * Video Repository Interface
 *
 * Domain Layer에서 사용할 Repository 인터페이스 정의
 *
 * DDD 원칙: Infrastructure 레이어(Drizzle)에 의존하지 않음
 */
import type { VideoAggregate } from '../../../shared/aggregates/video.aggregate';

/**
 * Video Repository Interface
 *
 * Video 영상 데이터 액세스 계약
 * edge 패턴: Aggregate로 주고받음
 */
export interface IVideoRepository {
  /**
   * Video 생성
   */
  create(videoAggregate: VideoAggregate): Promise<void>;

  /**
   * ID로 Aggregate 조회
   */
  findById(id: string): Promise<VideoAggregate | null>;

  /**
   * Slug로 Aggregate 조회
   */
  findBySlug(slug: string): Promise<VideoAggregate | null>;

  /**
   * Aggregate 업데이트
   */
  update(videoAggregate: VideoAggregate): Promise<void>;
}
