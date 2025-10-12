// apps/web/src/domains/workspace-management/frontend/components/page-tree/use-page-tree-data.tsx

import { useMemo } from 'react';
import type { PageTreeNodeDTO } from '../../../shared/dtos';
import type { PageTreeItem } from './types';
import { flattenPageTree } from './utils';

/**
 * PageTreeNodeDTO를 @headless-tree/core 형태로 변환
 *
 * @param pages - 재귀 구조의 페이지 트리
 * @returns @headless-tree/core용 데이터 구조
 */
export function usePageTreeData(pages: PageTreeNodeDTO[]) {
  const treeData = useMemo(() => {
    const nodeMap: Record<string, PageTreeItem> = {};
    const flatPages = flattenPageTree(pages); // 재귀 → 플랫

    // 1. 모든 페이지를 Map에 저장
    flatPages.forEach(page => {
      nodeMap[page.id] = {
        id: page.id,
        title: page.title,
        icon: page.icon,
        children: [], // 나중에 채움
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

    // 3. order 필드로 정렬 (폴더 우선 정렬 제거)
    Object.values(nodeMap).forEach(node => {
      node.children.sort((a, b) => {
        const orderA = nodeMap[a]?.order ?? 0;
        const orderB = nodeMap[b]?.order ?? 0;
        return orderA - orderB;
      });
    });

    return nodeMap;
  }, [pages]);

  // @headless-tree/core용 헬퍼 함수
  const getItem = useMemo(
    () => (itemId: string) => {
      return treeData[itemId] ?? null;
    },
    [treeData]
  );

  const getChildren = useMemo(
    () => (itemId: string) => {
      return treeData[itemId]?.children ?? [];
    },
    [treeData]
  );

  return { treeData, getItem, getChildren };
}
