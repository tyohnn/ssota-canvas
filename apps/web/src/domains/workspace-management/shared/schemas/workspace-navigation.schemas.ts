/**
 * Workspace Management - Workspace Navigation Request Schemas
 *
 * Zod 스키마와 자동 생성된 타입들
 * - Schemas: 런타임 검증용
 * - Output types: 서버에서 사용 (검증된 타입)
 */

import { z } from 'zod';

/**
 * 조직의 Workspace-Page 목록 조회 요청 스키마
 */
export const GetWorkspacePagesRequestSchema = z.object({
  organizationId: z.uuid('Invalid organization ID'),
  cookiePageId: z.uuid('Invalid page ID').optional(),
});

/**
 * Page 상세 정보 조회 요청 스키마
 */
export const GetPageDetailsRequestSchema = z.object({
  organizationId: z.uuid('Invalid organization ID'),
  workspaceId: z.uuid('Invalid workspace ID'),
  pageId: z.uuid('Invalid page ID'),
});

/**
 * 최근 페이지 조회 요청 스키마
 */
export const GetRecentPagesRequestSchema = z.object({
  workspaceId: z.uuid('Invalid workspace ID'),
  limit: z.number().int().positive().max(50).optional(), // 기본값: 20, 최대: 50
});

// Output types (서버에서 사용)
export type GetWorkspacePagesRequest = z.output<
  typeof GetWorkspacePagesRequestSchema
>;
export type GetPageDetailsRequest = z.output<
  typeof GetPageDetailsRequestSchema
>;
export type GetRecentPagesRequest = z.output<
  typeof GetRecentPagesRequestSchema
>;
