/**
 * Canvas Management - Block Request DTOs
 *
 * Zod 스키마와 자동 생성된 타입들
 * - Schemas: 런타임 검증용
 * - Input types: 프론트엔드에서 사용 (더 유연한 타입)
 * - Output types: 서버에서 사용 (검증된 타입)
 */

import { z } from 'zod';
import { blockTypeEnum } from '@/db/schema-dev';
import type { Position, Size } from '../../types/common.types';

/**
 * Block Type 검증 스키마
 *
 * 데이터베이스 스키마(schema-dev.ts)를 SSOT로 사용
 * - blockTypeEnum.enumValues를 직접 사용하여 동기화 보장
 * - 수동으로 enum 값들을 나열하지 않음
 */
export const BlockTypeSchema = z.enum(
  blockTypeEnum.enumValues as [string, ...string[]]
);

/**
 * Position 기본 구조 검증 스키마
 *
 * ⚠️ Trusted Region에서는 Value Object가 비즈니스 검증 담당
 * - 구조적 검증만 수행 (타입, 존재 여부)
 * - 비즈니스 규칙은 Position Value Object에서 처리
 */
export const PositionSchema = z.object({
  x: z.number().refine(Number.isFinite, 'X must be a finite number'),
  y: z.number().refine(Number.isFinite, 'Y must be a finite number'),
});

/**
 * Size 기본 구조 검증 스키마
 *
 * ⚠️ Trusted Region에서는 Value Object가 비즈니스 검증 담당
 * - 구조적 검증만 수행 (타입, 존재 여부)
 * - 비즈니스 규칙은 Size Value Object에서 처리
 */
export const SizeSchema = z.object({
  width: z.number().refine(Number.isFinite, 'Width must be a finite number'),
  height: z.number().refine(Number.isFinite, 'Height must be a finite number'),
});

/**
 * 블럭 생성 요청 스키마
 *
 * - Frontend에서 1차 검증 (UX)
 * - Server Action에서 2차 검증 (보안)
 *
 * ⚠️ SSOT: size는 optional로 두고, 실제 사용 시 getBlockSize()로 기본값 설정
 */
export const CreateAndMountBlockRequestSchema = z.object({
  pageId: z.uuid('Invalid page ID'),
  blockType: BlockTypeSchema,
  position: PositionSchema,
  size: SizeSchema, // 프론트엔드에서 항상 전달됨
  workspaceId: z.uuid('Invalid workspace ID'),
  orgId: z.uuid('Invalid organization ID'),
  // 선택적 초기 properties (예: 클립보드 붙여넣기 시 URL 등)
  initialProperties: z.record(z.string(), z.any()).optional(),
  // 선택적 초기 content (예: 마크다운 텍스트 붙여넣기)
  initialContent: z.any().optional(), // JSONB - TipTap JSON, 텍스트, 코드 등
});

/**
 * 블럭 위치 업데이트 요청 스키마 (단일 또는 다중)
 */
export const UpdateBlockPositionRequestSchema = z.object({
  blockPositions: z.array(
    z.object({
      blockMountId: z.uuid('Invalid block mount ID'),
      position: PositionSchema,
    })
  ),
  orgId: z.uuid('Invalid organization ID'),
  workspaceId: z.uuid('Invalid workspace ID'),
});

/**
 * 블럭 크기 업데이트 요청 스키마
 */
export const UpdateBlockSizeRequestSchema = z.object({
  blockMountId: z.uuid('Invalid block mount ID'),
  newSize: SizeSchema,
  orgId: z.uuid('Invalid organization ID'),
  workspaceId: z.uuid('Invalid workspace ID'),
});

/**
 * 블럭 마운트 삭제 요청 스키마 (단일 또는 다중)
 */
export const SoftDeleteBlockMountRequestSchema = z.object({
  blockMountIds: z.array(z.uuid('Invalid block mount ID')),
  orgId: z.uuid('Invalid organization ID'),
  workspaceId: z.uuid('Invalid workspace ID'),
});

/**
 * 블럭 복제 요청 스키마
 */
export const DuplicateBlockAndMountRequestSchema = z.object({
  blockMountId: z.uuid('Invalid block mount ID'),
  workspaceId: z.uuid('Invalid workspace ID'),
  orgId: z.uuid('Invalid organization ID'),
  offsetX: z.number().optional(),
  offsetY: z.number().optional(),
});

// Input types (프론트엔드에서 사용)
export type CreateAndMountBlockRequestInput = z.input<
  typeof CreateAndMountBlockRequestSchema
>;
export type UpdateBlockPositionRequestInput = z.input<
  typeof UpdateBlockPositionRequestSchema
>;
export type UpdateBlockSizeRequestInput = z.input<
  typeof UpdateBlockSizeRequestSchema
>;
export type SoftDeleteBlockMountRequestInput = z.input<
  typeof SoftDeleteBlockMountRequestSchema
>;
export type DuplicateBlockAndMountRequestInput = z.input<
  typeof DuplicateBlockAndMountRequestSchema
>;

// Output types (서버에서 사용)
export type CreateAndMountBlockRequest = z.output<
  typeof CreateAndMountBlockRequestSchema
>;
export type UpdateBlockPositionRequest = z.output<
  typeof UpdateBlockPositionRequestSchema
>;
export type UpdateBlockSizeRequest = z.output<
  typeof UpdateBlockSizeRequestSchema
>;
export type SoftDeleteBlockMountRequest = z.output<
  typeof SoftDeleteBlockMountRequestSchema
>;
export type DuplicateBlockAndMountRequest = z.output<
  typeof DuplicateBlockAndMountRequestSchema
>;
