import { useMemo, type RefObject } from 'react';
import type { PageTreeNodeDTO } from '@/domains/workspace-management/shared/dtos';
import type { PageTreeItem } from './types';
import { flattenPageTree } from './utils';

const ROOT_DEPTH = -1;
const DEFAULT_DEPTH = 0;

/**
 * usePageTreeData
 *
 * PageTreeNodeDTO[] 데이터를 @headless-tree 구조에 맞게 변환합니다.
 * @param dragHiddenIds - Drag & Drop 시 임시로 숨길 아이템 ID 목록 (Set Ref)
 */
export function usePageTreeData(
  workspaceId: string,
  pages: PageTreeNodeDTO[],
  dragHiddenIds?: RefObject<Set<string>>
) {
  // ========================================
  // 1. 데이터 변환 (PageTreeNodeDTO → PageTreeItem)
  // ========================================
  const treeData = useMemo(() => {
    const nodeMap: Record<string, PageTreeItem> = {};
    const flatPages = flattenPageTree(pages, workspaceId);

    // 1. 모든 페이지를 Map에 저장
    flatPages.forEach(page => {
      nodeMap[page.id] = {
        id: page.id,
        pageId: page.id,
        workspaceId: page.workspaceId,
        title: page.title,
        icon: page.icon,
        children: [],
        parentId: page.parentId,
        order: page.order,
        isFavorite: page.isFavorite,
        lastModified: page.lastModified,
        depth: page.depth,
      };
    });

    // 2. children 배열 구성
    flatPages.forEach(page => {
      if (page.parentId) {
        const parent = nodeMap[page.parentId];
        if (parent) {
          parent.children.push(page.id);
        }
      }
    });

    // 3. order 필드로 정렬 (ASCII 기준)
    Object.values(nodeMap).forEach(node => {
      node.children.sort((a, b) => {
        const orderA = String(nodeMap[a]?.order ?? 'a0');
        const orderB = String(nodeMap[b]?.order ?? 'a0');

        if (orderA < orderB) return -1;
        if (orderA > orderB) return 1;
        return 0;
      });
    });

    return nodeMap;
  }, [pages, workspaceId]);

  // Helper functions for @headless-tree/core
  const getPageTreeItemById = useMemo(
    () => (itemId: string) => {
      return treeData[itemId] ?? null;
    },
    [treeData]
  );

  const getChildPageIds = useMemo(
    () => (itemId: string) => {
      const children = treeData[itemId]?.children ?? [];
      // 드래그 중인 아이템(임시 숨김) 제외
      if (dragHiddenIds?.current?.size) {
        return children.filter(id => !dragHiddenIds.current?.has(id));
      }
      return children;
    },
    [treeData, dragHiddenIds]
  );

  // ========================================
  // 2. Root 페이지 IDs
  // ========================================
  const rootPageIds = useMemo(() => {
    let roots = Object.values(treeData)
      .filter(page => page.parentId === null)
      .sort((a, b) => {
        const orderA = String(a.order);
        const orderB = String(b.order);
        if (orderA < orderB) return -1;
        if (orderA > orderB) return 1;
        return 0;
      })
      .map(page => page.id);

    // 드래그 중인 아이템 제외
    if (dragHiddenIds?.current?.size) {
      roots = roots.filter(id => !dragHiddenIds.current?.has(id));
    }
    return roots;
  }, [treeData, dragHiddenIds]);

  // ========================================
  // 3. DataLoader Implementation
  // ========================================
  const createTreeDataLoader = useMemo(
    () => ({
      getItem: (itemId: string): PageTreeItem => {
        // Root일 경우 가상 아이템 반환
        if (itemId === workspaceId) {
          // Root 자식 목록에서 숨겨진 아이템 제외
          const filteredChildren =
            dragHiddenIds && dragHiddenIds.current?.size
              ? rootPageIds.filter(id => !dragHiddenIds.current?.has(id))
              : rootPageIds;

          return {
            id: workspaceId,
            pageId: workspaceId,
            workspaceId,
            title: 'Root',
            children: filteredChildren,
            parentId: null,
            order: 'a0',
            isFavorite: false,
            lastModified: new Date().toISOString(),
            depth: ROOT_DEPTH,
          };
        }
        const item = getPageTreeItemById(itemId);
        // null일 경우 빈 아이템 반환
        if (!item) {
          return {
            id: itemId,
            pageId: itemId,
            workspaceId,
            title: 'Unknown',
            children: [],
            parentId: null,
            order: 'a0',
            isFavorite: false,
            lastModified: new Date().toISOString(),
            depth: DEFAULT_DEPTH,
          };
        }
        return item;
      },
      getChildren: (itemId: string) => {
        let children: string[] = [];

        if (itemId === workspaceId) {
          children = rootPageIds;
        } else {
          children = getChildPageIds(itemId);
        }

        // 숨겨진 아이템 제외 (라이브러리가 보는 뷰)
        if (dragHiddenIds && dragHiddenIds.current?.size) {
          return children.filter(id => !dragHiddenIds.current?.has(id));
        }

        return children;
      },
    }),
    [
      getPageTreeItemById,
      getChildPageIds,
      rootPageIds,
      workspaceId,
      dragHiddenIds,
    ]
  );

  return {
    treeData,
    rootPageIds,
    getPageTreeItemById,
    getChildPageIds,
    createTreeDataLoader,
  };
}
