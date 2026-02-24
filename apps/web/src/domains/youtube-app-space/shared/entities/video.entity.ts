/**
 * Video Entity
 *
 * Video 정보를 나타내는 도메인 엔티티
 * (스크립트는 sources.raw_content 사용)
 */
import { VideoId } from '../value-objects/video-id.vo';
import { VideoSlug } from '../value-objects/video-slug.vo';

export class VideoEntity {
  constructor(
    public readonly id: VideoId,
    public readonly slug: VideoSlug,
    public readonly title: string,
    public readonly description: string | undefined,
    public readonly channelId: string, // UUID (DB FK to channels table)
    public readonly publishedAt: Date | undefined,
    public readonly durationSeconds: number | undefined,
    public readonly thumbnailUrl: string | undefined,
    public readonly thumbnailHighUrl: string | undefined,
    public readonly viewCount: number,
    public readonly likeCount: number,
    public readonly commentCount: number,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) { }

  /**
   * 기존 데이터로 Video 재구성 (Repository에서 사용)
   *
   * @param params - Video 재구성에 필요한 모든 파라미터
   * @returns VideoEntity 인스턴스
   */
  static reconstitute(params: {
    id: VideoId;
    slug: VideoSlug;
    title: string;
    description?: string;
    channelId: string;
    publishedAt?: Date;
    durationSeconds?: number;
    thumbnailUrl?: string;
    thumbnailHighUrl?: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    createdAt: Date;
    updatedAt: Date;
  }): VideoEntity {
    return new VideoEntity(
      params.id,
      params.slug,
      params.title,
      params.description,
      params.channelId,
      params.publishedAt,
      params.durationSeconds,
      params.thumbnailUrl,
      params.thumbnailHighUrl,
      params.viewCount,
      params.likeCount,
      params.commentCount,
      params.createdAt,
      params.updatedAt
    );
  }
}
