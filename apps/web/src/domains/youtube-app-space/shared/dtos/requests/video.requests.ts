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
});

/**
 * get-video-script.action.ts용 Request Schema
 */
export const GetVideoScriptRequestSchema = z.object({
  blockId: z.uuid('Invalid block ID'),
});

/**
 * create-action-transaction.action.ts용 Request Schema
 */
export const CreateActionTransactionRequestSchema = z.object({
  blockId: z.uuid('Invalid block ID'),
  videoId: z.uuid('Invalid video ID'),
  actionType: z.enum(['get_script', 'smart_summary']),
});

/**
 * smart-summary.action.ts용 Request Schema
 */
export const SmartSummaryRequestSchema = z.object({
  actionTransactionId: z.uuid('Invalid action transaction ID'),
  blockId: z.uuid('Invalid block ID'),
});

// Input types (프론트엔드에서 사용)
export type GetVideoRequestInput = z.input<typeof GetVideoRequestSchema>;
export type CreateVideoRequestInput = z.input<typeof CreateVideoRequestSchema>;
export type GetYoutubeMetadataRequestInput = z.input<
  typeof GetYoutubeMetadataRequestSchema
>;
export type GetVideoScriptRequestInput = z.input<
  typeof GetVideoScriptRequestSchema
>;
export type CreateActionTransactionRequestInput = z.input<
  typeof CreateActionTransactionRequestSchema
>;
export type SmartSummaryRequestInput = z.input<
  typeof SmartSummaryRequestSchema
>;

// Output types (서버에서 사용, SafeDTO)
export type GetVideoRequest = z.output<typeof GetVideoRequestSchema>;
export type CreateVideoRequest = z.output<typeof CreateVideoRequestSchema>;
export type GetYoutubeMetadataRequest = z.output<
  typeof GetYoutubeMetadataRequestSchema
>;
export type GetVideoScriptRequest = z.output<
  typeof GetVideoScriptRequestSchema
>;
export type CreateActionTransactionRequest = z.output<
  typeof CreateActionTransactionRequestSchema
>;
export type SmartSummaryRequest = z.output<typeof SmartSummaryRequestSchema>;
