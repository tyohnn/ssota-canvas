/**
 * Video Summary Response DTOs
 *
 * Action과 1:1 대응되는 Response DTO만 정의
 * ⚠️ DTO는 plain object여야 함 (클래스 불가, 직렬화 가능해야 함)
 */
import type { VideoSummaryView } from '../views/video-summary.views';
import type { YoutubeView } from '../views/youtube.views';

/**
 * extract-video-summary.action.ts용 Response DTO
 */
export interface ExtractSummaryDTO {
  summary: VideoSummaryView;
}

/**
 * get-video-summary-by-language.action.ts용 Response DTO
 */
export interface GetSummaryDTO {
  summary: VideoSummaryView;
}

/**
 * get-video-summaries.action.ts용 Response DTO
 */
export interface GetSummariesDTO {
  summaries: VideoSummaryView[];
  video: YoutubeView;
}
