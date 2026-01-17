// apps/web/src/domains/share/shared/dtos/response.ts

import type { CanvasViewData } from '@/domains/canvas-management/shared/dtos/views/canvas.views';

/**
 * 게시된 페이지 뷰 (공개 페이지 조회 응답)
 * CanvasViewData를 확장하여 페이지 메타데이터 추가
 */
export interface PublishedPageViewDTO extends CanvasViewData {
  title: string;
  icon?: string;
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
 * 페이지 복제 결과
 */
export interface CopyResultDTO {
  copiedPageId: string;
  targetWorkspaceId: string;
  status: 'completed' | 'failed';
  errorMessage?: string; // status === 'failed' only
}
