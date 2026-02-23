/**
 * Chat Session Action Utilities
 *
 * Chat session 도메인 전용 Server Action wrapper
 */
import {
  authorizeByWorkspaceId,
  getAuthenticatedUser,
} from '@/domains/common/auth/helpers';
import type { AuthenticatedUser } from '@/domains/common/auth/helpers';
import type { WorkspaceActionContext } from '@/domains/common/auth/types';
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';

const chatSessionSecureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

/**
 * Chat session 전용 secure action wrapper (workspace 기반 인증)
 *
 * request에 workspaceId 필드 필요
 */
export const withChatSessionSecureAction = chatSessionSecureActionBuilder
  .forContext<WorkspaceActionContext>()
  .withAuth(
    (req: { workspaceId: string }, user: AuthenticatedUser) =>
      authorizeByWorkspaceId(req.workspaceId, user.id)
  )
  .build();
