/**
 * Image Search Request DTOs
 *
 * 이미지 검색 Server Action 요청 스키마
 *
 * ⚠️ Migrated from block-management domain to image-app-space domain
 */

import { z } from 'zod';

/**
 * 이미지 검색 요청 스키마
 */
export const SearchImageAssetsRequestSchema = z.object({
  /** 조직 ID */
  orgId: z.uuid('Invalid organization ID'),

  /** 워크스페이스 ID */
  workspaceId: z.uuid('Invalid workspace ID'),

  /** 검색 쿼리 */
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query is too long'),

  /** 검색 타입 */
  searchType: z.enum(['keyword', 'semantic', 'combined']).default('combined'),

  /** 결과 개수 */
  topK: z.number().int().min(1).max(30).default(12),

  /** 페이지 번호 */
  page: z.number().int().min(1).default(1),
});

/**
 * 이미지 검색 요청 타입
 */
export type SearchImageAssetsRequest = z.infer<
  typeof SearchImageAssetsRequestSchema
>;

/**
 * 이미지 검색 요청 입력 타입 (런타임 검증 전)
 */
export type SearchImageAssetsRequestInput = z.input<
  typeof SearchImageAssetsRequestSchema
>;
