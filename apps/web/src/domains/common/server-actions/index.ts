/**
 * Project-specific Server Action Preset Wrappers
 *
 * 프로젝트별 인증/권한 로직이 포함된 preset wrapper들을 제공합니다.
 * 각 wrapper는 자동으로 인증 확인 및 권한 검증을 수행합니다.
 *
 * @example
 * ```ts
 * import { withPageSecureAction } from '@/domains/common/server-actions';
 *
 * export const myAction = withPageSecureAction(
 *   MyRequestSchema,
 *   'myAction',
 *   async (req, ctx) => {
 *     // ctx는 PageActionContext 타입 (workspace, organization, page 포함)
 *     return ok(result);
 *   }
 * );
 * ```
 */
import { createSecureActionBuilder } from '@/lib/server-actions/create-secure-action-builder';

import {
  authorizeByBlockMountId,
  authorizeByEdgeId,
  authorizeByPageId,
  authorizeByWorkspaceId,
  getAuthenticatedUser,
} from '../auth/helpers';
import type { AuthenticatedUser } from '../auth/helpers';
import type {
  BaseActionContext,
  PageActionContext,
  WorkspaceActionContext,
} from '../auth/types';

// ============================================
// Preset Wrappers using Fluent Chaining API
// ============================================

/**
 * Create secure action builder with project-specific authentication
 */
const secureActionBuilder =
  createSecureActionBuilder<AuthenticatedUser>(getAuthenticatedUser);

/**
 * Page-based secure action wrapper
 *
 * Use when request has `pageId` field.
 * Automatically authorizes access to the page.
 *
 * @example
 * ```ts
 * export const myAction = withPageSecureAction(
 *   MyRequestSchema,
 *   'myAction',
 *   async (req, ctx) => {
 *     // ctx is PageActionContext (includes workspace, organization, page)
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withPageSecureAction = secureActionBuilder
  .forContext<PageActionContext, BaseActionContext>()
  .withAuth(
    // Note: req is the full TRequest object, but we only need pageId for authorization
    // TypeScript's structural typing allows this partial type annotation
    (req: { pageId: string }, user: AuthenticatedUser) =>
      authorizeByPageId(req.pageId, user.id)
  )
  .build();

/**
 * Workspace-based secure action wrapper
 *
 * Use when request has `workspaceId` field and page validation is not required.
 * Automatically authorizes access to the workspace.
 *
 * @example
 * ```ts
 * export const myAction = withWorkspaceSecureAction(
 *   MyRequestSchema,
 *   'myAction',
 *   async (req, ctx) => {
 *     // ctx is WorkspaceActionContext (includes workspace, organization)
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withWorkspaceSecureAction = secureActionBuilder
  .forContext<WorkspaceActionContext, BaseActionContext>()
  .withAuth(
    // Note: req is the full TRequest object, but we only need workspaceId for authorization
    // TypeScript's structural typing allows this partial type annotation
    (req: { workspaceId: string }, user: AuthenticatedUser) =>
      authorizeByWorkspaceId(req.workspaceId, user.id)
  )
  .build();

/**
 * Edge-based secure action wrapper
 *
 * Use when request has `edgeId` field.
 * Automatically authorizes access to the edge's page.
 *
 * @example
 * ```ts
 * export const myAction = withEdgeSecureAction(
 *   MyRequestSchema,
 *   'myAction',
 *   async (req, ctx) => {
 *     // ctx is PageActionContext
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withEdgeSecureAction = secureActionBuilder
  .forContext<PageActionContext, BaseActionContext>()
  .withAuth(
    // Note: req is the full TRequest object, but we only need edgeId for authorization
    // TypeScript's structural typing allows this partial type annotation
    (req: { edgeId: string }, user: AuthenticatedUser) =>
      authorizeByEdgeId(req.edgeId, user.id)
  )
  .build();

/**
 * BlockMount-based secure action wrapper
 *
 * Use when request has `blockMountId` field.
 * Automatically authorizes access to the blockMount's page.
 *
 * @example
 * ```ts
 * export const myAction = withBlockMountSecureAction(
 *   MyRequestSchema,
 *   'myAction',
 *   async (req, ctx) => {
 *     // ctx is PageActionContext
 *     return ok(result);
 *   }
 * );
 * ```
 */
export const withBlockMountSecureAction = secureActionBuilder
  .forContext<PageActionContext, BaseActionContext>()
  .withAuth(
    // Note: req is the full TRequest object, but we only need blockMountId for authorization
    // TypeScript's structural typing allows this partial type annotation
    (req: { blockMountId: string }, user: AuthenticatedUser) =>
      authorizeByBlockMountId(req.blockMountId, user.id)
  )
  .build();

// Re-export types from common/auth/types
export type {
  BaseActionContext,
  DefaultActionContext,
  PageActionContext,
  WorkspaceActionContext,
} from '@/domains/common/auth/types';

// Re-export AuthenticatedUser from auth/helpers
export type { AuthenticatedUser } from '@/domains/common/auth/helpers';
