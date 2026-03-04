/**
 * Post Request DTOs
 */
import { z } from 'zod';
import { BlockSlugSchema } from '@/domains/block-management/shared/dtos/requests/block.requests';

export const GetPostRequestSchema = z.object({
  postId: z.string().min(10, 'Post ID must be at least 10 digits'),
});

export const CreatePostRequestSchema = z.object({
  postId: z.string().min(10, 'Post ID must be at least 10 digits'),
  text: z.string().min(1, 'Text is required'),
  articleUrl: z.url().optional(),
  attachmentUrls: z.array(z.url()).optional(),
  profileId: z.uuid('Invalid profile ID').optional(),
  postedAt: z.coerce.date().optional(),
  likeCount: z.number().int().nonnegative().optional(),
  retweetCount: z.number().int().nonnegative().optional(),
  replyCount: z.number().int().nonnegative().optional(),
  quoteCount: z.number().int().nonnegative().optional(),
});

export const GetXMetadataRequestSchema = z.object({
  workspaceId: z.uuid('Invalid workspace ID'),
  blockId: BlockSlugSchema,
  postId: z.string().min(10, 'Post ID must be at least 10 digits'),
  language: z.string().length(2).optional(),
});

/**
 * fetch-x-metadata-preview.action.ts용 Request Schema
 * 블록 없이 workspaceId + postId만으로 메타데이터 조회 (Drive 미리보기 등)
 */
export const FetchXMetadataPreviewRequestSchema = z.object({
  workspaceId: z.uuid('Invalid workspace ID'),
  postId: z.string().min(10, 'Post ID must be at least 10 digits'),
});

export type GetPostRequest = z.output<typeof GetPostRequestSchema>;
export type CreatePostRequest = z.output<typeof CreatePostRequestSchema>;
export type GetXMetadataRequest = z.output<typeof GetXMetadataRequestSchema>;
export type FetchXMetadataPreviewRequest = z.output<
  typeof FetchXMetadataPreviewRequestSchema
>;
