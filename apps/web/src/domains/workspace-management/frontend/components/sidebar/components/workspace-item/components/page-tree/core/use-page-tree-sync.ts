import { useEffect } from 'react';
import type { PageTreeItem } from './types';
import type { PageTreeNodeDTO } from '@/domains/workspace-management/shared/dtos';

// @headless-tree/core의 Tree 타입 정의를 정확히 알 수 없어 필요한 인터페이스만 정의
interface TreeInstance {
  setSelectedItems: (ids: string[]) => void;
  getItems: () => Array<{
    getId: () => string;
    isExpanded: () => boolean;
    expand: () => void;
  }>;
  rebuildTree: () => void;
}

/**
 * usePageTreeSync
 *
 * 외부 상태(pages, selection, expansion)와 Tree 내부 상태를 동기화합니다.
 */
export function usePageTreeSync(
  tree: TreeInstance,
  pages: PageTreeNodeDTO[],
  workspaceId: string,
  selectedPageId: string | null,
  expandedPageIds: Set<string>
) {
  // ========================================
  // 1. 선택 상태 동기화 (selectedPageId → Tree)
  // ========================================
  useEffect(() => {
    if (selectedPageId) {
      tree.setSelectedItems([selectedPageId]);
    } else {
      tree.setSelectedItems([]);
    }
  }, [selectedPageId, tree]);

  // ========================================
  // 2. 펼침 상태 동기화 (expandedPageIds → Tree)
  // ========================================
  useEffect(() => {
    const treeItems = tree.getItems();
    const expandedArray = Array.from(expandedPageIds);
    expandedArray.forEach(pageId => {
      const item = treeItems.find(i => i.getId() === pageId);
      if (item && !item.isExpanded()) {
        item.expand();
      }
    });
  }, [expandedPageIds, tree]);

  // ========================================
  // 3. pages 데이터 변경 시 Tree 리빌드
  // ========================================
  useEffect(() => {
    tree.rebuildTree();
  }, [pages, tree, workspaceId]);
}
