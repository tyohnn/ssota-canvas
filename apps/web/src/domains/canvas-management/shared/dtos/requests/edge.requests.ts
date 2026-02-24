/**
 * Canvas Management - Edge Request DTOs
 *
 * Zod 스키마와 자동 생성된 타입들
 * - Schemas: 런타임 검증용
 * - Input types: 프론트엔드에서 사용 (더 유연한 타입)
 * - Output types: 서버에서 사용 (검증된 타입)
 */
import { z } from 'zod';

import { BlockMountSlugSchema } from './block.requests';

/** Edge slug (8~10자 hex, API의 edgeId. migration 충돌 시 10자 확장) */
export const EdgeSlugSchema = z
  .string()
  .min(8, 'Edge ID must be at least 8 characters')
  .max(10, 'Edge ID must be at most 10 characters')
  .regex(/^[a-f0-9]{8,10}$/i, 'Edge ID must be 8-10 hex characters');

/**
 * 엣지 스타일 (생성/업데이트 공통)
 */
const edgeStyleSchema = z.object({
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
});

/**
 * 마커 타입 enum (생성/업데이트 공통)
 */
const markerTypeEnum = [
  'none',
  'arrow',
  'arrow-open',
  'circle',
  'circle-open',
  'diamond',
  'diamond-open',
] as const;

/**
 * 엣지 shape enum (생성 시 지정 가능)
 */
const edgeShapeEnum = [
  'default',
  'straight',
  'step',
  'smoothstep',
  'simplebezier',
] as const;

/**
 * 엣지 생성 요청 스키마
 *
 * ⚠️ Schema Change: now uses BlockMountId instead of BlockId
 *
 * - Frontend에서 1차 검증 (UX)
 * - Server Action에서 2차 검증 (보안)
 * - label, style, shape, markerEnd, markerStart는 선택(생성 시 한 번에 지정 가능)
 */
export const CreateEdgeRequestSchema = z.object({
  pageId: z.uuid('Invalid page ID'),
  sourceBlockMountId: BlockMountSlugSchema,
  targetBlockMountId: BlockMountSlugSchema,
  sourceHandle: z.enum(['left', 'right', 'top', 'bottom']),
  targetHandle: z.enum(['left', 'right', 'top', 'bottom']),
  label: z.string().optional(),
  style: edgeStyleSchema.optional(),
  shape: z.enum(edgeShapeEnum).optional(),
  markerEnd: z.enum(markerTypeEnum).optional(),
  markerStart: z.enum(markerTypeEnum).nullable().optional(),
});

/**
 * 엣지 모양 업데이트 요청 스키마
 */
export const UpdateEdgeShapeRequestSchema = z.object({
  pageId: z.uuid('Invalid page ID'),
  edgeId: EdgeSlugSchema,
  newShape: z.string(),
});

/**
 * 엣지 라벨 업데이트 요청 스키마
 */
export const UpdateEdgeLabelRequestSchema = z.object({
  pageId: z.uuid('Invalid page ID'),
  edgeId: EdgeSlugSchema,
  newLabel: z.string(),
});

/**
 * 엣지 삭제 요청 스키마
 */
export const DeleteEdgeRequestSchema = z.object({
  pageId: z.uuid('Invalid page ID'),
  edgeId: EdgeSlugSchema,
});

/**
 * 엣지 스타일 업데이트 요청 스키마
 */
export const UpdateEdgeStyleRequestSchema = z.object({
  pageId: z.uuid('Invalid page ID'),
  edgeId: EdgeSlugSchema,
  style: z.object({
    stroke: z.string().optional(),
    strokeWidth: z.number().optional(),
  }),
});

/**
 * 엣지 마커(화살표) 업데이트 요청 스키마
 * - marker: 'start' | 'end' (어느 쪽을 바꿀지)
 * - value: MarkerType (none | arrow | arrow-open | circle | circle-open | diamond | diamond-open)
 */
export const UpdateEdgeMarkerRequestSchema = z.object({
  pageId: z.uuid('Invalid page ID'),
  edgeId: EdgeSlugSchema,
  marker: z.enum(['start', 'end']),
  value: z.enum(markerTypeEnum),
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
export type UpdateEdgeMarkerRequestInput = z.input<
  typeof UpdateEdgeMarkerRequestSchema
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
export type UpdateEdgeMarkerRequest = z.output<
  typeof UpdateEdgeMarkerRequestSchema
>;
export type DeleteEdgeRequest = z.output<typeof DeleteEdgeRequestSchema>;
