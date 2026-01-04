// apps/web/src/domains/share/infrastructure/acl/workspace-management.acl.ts

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

export interface WorkspaceManagementAcl {
  getPageSnapshot(pageId: string): Promise<PageSnapshot>;
  getWorkspacesForUser(userId: string): Promise<WorkspaceSummary[]>;
  copyPageToWorkspace(
    pageId: string,
    workspaceId: string,
    userId: string
  ): Promise<string>; // returns copied page id
}
