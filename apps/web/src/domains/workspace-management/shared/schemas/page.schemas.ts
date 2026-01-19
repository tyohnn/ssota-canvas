/**
 * Workspace Management - Page Request Schemas
 *
 * Zod 스키마와 자동 생성된 타입들
 * - Schemas: 런타임 검증용
 * - Output types: 서버에서 사용 (검증된 타입)
 */

import { z } from 'zod';

/**
 * Page 생성 요청 스키마
 */
export const CreatePageRequestSchema = z.object({
  workspaceId: z.uuid('Invalid workspace ID'),
  parentId: z.string().uuid('Invalid parent page ID').optional(),
  title: z.string().optional(),
  icon: z.string().optional(),
});

/**
 * Page 이동 요청 스키마
 */
export const MovePageRequestSchema = z.object({
  pageId: z.uuid('Invalid page ID'),
  newParentId: z.string().uuid('Invalid parent page ID').optional(),
  insertIndex: z.number().int().min(0).optional(), // 삽입 위치 (0부터 시작, 없으면 맨 뒤)
  prevPageId: z.string().uuid('Invalid prev page ID').optional(), // 이전 페이지 ID (UI 드롭 순서)
  nextPageId: z.string().uuid('Invalid next page ID').optional(), // 다음 페이지 ID (UI 드롭 순서)
});

/**
 * Page 정보 수정 요청 스키마
 */
export const UpdatePageInfoRequestSchema = z.object({
  pageId: z.uuid('Invalid page ID'),
  title: z.string().optional(),
  icon: z.string().nullable().optional(),
});

/**
 * Page 순서 재정렬 요청 스키마
 */
export const ReorderPagesRequestSchema = z.object({
  workspaceId: z.uuid('Invalid workspace ID'),
  parentId: z.uuid('Invalid parent page ID').optional(),
  orderedPageIds: z
    .array(z.uuid('Invalid page ID'))
    .min(1, 'At least one page ID is required'),
});

/**
 * Page 삭제 요청 스키마
 */
export const DeletePageRequestSchema = z.object({
  pageId: z.uuid('Invalid page ID'),
});

/**
 * Page 복제 요청 스키마
 */
export const DuplicatePageRequestSchema = z.object({
  pageId: z.uuid('Invalid page ID'),
});

/**
 * Page 복제 요청 스키마 (캔버스 데이터 포함)
 * 같은 워크스페이스 내에서 페이지와 캔버스 데이터를 복제
 */
export const DuplicatePageWithCanvasRequestSchema = z.object({
  pageId: z.uuid('Invalid page ID'),
});

// Output types (서버에서 사용)
export type CreatePageRequest = z.output<typeof CreatePageRequestSchema>;
export type MovePageRequest = z.output<typeof MovePageRequestSchema>;
export type UpdatePageInfoRequest = z.output<
  typeof UpdatePageInfoRequestSchema
>;
export type ReorderPagesRequest = z.output<typeof ReorderPagesRequestSchema>;
export type DeletePageRequest = z.output<typeof DeletePageRequestSchema>;
export type DuplicatePageRequest = z.output<typeof DuplicatePageRequestSchema>;
export type DuplicatePageWithCanvasRequest = z.output<typeof DuplicatePageWithCanvasRequestSchema>;
