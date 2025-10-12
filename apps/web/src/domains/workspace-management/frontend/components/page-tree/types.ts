// apps/web/src/domains/workspace-management/frontend/components/page-tree/types.ts

import type { PageTreeNodeDTO } from '../../../shared/dtos';

/**
 * @headless-tree/core용 페이지 트리 아이템
 */
export interface PageTreeItem {
  id: string;
  title: string;
  icon?: string | null;
  children: string[]; // 자식 페이지 IDs
  parentId: string | null;
  order: number;
  isFavorite: boolean;
  lastModified: string;
  depth: number;
}

/**
 * 플랫 페이지 아이템 (유틸리티용)
 */
export interface PageFlatItem {
  id: string;
  title: string;
  icon?: string | null;
  parentId: string | null;
  order: number;
  isFavorite: boolean;
  lastModified: string;
  depth: number;
}

/**
 * PageTree Props
 */
export interface PageTreeProps {
  workspaceId: string; // 페이지가 속한 Workspace ID
  pages: PageTreeNodeDTO[]; // 페이지 트리 (재귀 구조)
  selectedPageId?: string | null; // 선택된 페이지 ID
  expandedPageIds: string[]; // 펼쳐진 페이지 IDs (배열)
  onSelectPage: (pageId: string) => void; // 페이지 선택 핸들러
  onTogglePage: (pageId: string) => void; // 페이지 펼치기/접기 핸들러
  enableDragDrop?: boolean; // 드래그앤드롭 활성화 (기본: false)
  indent?: number; // 들여쓰기 (기본: 16px)
}
