/**
 * Video Summary Commands
 *
 * 비즈니스 의도를 명확히 표현하는 Command 패턴
 */
import { LanguageCode } from '../value-objects/language-code.vo';
import { VideoId } from '../value-objects/video-id.vo';

/**
 * VideoSummary 생성 Command
 *
 * ✅ Static 팩토리 메서드용:
 * - Aggregate.createVideoSummary()는 새로운 Aggregate를 생성
 * - Value Objects 포함 (Service에서 생성)
 * - 비즈니스 검증은 Aggregate에서 수행
 */
export interface CreateVideoSummaryCommand {
  videoId: VideoId; // Value Object
  language: LanguageCode; // Value Object
  summary: string;
}

/**
 * VideoSummary 업데이트 Command
 *
 * ✅ Aggregate 인스턴스 메서드용:
 * - summaryId 불필요 (Aggregate 인스턴스에 이미 있음)
 * - Aggregate.reconstitute() 후 updateSummary() 호출
 */
export interface UpdateVideoSummaryCommand {
  summary: string;
}
