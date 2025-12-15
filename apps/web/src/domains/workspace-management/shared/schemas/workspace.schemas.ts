/**
 * Workspace Management - Workspace Request Schemas
 *
 * Zod 스키마와 자동 생성된 타입들
 * - Schemas: 런타임 검증용
 * - Output types: 서버에서 사용 (검증된 타입)
 */

import { z } from 'zod';

/**
 * Workspace 생성 요청 스키마
 */
export const CreateWorkspaceRequestSchema = z.object({
  organizationId: z.uuid('Invalid organization ID'),
  name: z.string().min(1, 'Workspace name is required'),
  description: z.string().optional(),
  icon: z.string().optional(),
});

/**
 * Workspace 정보 수정 요청 스키마
 */
export const UpdateWorkspaceInfoRequestSchema = z.object({
  workspaceId: z.uuid('Invalid workspace ID'),
  name: z.string().min(1, 'Workspace name is required').optional(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
});

// Output types (서버에서 사용)
export type CreateWorkspaceRequest = z.output<
  typeof CreateWorkspaceRequestSchema
>;
export type UpdateWorkspaceInfoRequest = z.output<
  typeof UpdateWorkspaceInfoRequestSchema
>;
