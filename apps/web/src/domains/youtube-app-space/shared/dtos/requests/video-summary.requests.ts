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
 * extract-video-summary.action.ts용 Request Schema
 * language는 optional (사용자 프로필 기반으로 결정)
 */
export const ExtractVideoSummaryRequestSchema = z.object({
  youtubeId: z.uuid('Invalid YouTube ID (must be UUID)'),
  blockId: z.uuid('Invalid block ID'),
  language: z.string().length(2).optional(), // ISO 639-1 (2자리)
});

/**
 * get-video-summary-by-language.action.ts용 Request Schema
 * 특정 언어의 요약 조회
 */
export const GetVideoSummaryByLanguageRequestSchema = z.object({
  youtubeId: z.uuid('Invalid YouTube ID (must be UUID)'),
  blockId: z.uuid('Invalid block ID'),
  language: z.string().length(2), // ISO 639-1 (2자리)
});

/**
 * get-video-summaries.action.ts용 Request Schema
 * 모든 언어의 요약 조회
 */
export const GetVideoSummariesRequestSchema = z.object({
  youtubeId: z.uuid('Invalid YouTube ID (must be UUID)'),
  blockId: z.uuid('Invalid block ID'),
});

// Input types (프론트엔드에서 사용)
export type ExtractVideoSummaryRequestInput = z.input<
  typeof ExtractVideoSummaryRequestSchema
>;
export type GetVideoSummaryByLanguageRequestInput = z.input<
  typeof GetVideoSummaryByLanguageRequestSchema
>;
export type GetVideoSummariesRequestInput = z.input<
  typeof GetVideoSummariesRequestSchema
>;

// Output types (서버에서 사용, SafeDTO)
export type ExtractVideoSummaryRequest = z.output<
  typeof ExtractVideoSummaryRequestSchema
>;
export type GetVideoSummaryByLanguageRequest = z.output<
  typeof GetVideoSummaryByLanguageRequestSchema
>;
export type GetVideoSummariesRequest = z.output<
  typeof GetVideoSummariesRequestSchema
>;

/**
 * create-video-summary.service.ts용 Request 타입
 * Service Function에서 사용하는 내부 타입
 */
export interface CreateVideoSummaryRequest {
  videoId: string;
  language: string;
  summary: string;
}
