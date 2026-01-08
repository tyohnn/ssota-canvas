// apps/web/src/domains/share/shared/dtos/request.ts

import { z } from 'zod';

/**
 * 페이지 게시 요청
 */
export const PublishPageRequestSchema = z.object({
  pageId: z.string().uuid(),
});

export type PublishPageRequest = z.infer<typeof PublishPageRequestSchema>;

/**
 * 페이지 게시 취소 요청
 */
export const UnpublishPageRequestSchema = z.object({
  pageId: z.string().uuid(),
});

export type UnpublishPageRequest = z.infer<typeof UnpublishPageRequestSchema>;

/**
 * 게시 링크 조회 요청
 */
export const GetPublishedLinkRequestSchema = z.object({
  pageId: z.string().uuid(),
});

export type GetPublishedLinkRequest = z.infer<typeof GetPublishedLinkRequestSchema>;

/**
 * 게시된 페이지 복제 요청
 */
export const CopyPublishedPageRequestSchema = z.object({
  publishToken: z.string().min(1),
  targetWorkspaceId: z.string().uuid(),
});

export type CopyPublishedPageRequest = z.infer<typeof CopyPublishedPageRequestSchema>;
