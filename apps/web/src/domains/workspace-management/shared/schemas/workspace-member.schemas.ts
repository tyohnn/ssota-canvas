/**
 * Workspace Management - Workspace Member Request Schemas
 *
 * Zod 스키마와 자동 생성된 타입들
 * - Schemas: 런타임 검증용
 * - Output types: 서버에서 사용 (검증된 타입)
 */

import { z } from 'zod';

/**
 * Workspace 멤버 초대 요청 스키마
 */
export const InviteWorkspaceMemberRequestSchema = z.object({
  workspaceId: z.uuid('Invalid workspace ID'),
  memberEmails: z
    .array(z.string().email('Invalid email address'))
    .min(1, 'At least one email is required'),
});

/**
 * 초대 처리 요청 스키마 (수락/거절)
 */
export const ProcessInvitationRequestSchema = z.object({
  invitationId: z.uuid('Invalid invitation ID'),
});

/**
 * 조직 멤버 검색 요청 스키마
 */
export const SearchOrganizationMembersRequestSchema = z.object({
  workspaceId: z.uuid('Invalid workspace ID'),
  query: z.string().min(1, 'Search query is required'),
});

/**
 * Workspace 멤버 목록 조회 요청 스키마
 */
export const GetWorkspaceMembersRequestSchema = z.object({
  workspaceId: z.uuid('Invalid workspace ID'),
});

// Output types (서버에서 사용)
export type InviteWorkspaceMemberRequest = z.output<
  typeof InviteWorkspaceMemberRequestSchema
>;
export type ProcessInvitationRequest = z.output<
  typeof ProcessInvitationRequestSchema
>;
export type SearchOrganizationMembersRequest = z.output<
  typeof SearchOrganizationMembersRequestSchema
>;
export type GetWorkspaceMembersRequest = z.output<
  typeof GetWorkspaceMembersRequestSchema
>;
