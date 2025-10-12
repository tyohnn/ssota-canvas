// apps/web/src/domains/workspace-management/frontend/components/page-tree/utils.ts

import type { PageTreeNodeDTO } from '../../../shared/dtos';
import type { PageFlatItem } from './types';

/**
 * 재귀 페이지 트리를 플랫 배열로 변환
 *
 * @param tree - 재귀 구조의 페이지 트리
 * @returns 플랫 배열 (parentId, order 포함)
 */
export function flattenPageTree(tree: PageTreeNodeDTO[]): PageFlatItem[] {
  const result: PageFlatItem[] = [];

  function traverse(nodes: PageTreeNodeDTO[], parentId: string | null = null) {
    nodes.forEach(node => {
      result.push({
        id: node.id,
        title: node.title,
        icon: node.icon,
        parentId: node.parentId ?? parentId, // DTO에서 직접 가져옴
        order: node.order, // DTO에서 직접 가져옴
        isFavorite: node.isFavorite,
        lastModified: node.lastModified,
        depth: node.depth,
      });

      if (node.children && node.children.length > 0) {
        traverse(node.children, node.id);
      }
    });
  }

  traverse(tree);
  return result;
}
