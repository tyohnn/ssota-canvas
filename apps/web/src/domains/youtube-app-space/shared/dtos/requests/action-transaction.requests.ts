/**
 * Action Transaction Request DTOs
 *
 * Zod 스키마와 자동 생성된 타입들
 * - Schemas: 런타임 검증용
 * - Input types: 프론트엔드에서 사용 (더 유연한 타입)
 * - Output types: 서버에서 사용 (검증된 타입, SafeDTO)
 */
import { z } from 'zod';

/**
 * create-action-transaction.action.ts용 Request Schema
 * org_id 기반으로 org 단위 권한 관리
 */
export const CreateActionTransactionRequestSchema = z.object({
  orgId: z.uuid('Invalid organization ID'),
  videoId: z.uuid('Invalid video ID'),
  actionType: z.enum(['extract_script', 'smart_summary']),
});

/**
 * check-action-transaction.action.ts용 Request Schema
 */
export const CheckActionTransactionRequestSchema = z.object({
  blockId: z.uuid('Invalid block ID'),
  actionType: z.enum(['extract_script', 'smart_summary']),
});

// Input types (프론트엔드에서 사용)
export type CreateActionTransactionRequestInput = z.input<
  typeof CreateActionTransactionRequestSchema
>;
export type CheckActionTransactionRequestInput = z.input<
  typeof CheckActionTransactionRequestSchema
>;

// Output types (서버에서 사용, SafeDTO)
export type CreateActionTransactionRequest = z.output<
  typeof CreateActionTransactionRequestSchema
>;
export type CheckActionTransactionRequest = z.output<
  typeof CheckActionTransactionRequestSchema
>;
