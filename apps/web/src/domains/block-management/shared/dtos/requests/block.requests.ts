/**
 * Block Management - Request DTOs
 *
 * Zod 스키마와 자동 생성된 타입들
 * - Schemas: 런타임 검증용
 * - Input types: 프론트엔드에서 사용 (더 유연한 타입)
 * - Output types: 서버에서 사용 (검증된 타입)
 */
import { z } from 'zod';

import { blockTypeEnum } from '@/db/schema';

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
 * 블록 생성 요청 스키마
 */
export const CreateBlockRequestSchema = z.object({
  workspaceId: z.uuid('Invalid workspace ID'),
  blockType: BlockTypeSchema,
  title: z.string().min(1, 'Title is required'),
  initialProperties: z.record(z.string(), z.unknown()).optional(),
  initialContent: z.unknown().optional(),
});

/**
 * 블록 복제 요청 스키마
 */
export const DuplicateBlockRequestSchema = z.object({
  workspaceId: z.uuid('Invalid workspace ID'),
  blockId: z.uuid('Invalid block ID'),
});

/**
 * 블록 복원 요청 스키마
 */
export const RestoreBlockRequestSchema = z.object({
  workspaceId: z.uuid('Invalid workspace ID'),
  blockId: z.uuid('Invalid block ID'),
});

/**
 * 블록 소프트 삭제 요청 스키마
 */
export const SoftDeleteBlockRequestSchema = z.object({
  workspaceId: z.uuid('Invalid workspace ID'),
  blockId: z.uuid('Invalid block ID'),
});

/**
 * 블록 속성 업데이트 요청 스키마
 * - Frontend에서 1차 검증 (UX)
 * - Server Action에서 2차 검증 (보안)
 */
export const UpdateBlockPropertyRequestSchema = z.object({
  blockId: z.uuid('Invalid block ID'),
  propertyPath: z.string().min(1, 'Property path is required'),
  value: z.unknown(),
});

/**
 * 블록 속성 일괄 업데이트 요청 스키마 (Bulk Update)
 * - 여러 properties를 한 번에 업데이트
 * - Frontend에서 1차 검증 (UX)
 * - Server Action에서 2차 검증 (보안)
 */
export const UpdateBlockPropertiesRequestSchema = z.object({
  blockId: z.uuid('Invalid block ID'),
  properties: z.record(z.string(), z.unknown()),
});

/**
 * 블록 제목 업데이트 요청 스키마
 * - Frontend에서 1차 검증 (UX)
 * - Server Action에서 2차 검증 (보안)
 */
export const UpdateBlockTitleRequestSchema = z.object({
  blockId: z.uuid('Invalid block ID'),
  title: z.string().min(1, 'Title is required'),
});

/**
 * 블록 콘텐츠 업데이트 요청 스키마
 * - block.content JSONB 컬럼 업데이트
 * - TipTap JSON, 기타 구조화된 콘텐츠에 사용
 * - Frontend에서 1차 검증 (UX)
 * - Server Action에서 2차 검증 (보안)
 */
export const UpdateBlockContentRequestSchema = z.object({
  blockId: z.uuid('Invalid block ID'),
  content: z.unknown(), // JSONB - 자유로운 JSON 구조 허용 (TipTap JSON)
  contentRaw: z.string().optional(), // Markdown 텍스트 (AI context용)
});

/**
 * 블록 콘텐츠 Step 적용 요청 스키마 (ProseMirror steps)
 * - steps: Step JSON 배열
 * - baseVersion: 클라이언트가 알고 있는 content_version (낙관적 잠금)
 */
export const ApplyBlockContentStepsRequestSchema = z.object({
  blockId: z.uuid('Invalid block ID'),
  steps: z.array(z.unknown()).min(1, 'At least one step required'),
  baseVersion: z.number().int().min(0),
});

/**
 * Blur 시 감사 로그만 기록 (block 업데이트 없음). event_log에 patch만 저장.
 */
export const LogBlockUpdatedAuditRequestSchema = z.object({
  blockId: z.uuid('Invalid block ID'),
  patch: z.string(),
});

// Input types (프론트엔드에서 사용)
export type UpdateBlockPropertyRequestInput = z.input<
  typeof UpdateBlockPropertyRequestSchema
>;
export type UpdateBlockPropertiesRequestInput = z.input<
  typeof UpdateBlockPropertiesRequestSchema
>;
export type UpdateBlockTitleRequestInput = z.input<
  typeof UpdateBlockTitleRequestSchema
>;
export type UpdateBlockContentRequestInput = z.input<
  typeof UpdateBlockContentRequestSchema
>;
export type ApplyBlockContentStepsRequestInput = z.input<
  typeof ApplyBlockContentStepsRequestSchema
>;
export type LogBlockUpdatedAuditRequestInput = z.input<
  typeof LogBlockUpdatedAuditRequestSchema
>;

// Input types
export type CreateBlockRequestInput = z.input<typeof CreateBlockRequestSchema>;
export type DuplicateBlockRequestInput = z.input<
  typeof DuplicateBlockRequestSchema
>;
export type RestoreBlockRequestInput = z.input<
  typeof RestoreBlockRequestSchema
>;
export type SoftDeleteBlockRequestInput = z.input<
  typeof SoftDeleteBlockRequestSchema
>;

// Output types (서버에서 사용)
export type UpdateBlockPropertyRequest = z.output<
  typeof UpdateBlockPropertyRequestSchema
>;
export type UpdateBlockPropertiesRequest = z.output<
  typeof UpdateBlockPropertiesRequestSchema
>;
export type UpdateBlockTitleRequest = z.output<
  typeof UpdateBlockTitleRequestSchema
>;
export type UpdateBlockContentRequest = z.output<
  typeof UpdateBlockContentRequestSchema
>;
export type ApplyBlockContentStepsRequest = z.output<
  typeof ApplyBlockContentStepsRequestSchema
>;
export type LogBlockUpdatedAuditRequest = z.output<
  typeof LogBlockUpdatedAuditRequestSchema
>;

// Output types (SafeDTO)
export type CreateBlockRequest = z.output<typeof CreateBlockRequestSchema>;
export type DuplicateBlockRequest = z.output<
  typeof DuplicateBlockRequestSchema
>;
export type RestoreBlockRequest = z.output<typeof RestoreBlockRequestSchema>;
export type SoftDeleteBlockRequest = z.output<
  typeof SoftDeleteBlockRequestSchema
>;
