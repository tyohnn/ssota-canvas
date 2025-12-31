/**
 * Canvas Management - Edge Request DTOs
 *
 * Zod 스키마와 자동 생성된 타입들
 * - Schemas: 런타임 검증용
 * - Input types: 프론트엔드에서 사용 (더 유연한 타입)
 * - Output types: 서버에서 사용 (검증된 타입)
 */
import { z } from 'zod';

/**
 * 엣지 생성 요청 스키마
 *
 * ⚠️ Schema Change: now uses BlockMountId instead of BlockId
 *
 * - Frontend에서 1차 검증 (UX)
 * - Server Action에서 2차 검증 (보안)
 */
export const CreateEdgeRequestSchema = z.object({
  pageId: z.uuid('Invalid page ID'),
  sourceBlockMountId: z.uuid('Invalid source block mount ID'),
  targetBlockMountId: z.uuid('Invalid target block mount ID'),
  sourceHandle: z.enum(['left', 'right', 'top', 'bottom']),
  targetHandle: z.enum(['left', 'right', 'top', 'bottom']),
});

/**
 * 엣지 모양 업데이트 요청 스키마
 */
export const UpdateEdgeShapeRequestSchema = z.object({
  edgeId: z.uuid('Invalid edge ID'),
  newShape: z.string(),
});

/**
 * 엣지 라벨 업데이트 요청 스키마
 */
export const UpdateEdgeLabelRequestSchema = z.object({
  edgeId: z.uuid('Invalid edge ID'),
  newLabel: z.string(),
});

/**
 * 엣지 삭제 요청 스키마
 */
export const DeleteEdgeRequestSchema = z.object({
  edgeId: z.uuid('Invalid edge ID'),
});

/**
 * 엣지 스타일 업데이트 요청 스키마
 */
export const UpdateEdgeStyleRequestSchema = z.object({
  edgeId: z.uuid('Invalid edge ID'),
  style: z.object({
    stroke: z.string().optional(),
    strokeWidth: z.number().optional(),
  }),
});

// Input types (프론트엔드에서 사용)
export type CreateEdgeRequestInput = z.input<typeof CreateEdgeRequestSchema>;
export type UpdateEdgeShapeRequestInput = z.input<
  typeof UpdateEdgeShapeRequestSchema
>;
export type UpdateEdgeLabelRequestInput = z.input<
  typeof UpdateEdgeLabelRequestSchema
>;
export type UpdateEdgeStyleRequestInput = z.input<
  typeof UpdateEdgeStyleRequestSchema
>;
export type DeleteEdgeRequestInput = z.input<typeof DeleteEdgeRequestSchema>;

// Output types (서버에서 사용)
export type CreateEdgeRequest = z.output<typeof CreateEdgeRequestSchema>;
export type UpdateEdgeShapeRequest = z.output<
  typeof UpdateEdgeShapeRequestSchema
>;
export type UpdateEdgeLabelRequest = z.output<
  typeof UpdateEdgeLabelRequestSchema
>;
export type UpdateEdgeStyleRequest = z.output<
  typeof UpdateEdgeStyleRequestSchema
>;
export type DeleteEdgeRequest = z.output<typeof DeleteEdgeRequestSchema>;
