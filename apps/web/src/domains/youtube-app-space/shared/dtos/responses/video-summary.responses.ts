/**
 * Video Summary Response DTOs
 *
 * Action과 1:1 대응되는 Response DTO만 정의
 * ⚠️ DTO는 plain object여야 함 (클래스 불가, 직렬화 가능해야 함)
 */
import type { VideoSummaryView } from '../views/video-summary.views';
import type { YoutubeView } from '../views/youtube.views';

/**
 * process-video-summary.action.ts용 Response DTO
 * summary가 undefined일 수 있음 (권한이 없어서 요약을 생성할 수 없는 경우)
 */
export interface ExtractSummaryDTO {
  summary: VideoSummaryView | undefined;
}

/**
 * get-video-summary-by-language.action.ts용 Response DTO
 * summary가 undefined일 수 있음 (권한은 있지만 요약이 아직 생성되지 않은 경우)
 */
export interface GetSummaryDTO {
  summary: VideoSummaryView | undefined;
}

/**
 * get-video-summaries.action.ts용 Response DTO
 */
export interface GetSummariesDTO {
  summaries: VideoSummaryView[];
  video: YoutubeView;
}

/**
 * get-available-summary-languages.action.ts용 Response DTO
 */
export interface GetAvailableSummaryLanguagesDTO {
  languages: string[];
}

/**
 * get-summaries-for-published-page.action.ts용 Response DTO
 */
export interface GetSummariesForPublishedPageDTO {
  summaries: VideoSummaryView[];
  video: YoutubeView;
}

/** 진행 중 job 한 건 (Realtime 초기 상태용, 날짜는 ISO 문자열) */
export interface InProgressSummaryJobView {
  id: string;
  block_id: string;
  status: string;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

/**
 * get-in-progress-summary-job.action.ts용 Response DTO
 * 새로고침 시 Status 창 복원용 (진행 중인 job 전체 배열)
 */
export interface GetInProgressSummaryJobDTO {
  jobs: InProgressSummaryJobView[];
}
