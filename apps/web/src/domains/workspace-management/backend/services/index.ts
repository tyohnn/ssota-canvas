// apps/web/src/domains/workspace-management/backend/services/index.ts

// Services
export { DefaultWorkspaceNavigationService } from './workspace-navigation.service';
export { DefaultWorkspaceCrudService } from './workspace-crud.service';
export { DefaultWorkspaceInvitationService } from './workspace-invitation.service';
export { DefaultPageHierarchyService } from './page-hierarchy.service';
export { DefaultWorkspaceQueryService } from './workspace-query.service';

// Interfaces
export type { WorkspaceNavigationService } from './interfaces/workspace-navigation.service.interface';
export type { WorkspaceCrudService } from './interfaces/workspace-crud.service.interface';
export type { WorkspaceInvitationService } from './interfaces/workspace-invitation.service.interface';
export type { PageHierarchyService } from './interfaces/page-hierarchy.service.interface';
export type { WorkspaceQueryService } from './interfaces/workspace-query.service.interface';

// Common Types
export type {
  Result,
  OrganizationWorkspacePageView,
  WorkspaceWithPages,
  PageAccessResult,
  CreateWorkspaceResult,
} from './interfaces/common.types';
export { Result as R } from './interfaces/common.types';
