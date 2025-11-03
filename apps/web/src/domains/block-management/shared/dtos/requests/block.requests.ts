/**
 * Block Management - Request DTOs
 *
 * Zod 스키마와 자동 생성된 타입들
 * - Schemas: 런타임 검증용
 * - Input types: 프론트엔드에서 사용 (더 유연한 타입)
 * - Output types: 서버에서 사용 (검증된 타입)
 */

import { z } from 'zod';
import { blockTypeEnum } from '@/db/schema-dev';

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
 * 블록 속성 업데이트 요청 스키마
 * - Frontend에서 1차 검증 (UX)
 * - Server Action에서 2차 검증 (보안)
 */
export const UpdateBlockPropertyRequestSchema = z.object({
  blockId: z.uuid('Invalid block ID'),
  propertyPath: z.string().min(1, 'Property path is required'),
  value: z.unknown(),
  workspaceId: z.uuid('Invalid workspace ID'),
  orgId: z.uuid('Invalid organization ID'),
});

/**
 * 블록 제목 업데이트 요청 스키마
 * - Frontend에서 1차 검증 (UX)
 * - Server Action에서 2차 검증 (보안)
 */
export const UpdateBlockTitleRequestSchema = z.object({
  blockId: z.uuid('Invalid block ID'),
  title: z.string().min(1, 'Title is required'),
  workspaceId: z.uuid('Invalid workspace ID'),
  orgId: z.uuid('Invalid organization ID'),
});

// Input types (프론트엔드에서 사용)
export type UpdateBlockPropertyRequestInput = z.input<
  typeof UpdateBlockPropertyRequestSchema
>;
export type UpdateBlockTitleRequestInput = z.input<
  typeof UpdateBlockTitleRequestSchema
>;

// Output types (서버에서 사용)
export type UpdateBlockPropertyRequest = z.output<
  typeof UpdateBlockPropertyRequestSchema
>;
export type UpdateBlockTitleRequest = z.output<
  typeof UpdateBlockTitleRequestSchema
>;
