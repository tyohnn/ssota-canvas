/**
 * Workspace Management - Page Request DTOs
 *
 * Zod 스키마와 자동 생성된 타입들
 * - Schemas: 런타임 검증용
 * - Input types: 프론트엔드에서 사용 (더 유연한 타입)
 * - Output types: 서버에서 사용 (검증된 타입)
 */

import { z } from 'zod';

/**
 * 페이지 검색 요청 스키마
 */
export const SearchPagesRequestSchema = z.object({
  workspaceId: z.uuid('Invalid workspace ID'),
  orgId: z.uuid('Invalid organization ID'),
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().int().positive().max(50).optional(), // 기본값: 50, 최대: 50
});

// Input types (프론트엔드에서 사용)
export type SearchPagesRequestInput = z.input<typeof SearchPagesRequestSchema>;

// Output types (서버에서 사용)
export type SearchPagesRequest = z.output<typeof SearchPagesRequestSchema>;
