// apps/web/src/domains/share/shared/dtos/response.ts

/**
 * 게시된 페이지 뷰 (공개 페이지 조회 응답)
 */
/**
 * 게시된 페이지 뷰 (공개 페이지 조회 응답)
 */
export interface PublishedPageViewDTO {
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

/**
 * 페이지 게시 결과
 */
export interface PublishResultDTO {
  pageId: string;
  publishToken: string;
  publishUrl: string; // /p/[token]
  publishedAt: string;
}

/**
 * 게시 링크 조회 결과
 */
export interface PublishedLinkViewDTO {
  pageId: string;
  publishToken: string;
  publishUrl: string;
  publishedAt: string;
}

/**
 * 워크스페이스 선택 목록
 */
export interface WorkspaceSelectionViewDTO {
  workspaces: {
    id: string;
    name: string;
    icon?: string;
    organizationName?: string;
  }[];
}

/**
 * 페이지 복제 결과
 */
export interface CopyResultDTO {
  copiedPageId: string;
  targetWorkspaceId: string;
  status: 'completed' | 'failed';
  errorMessage?: string; // status === 'failed' only
}
