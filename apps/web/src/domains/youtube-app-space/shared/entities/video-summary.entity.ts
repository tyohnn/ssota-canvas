/**
 * Video Summary Entity
 *
 * Video Summary 정보를 나타내는 도메인 엔티티
 * - 언어별로 독립적인 요약 관리
 * - Video와의 관계는 FK로 video_id 참조
 */
import { LanguageCode } from '../value-objects/language-code.vo';
import { VideoId } from '../value-objects/video-id.vo';
import { VideoSummaryId } from '../value-objects/video-summary-id.vo';

export class VideoSummaryEntity {
  constructor(
    public readonly id: VideoSummaryId,
    public readonly videoId: VideoId,
    public readonly language: LanguageCode,
    public summary: string,
    public keywords: string[], // AI-extracted keywords
    public readonly createdAt: Date,
    public updatedAt: Date
  ) { }

  /**
   * 기존 데이터로 VideoSummary 재구성 (Repository에서 사용)
   *
   * @param params - VideoSummary 재구성에 필요한 모든 파라미터
   * @returns VideoSummaryEntity 인스턴스
   */
  static reconstitute(params: {
    id: VideoSummaryId;
    videoId: VideoId;
    language: LanguageCode;
    summary: string;
    keywords?: string[] | null;
    createdAt: Date;
    updatedAt: Date;
  }): VideoSummaryEntity {
    return new VideoSummaryEntity(
      params.id,
      params.videoId,
      params.language,
      params.summary,
      params.keywords || [],
      params.createdAt,
      params.updatedAt
    );
  }

  /**
   * Summary 업데이트
   *
   * @param newSummary - 새로운 요약 내용
   * @param newKeywords - 새로운 키워드 목록 (optional)
   */
  updateSummary(newSummary: string, newKeywords?: string[]): void {
    this.summary = newSummary;
    if (newKeywords !== undefined) {
      this.keywords = newKeywords;
    }
    this.updatedAt = new Date();
  }

  /**
   * Summary가 비어있는지 확인
   */
  isEmpty(): boolean {
    return !this.summary || this.summary.trim().length === 0;
  }
}
