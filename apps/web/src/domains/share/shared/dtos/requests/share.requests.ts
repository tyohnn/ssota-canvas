import { z } from 'zod';

/**
 * 페이지 게시 요청
 */
export const PublishPageRequestSchema = z.object({
  pageId: z.string().min(1),
});

export type PublishPageRequest = z.infer<typeof PublishPageRequestSchema>;

/**
 * 게시된 페이지 복제 요청
 */
export const CopyPublishedPageRequestSchema = z.object({
  publishToken: z.string().min(1),
  targetWorkspaceId: z.string().min(1),
});

export type CopyPublishedPageRequest = z.infer<typeof CopyPublishedPageRequestSchema>;

/**
 * 페이지 게시 중단 요청
 */
export const UnpublishPageRequestSchema = z.object({
  pageId: z.string().min(1),
});

export type UnpublishPageRequest = z.infer<typeof UnpublishPageRequestSchema>;

/**
 * 게시된 링크 조회 요청
 */
export const GetPublishedLinkRequestSchema = z.object({
  pageId: z.string().min(1),
});

export type GetPublishedLinkRequest = z.infer<typeof GetPublishedLinkRequestSchema>;
