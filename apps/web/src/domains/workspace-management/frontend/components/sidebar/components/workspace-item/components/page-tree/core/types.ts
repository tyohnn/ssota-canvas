import type { PageTreeNodeDTO } from '@/domains/workspace-management/shared/dtos';

/**
 * @headless-tree/core용 페이지 트리 아이템
 */
export interface PageTreeItem {
  id: string;
  pageId: string; // Page ID (id와 동일, 명시성)
  workspaceId: string; // Page가 속한 Workspace ID
  title: string;
  icon?: string | null;
  children: string[]; // 자식 페이지 IDs
  parentId: string | null;
  order: string; // Fractional index (e.g., 'a0', 'a1', 'a0V')
  isFavorite: boolean;
  lastModified: string;
  depth: number;
}

/**
 * 플랫 페이지 아이템 (유틸리티용)
 */
export interface PageFlatItem {
  id: string;
  workspaceId: string; // Page가 속한 Workspace ID
  title: string;
  icon?: string | null;
  parentId: string | null;
  order: string; // Fractional index (e.g., 'a0', 'a1', 'a0V')
  isFavorite: boolean;
  lastModified: string;
  depth: number;
}

/**
 * PageTree Props
 */
export interface PageTreeProps {
  workspaceId: string;
  pages: PageTreeNodeDTO[];
  organizationId: string;
  initialSelectedPageId?: string | null;
  onSelectPage?: (pageId: string) => void;
  onPagesUpdate?: (pages: PageTreeNodeDTO[]) => void;
  enableDragDrop?: boolean;
  indent?: number;
}
