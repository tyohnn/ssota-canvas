/**
 * Storage 도메인 요청 스키마 및 타입
 */

import { z } from 'zod';

import { BlockSlugSchema } from '@/domains/block-management/shared/dtos/requests/block.requests';

/**
 * 공개 페이지 Canvas Asset Access URL 갱신 요청
 * (인증 불필요, publishToken + blockId 검증)
 */
export const RefreshPublishedCanvasAssetAccessUrlRequestSchema = z.object({
  publishToken: z.string().min(1, 'Publish token is required'),
  blockId: BlockSlugSchema,
});

export type RefreshPublishedCanvasAssetAccessUrlRequestInput = z.input<
  typeof RefreshPublishedCanvasAssetAccessUrlRequestSchema
>;
export type RefreshPublishedCanvasAssetAccessUrlRequest = z.output<
  typeof RefreshPublishedCanvasAssetAccessUrlRequestSchema
>;
