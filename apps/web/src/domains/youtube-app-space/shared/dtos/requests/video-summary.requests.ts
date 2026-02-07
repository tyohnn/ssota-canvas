/**
 * Video Summary Request DTOs
 *
 * Zod 스키마와 자동 생성된 타입들
 * - Schemas: 런타임 검증용
 * - Input types: 프론트엔드에서 사용 (더 유연한 타입)
 * - Output types: 서버에서 사용 (검증된 타입, SafeDTO)
 */
import { z } from 'zod';

/**
 * 진행 중인 Summary Job 조회 (페이지 기준, 새로고침 시 Status 창 복원용)
 */
export const GetInProgressSummaryJobRequestSchema = z.object({
  pageId: z.uuid('Invalid page ID'),
});
export type GetInProgressSummaryJobRequest = z.infer<
  typeof GetInProgressSummaryJobRequestSchema
>;

/**
 * process-video-summary.action.ts용 Request Schema
 * language는 optional (사용자 프로필 기반으로 결정)
 */
export const ExtractVideoSummaryRequestSchema = z.object({
  youtubeId: z.uuid('Invalid YouTube ID (must be UUID)'),
  blockId: z.uuid('Invalid block ID'),
  language: z.string().length(2).optional(), // ISO 639-1 (2자리)
});


/**
 * get-available-summary-languages.action.ts용 Request Schema
 * 사용 가능한 요약 언어 목록 조회 (Private workspace용)
 */
export const GetAvailableSummaryLangListRequestSchema = z.object({
  youtubeId: z.uuid('Invalid YouTube ID (must be UUID)'),
  blockId: z.uuid('Invalid block ID'),
});

/**
 * Published Page 전용 Request Schemas
 */

export const GetAvailableSummaryLangListForPublishedPageRequestSchema = z.object({
  publishToken: z.string().min(1, 'Publish token is required'),
  blockId: z.uuid('Invalid block ID'),
  youtubeId: z.uuid('Invalid YouTube ID (must be UUID)'),
});

export const ProcessVideoSummaryForPublishedPageRequestSchema = z.object({
  publishToken: z.string().min(1, 'Publish token is required'),
  youtubeId: z.uuid('Invalid YouTube ID (must be UUID)'),
  blockId: z.uuid('Invalid block ID'),
  language: z.string().length(2).optional(), // ISO 639-1 (2자리)
});

export const GetSummariesForPublishedPageRequestSchema = z.object({
  publishToken: z.string().min(1, 'Publish token is required'),
  blockId: z.uuid('Invalid block ID'),
  youtubeId: z.uuid('Invalid YouTube ID (must be UUID)'),
});

// Input types (프론트엔드에서 사용)
export type ExtractVideoSummaryRequestInput = z.input<
  typeof ExtractVideoSummaryRequestSchema
>;
export type GetAvailableSummaryLangListRequestInput = z.input<
  typeof GetAvailableSummaryLangListRequestSchema
>;
export type ProcessVideoSummaryForPublishedPageRequestInput = z.input<
  typeof ProcessVideoSummaryForPublishedPageRequestSchema
>;
export type GetAvailableSummaryLangListForPublishedPageRequestInput = z.input<
  typeof GetAvailableSummaryLangListForPublishedPageRequestSchema
>;
export type GetSummariesForPublishedPageRequestInput = z.input<
  typeof GetSummariesForPublishedPageRequestSchema
>;

// Output types (서버에서 사용, SafeDTO)
export type ProcessVideoSummaryRequest = z.output<
  typeof ExtractVideoSummaryRequestSchema
>;

// Backward compatibility
export type ExtractVideoSummaryRequest = ProcessVideoSummaryRequest;
export type GetAvailableSummaryLangListRequest = z.output<
  typeof GetAvailableSummaryLangListRequestSchema
>;
export type ProcessVideoSummaryForPublishedPageRequest = z.output<
  typeof ProcessVideoSummaryForPublishedPageRequestSchema
>;
export type GetAvailableSummaryLangListForPublishedPageRequest = z.output<
  typeof GetAvailableSummaryLangListForPublishedPageRequestSchema
>;
export type GetSummariesForPublishedPageRequest = z.output<
  typeof GetSummariesForPublishedPageRequestSchema
>;

/**
 * create-video-summary.service.ts용 Request 타입
 * Service Function에서 사용하는 내부 타입
 */
export interface CreateVideoSummaryRequest {
  videoId: string;
  language: string;
  summary: string;
  keywords?: string[]; // AI-extracted keywords (optional)
}
