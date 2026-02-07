/**
 * Video Request DTOs
 *
 * Zod 스키마와 자동 생성된 타입들
 * - Schemas: 런타임 검증용
 * - Input types: 프론트엔드에서 사용 (더 유연한 타입)
 * - Output types: 서버에서 사용 (검증된 타입, SafeDTO)
 */
import { z } from 'zod';

/**
 * Video 조회 요청 스키마
 * slug로 Video 조회
 */
export const GetVideoRequestSchema = z.object({
  slug: z
    .string()
    .min(11, { message: 'Video slug must be at least 11 characters' })
    .max(11, { message: 'Video slug must be at most 11 characters' }),
});

/**
 * Video 생성 요청 스키마
 * Video 메타데이터를 생성
 */
export const CreateVideoRequestSchema = z.object({
  slug: z
    .string()
    .min(11, { message: 'Video slug must be at least 11 characters' })
    .max(11, { message: 'Video slug must be at most 11 characters' }),
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional(),
  channelId: z.uuid('Invalid channel ID').optional(),
  publishedAt: z.coerce.date().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  thumbnailUrl: z.url().optional(),
  thumbnailHighUrl: z.url().optional(),
  viewCount: z.number().int().nonnegative().optional(),
  likeCount: z.number().int().nonnegative().optional(),
  commentCount: z.number().int().nonnegative().optional(),
});

/**
 * get-youtube-metadata.action.ts용 Request Schema
 * blockId와 slug를 받음
 */
export const GetYoutubeMetadataRequestSchema = z.object({
  blockId: z.uuid('Invalid block ID'),
  slug: z
    .string()
    .min(11, { message: 'Video slug must be at least 11 characters' })
    .max(11, { message: 'Video slug must be at most 11 characters' }),
  language: z.string().length(2).optional(), // ISO 639-1 for ensure summary policy
});
/**
 * process-video-script.action.ts용 Request Schema
 */
export const ProcessVideoScriptRequestSchema = z.object({
  youtubeId: z.uuid('Invalid YouTube ID (must be UUID)'),
  blockId: z.uuid('Invalid block ID'),
});

/**
 * smart-summary.action.ts용 Request Schema
 */
export const SmartSummaryRequestSchema = z.object({
  actionTransactionId: z.uuid('Invalid action transaction ID'),
  blockId: z.uuid('Invalid block ID'),
});

/**
 * process-video-script-for-published-page.action.ts용 Request Schema
 */
export const ProcessVideoScriptForPublishedPageRequestSchema = z.object({
  publishToken: z.string().min(1, 'Publish token is required'),
  blockId: z.uuid('Invalid block ID'),
  youtubeId: z.uuid('Invalid YouTube ID (must be UUID)'),
});

// Input types (프론트엔드에서 사용)
export type GetVideoRequestInput = z.input<typeof GetVideoRequestSchema>;
export type CreateVideoRequestInput = z.input<typeof CreateVideoRequestSchema>;
export type GetYoutubeMetadataRequestInput = z.input<
  typeof GetYoutubeMetadataRequestSchema
>;
export type ProcessVideoScriptRequestInput = z.input<
  typeof ProcessVideoScriptRequestSchema
>;
export type SmartSummaryRequestInput = z.input<
  typeof SmartSummaryRequestSchema
>;
export type ProcessVideoScriptForPublishedPageRequestInput = z.input<
  typeof ProcessVideoScriptForPublishedPageRequestSchema
>;

// Output types (서버에서 사용, SafeDTO)
export type GetVideoRequest = z.output<typeof GetVideoRequestSchema>;
export type CreateVideoRequest = z.output<typeof CreateVideoRequestSchema>;
export type GetYoutubeMetadataRequest = z.output<
  typeof GetYoutubeMetadataRequestSchema
>;

export type ProcessVideoScriptRequest = z.output<
  typeof ProcessVideoScriptRequestSchema
>;
export type SmartSummaryRequest = z.output<typeof SmartSummaryRequestSchema>;
export type ProcessVideoScriptForPublishedPageRequest = z.output<
  typeof ProcessVideoScriptForPublishedPageRequestSchema
>;