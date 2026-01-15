/**
 * Video Entity
 *
 * Video 정보를 나타내는 도메인 엔티티
 */
import type { YoutubeScript } from '../types/transcript.types';
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
    public script: YoutubeScript | undefined,
    public scriptLanguage: string | undefined,
    public scriptExtractedAt: Date | undefined,
    public readonly viewCount: number,
    public readonly likeCount: number,
    public readonly commentCount: number,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

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
      script?: YoutubeScript;
      scriptLanguage?: string;
    scriptExtractedAt?: Date;
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
      params.script,
      params.scriptLanguage,
      params.scriptExtractedAt,
      params.viewCount,
      params.likeCount,
      params.commentCount,
      params.createdAt,
      params.updatedAt
    );
  }

  /**
   * 스크립트가 있는지 확인
   */
  hasScript(): boolean {
    return !!this.script;
  }

  /**
   * 스크립트 업데이트 (데이터 변환)
   *
   * @param script - 업데이트할 스크립트
   * @param scriptLanguage - 스크립트 언어
   */
  updateScript(script: YoutubeScript, scriptLanguage: string): void {
    // 이미 스크립트가 있으면 스킵
    if (this.hasScript()) {
      return;
    }

    // 필드 직접 업데이트
    this.script = script;
    this.scriptLanguage = scriptLanguage;
    this.scriptExtractedAt = new Date();
    this.updatedAt = new Date();
  }
}
