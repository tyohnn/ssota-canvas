// apps/web/src/domains/share/shared/types/index.ts

export type PageId = string;
export type UserId = string;
export type WorkspaceId = string;
export type CopyWorkflowId = string;

export type PublishedStatus = 'published';
export type WorkflowStatus =
  | 'pending'
  | 'waiting_login'
  | 'selecting_workspace'
  | 'copying'
  | 'completed'
  | 'failed';
