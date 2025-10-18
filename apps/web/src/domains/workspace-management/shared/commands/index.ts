/**
 * Workspace Management Domain Commands
 *
 * 사용자 의도를 명확히 표현하는 Command 객체들
 */

// Workspace Commands
export interface CreateDefaultWorkspaceCommand {
  organizationId: string;
  createdBy: string;
}

export interface CreateWorkspaceCommand {
  organizationId: string;
  name: string;
  description?: string;
  icon?: string;
  createdBy: string;
}

export interface UpdateWorkspaceCommand {
  workspaceId: string;
  name?: string;
  description?: string;
  icon?: string;
  updatedBy: string;
}

export interface DeleteWorkspaceCommand {
  workspaceId: string;
  deletedBy: string;
}

// Page Commands
export interface CreatePageCommand {
  workspaceId: string;
  parentId?: string;
  title: string;
  icon?: string;
  createdBy: string;
}

export interface UpdatePageCommand {
  pageId: string;
  title?: string;
  icon?: string;
  updatedBy: string;
}

export interface MovePageCommand {
  pageId: string;
  newParentId?: string;
  newOrder?: number;
}

export interface DeletePageCommand {
  pageId: string;
  deletedBy: string;
}
