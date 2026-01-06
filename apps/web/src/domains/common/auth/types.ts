/**
 * Project-specific Action Context Types
 *
 * These types are specific to this project's domain model.
 * For a project-agnostic version, see @/lib/server-actions/types
 */
import type { MemberRole } from '@/domains/organization-management/shared/types';
import type { Page } from '@/domains/workspace-management/shared/entities/page.entity';
import type { Workspace } from '@/domains/workspace-management/shared/entities/workspace.entity';

import type { AuthenticatedUser } from './helpers';

/**
 * Base context that includes authenticated user
 * This is project-specific and should be defined per project
 */
export interface BaseActionContext {
  authenticatedUser: AuthenticatedUser;
}

/**
 * Default context for legacy getPageId (includes workspace + page)
 * Used for backward compatibility
 */
export interface DefaultActionContext extends BaseActionContext {
  workspace: Workspace;
  page: Page;
}

/**
 * Page-based actions context (edge, blockMount)
 * Includes workspace, organization, page, and authenticatedUser
 */
export interface PageActionContext extends BaseActionContext {
  workspace: Workspace;
  organization: { id: string; role: MemberRole };
  page: Page;
}

/**
 * Workspace-based actions context (block actions without page validation)
 * Includes workspace, organization, and authenticatedUser
 */
export interface WorkspaceActionContext extends BaseActionContext {
  workspace: Workspace;
  organization: { id: string; role: MemberRole };
}
