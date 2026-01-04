// apps/web/src/domains/share/shared/dtos/index.ts

export interface PublishedPageView {
  pageId: string;
  title: string;
  icon?: string;
  blocks: unknown[];
  edges?: unknown[];
  viewport?: { x: number; y: number; zoom: number } | null;
  publishToken: string;
  status: 'published';
  isReadOnly: true;
  workspaceId?: string;
  organizationId?: string;
}

export interface PublishResult {
  pageId: string;
  publishToken: string;
  publishUrl: string; // /p/[token]
  publishedAt: string;
}

export interface WorkspaceSelectionView {
  workspaces: {
    id: string;
    name: string;
    icon?: string;
    organizationName?: string;
  }[];
}

export interface CopyResult {
  copiedPageId: string;
  targetWorkspaceId: string;
  status: 'completed' | 'failed';
  errorMessage?: string; // status === 'failed' only
}

export interface PublishPageRequest {
  pageId: string;
}

export interface CopyPublishedPageRequest {
  publishToken: string;
  targetWorkspaceId: string;
}

export interface UnpublishPageRequest {
  pageId: string;
}
