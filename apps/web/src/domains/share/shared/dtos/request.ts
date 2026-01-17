// apps/web/src/domains/share/shared/dtos/request.ts

import { z } from 'zod';

/**
 * 페이지 게시 요청
 */
export const PublishPageRequestSchema = z.object({
  pageId: z.uuid(),
});

export type PublishPageRequestInput = z.input<typeof PublishPageRequestSchema>;
export type PublishPageRequest = z.output<typeof PublishPageRequestSchema>;

/**
 * 페이지 게시 취소 요청
 */
export const UnpublishPageRequestSchema = z.object({
  pageId: z.uuid(),
});

export type UnpublishPageRequestInput = z.input<typeof UnpublishPageRequestSchema>;
export type UnpublishPageRequest = z.output<typeof UnpublishPageRequestSchema>;

/**
 * 게시 링크 조회 요청
 */
export const GetPublishedLinkRequestSchema = z.object({
  pageId: z.uuid(),
});

export type GetPublishedLinkRequestInput = z.input<typeof GetPublishedLinkRequestSchema>;
export type GetPublishedLinkRequest = z.output<typeof GetPublishedLinkRequestSchema>;

/**
 * 게시된 페이지 복제 요청
 */
export const CopyPublishedPageRequestSchema = z.object({
  publishToken: z.string().min(1),
  targetWorkspaceId: z.uuid(),
});

export type CopyPublishedPageRequestInput = z.input<typeof CopyPublishedPageRequestSchema>;
export type CopyPublishedPageRequest = z.output<typeof CopyPublishedPageRequestSchema>;

/**
 * 게시된 페이지 조회 요청 (공개)
 * publishToken만 필요 (인증 불필요)
 */
export const GetPublishedPageRequestSchema = z.string().min(1);

export type GetPublishedPageRequestInput = z.input<typeof GetPublishedPageRequestSchema>;
export type GetPublishedPageRequest = z.output<typeof GetPublishedPageRequestSchema>;
