/**
 * Video Response DTOs
 *
 * Action과 1:1 대응되는 Response DTO만 정의
 * ⚠️ DTO는 plain object여야 함 (클래스 불가, 직렬화 가능해야 함)
 */
import type { YoutubeView } from '../views';

/**
 * get-youtube-metadata.action.ts용 Response DTO
 */
export interface GetYoutubeMetadataDTO {
  video: YoutubeView;
  // Channel 정보는 별도 조회 필요 (YoutubeView에는 channelId만 있음)
  channelName?: string;
  channelThumbnail?: string;
}

/**
 * get-script.action.ts, get-video-script.action.ts용 Response DTO
 */
export interface GetScriptDTO {
  youtube: YoutubeView;
}

/**
 * extract-video-script.action.ts용 Response DTO
 */
export interface ExtractScriptDTO {
  youtube: YoutubeView;
}

/**
 * smart-summary.action.ts용 Response DTO
 */
export interface SmartSummaryDTO {
  summary: string;
  tokens?: number;
}
