// apps/web/src/domains/share/backend/services/workspace-management.acl.ts

export interface WorkspaceSummary {
  id: string;
  name: string;
  icon?: string;
  organizationName?: string;
}

export interface PageSnapshot {
  pageId: string;
  title: string;
  icon?: string;
  blocks: unknown[];
}

export interface PageInfo {
  pageId: string;
  title: string;
  icon?: string;
  workspaceId?: string;
}

export interface WorkspaceInfo {
  workspaceId: string;
  organizationId?: string;
}

export interface WorkspaceManagementAcl {
  getPageSnapshot(pageId: string): Promise<PageSnapshot>;
  getWorkspacesForUser(userId: string): Promise<WorkspaceSummary[]>;
  getPageInfo(pageId: string): Promise<PageInfo | null>;
  getWorkspaceInfo(workspaceId: string): Promise<WorkspaceInfo | null>;
}
