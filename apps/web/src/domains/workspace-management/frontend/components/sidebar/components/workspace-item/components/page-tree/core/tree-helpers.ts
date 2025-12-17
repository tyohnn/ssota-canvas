import type { PageTreeNodeDTO } from '@/domains/workspace-management/shared/dtos';

/**
 * PageTree에서 특정 페이지를 찾아서 제거
 *
 * @returns 제거된 트리와 제거된 페이지
 */
export function findAndRemovePageFromTree(
  tree: PageTreeNodeDTO[],
  pageId: string
): { tree: PageTreeNodeDTO[]; page: PageTreeNodeDTO | null } {
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i] as PageTreeNodeDTO;

    if (node.id === pageId) {
      // 찾았음 - 제거하고 반환
      return {
        tree: [...tree.slice(0, i), ...tree.slice(i + 1)],
        page: node,
      };
    }

    // 자식에서 재귀 탐색
    if (node.children.length > 0) {
      const result = findAndRemovePageFromTree(node.children, pageId);
      if (result.page) {
        return {
          tree: [
            ...tree.slice(0, i),
            { ...node, children: result.tree },
            ...tree.slice(i + 1),
          ],
          page: result.page,
        };
      }
    }
  }

  return { tree, page: null };
}

/**
 * PageTree의 특정 부모에 페이지 추가
 *
 * @param tree - 페이지 트리
 * @param page - 추가할 페이지
 * @param parentId - 부모 페이지 ID (undefined면 루트)
 * @param insertIndex - 삽입 위치 (undefined면 맨 끝)
 */
export function addPageToTree(
  tree: PageTreeNodeDTO[],
  page: PageTreeNodeDTO,
  parentId: string | undefined,
  insertIndex?: number
): PageTreeNodeDTO[] {
  // 루트로 추가
  if (parentId === undefined) {
    const pageWithParent = { ...page, parentId: null };

    // 인덱스 지정 시 해당 위치에 삽입
    if (insertIndex !== undefined && insertIndex >= 0) {
      const newTree = [...tree];
      newTree.splice(insertIndex, 0, pageWithParent);
      return newTree;
    }

    // 인덱스 없으면 맨 끝에 추가
    return [...tree, pageWithParent];
  }

  // 특정 부모에 추가
  return tree.map(node => {
    if (node.id === parentId) {
      const pageWithParent = { ...page, parentId };

      // 인덱스 지정 시 해당 위치에 삽입
      if (insertIndex !== undefined && insertIndex >= 0) {
        const newChildren = [...node.children];
        newChildren.splice(insertIndex, 0, pageWithParent);
        return {
          ...node,
          children: newChildren,
        };
      }

      // 인덱스 없으면 맨 끝에 추가
      return {
        ...node,
        children: [...node.children, pageWithParent],
      };
    }

    if (node.children.length > 0) {
      return {
        ...node,
        children: addPageToTree(node.children, page, parentId, insertIndex),
      };
    }

    return node;
  });
}

/**
 * PageTree에서 특정 ID의 페이지를 제거 (임시 페이지 제거용)
 */
export function removePageFromTree(
  tree: PageTreeNodeDTO[],
  pageId: string
): PageTreeNodeDTO[] {
  return tree
    .filter(node => node.id !== pageId)
    .map(node => ({
      ...node,
      children: removePageFromTree(node.children, pageId),
    }));
}

/**
 * PageTree에서 임시 ID를 실제 ID로 교체
 */
export function replacePageIdInTree(
  tree: PageTreeNodeDTO[],
  tempId: string,
  realId: string
): PageTreeNodeDTO[] {
  return tree.map(node => {
    if (node.id === tempId) {
      return { ...node, id: realId };
    }
    if (node.children.length > 0) {
      return {
        ...node,
        children: replacePageIdInTree(node.children, tempId, realId),
      };
    }
    return node;
  });
}

/**
 * PageTree에서 특정 페이지 찾기 (헬퍼 함수)
 */
export function findPageInTreeHelper(
  tree: PageTreeNodeDTO[],
  pageId: string
): PageTreeNodeDTO | null {
  for (const node of tree) {
    if (node.id === pageId) return node;
    if (node.children && node.children.length > 0) {
      const found = findPageInTreeHelper(node.children, pageId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * PageTree에서 특정 페이지의 형제 페이지들 찾기
 */
export function findSiblingsInTree(
  tree: PageTreeNodeDTO[],
  pageId: string
): PageTreeNodeDTO[] {
  // 먼저 페이지를 찾아서 parentId 확인
  const page = findPageInTreeHelper(tree, pageId);
  if (!page) return [];

  // 같은 parentId를 가진 모든 페이지 찾기
  const siblings: PageTreeNodeDTO[] = [];

  function collectSiblings(
    nodes: PageTreeNodeDTO[],
    targetParentId: string | null
  ) {
    for (const node of nodes) {
      if (node.parentId === targetParentId && node.id !== pageId) {
        siblings.push(node);
      }
      if (node.children.length > 0) {
        collectSiblings(node.children, targetParentId);
      }
    }
  }

  collectSiblings(tree, page.parentId);
  return siblings;
}

/**
 * PageTree에서 특정 parentId를 가진 페이지들의 order 업데이트
 * (Fractional indexing 사용 - order는 이미 계산되어 전달됨)
 */
export function updatePageOrderInTree(
  tree: PageTreeNodeDTO[],
  parentId: string | undefined,
  orderedPageIds: string[],
  newOrders: Map<string, string>
): PageTreeNodeDTO[] {
  return tree.map(node => {
    // 해당 parentId의 children인 경우 order 업데이트
    if (node.parentId === parentId) {
      const newOrder = newOrders.get(node.id);
      if (newOrder !== undefined) {
        return {
          ...node,
          order: newOrder,
          children: updatePageOrderInTree(
            node.children,
            parentId,
            orderedPageIds,
            newOrders
          ),
        };
      }
    }
    // 재귀적으로 하위 노드도 처리
    return {
      ...node,
      children: updatePageOrderInTree(
        node.children,
        parentId,
        orderedPageIds,
        newOrders
      ),
    };
  });
}

/**
 * PageTree에서 특정 부모의 children 중 마지막 order 값 찾기
 * (Fractional indexing 사용 - 문자열 order)
 *
 * @param tree - 페이지 트리
 * @param parentId - 부모 페이지 ID (undefined면 루트 레벨)
 * @returns 해당 부모의 children 중 가장 큰 order 값, 없으면 null
 */
export function findLastOrderInTree(
  tree: PageTreeNodeDTO[],
  parentId: string | undefined
): string | null {
  // Case 1: 루트 레벨 (parentId === undefined)
  if (parentId === undefined) {
    let lastOrder: string | null = null;
    for (const node of tree) {
      if (node.parentId === null || node.parentId === undefined) {
        const nodeOrder = String(node.order);
        // ASCII 기준 비교
        if (!lastOrder || nodeOrder > lastOrder) {
          lastOrder = nodeOrder;
        }
      }
    }
    return lastOrder;
  }

  // Case 2: 특정 부모의 children에서 찾기
  const parent = findPageInTreeHelper(tree, parentId);
  if (!parent || parent.children.length === 0) {
    return null;
  }

  let lastOrder: string | null = null;
  for (const child of parent.children) {
    const childOrder = String(child.order);
    // ASCII 기준 비교
    if (!lastOrder || childOrder > lastOrder) {
      lastOrder = childOrder;
    }
  }
  return lastOrder;
}

/**
 * PageTree에서 특정 페이지의 정보(title, icon) 업데이트
 */
export function updatePageInfoInTree(
  tree: PageTreeNodeDTO[],
  pageId: string,
  updates: { title?: string; icon?: string }
): PageTreeNodeDTO[] {
  return tree.map(node => {
    if (node.id === pageId) {
      return {
        ...node,
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.icon !== undefined && { icon: updates.icon }),
        lastModified: new Date().toISOString(),
      };
    }
    if (node.children.length > 0) {
      return {
        ...node,
        children: updatePageInfoInTree(node.children, pageId, updates),
      };
    }
    return node;
  });
}

/**
 * PageTree에서 특정 페이지의 모든 부모 페이지 ID 찾기 (재귀)
 */
export function findPageAncestors(
  tree: PageTreeNodeDTO[],
  pageId: string,
  ancestors: string[] = []
): string[] | null {
  for (const node of tree) {
    if (node.id === pageId) {
      // 페이지를 찾았으면 ancestors 반환
      return ancestors;
    }
    if (node.children && node.children.length > 0) {
      // 현재 노드를 ancestors에 추가하고 재귀 탐색
      const found = findPageAncestors(node.children, pageId, [
        ...ancestors,
        node.id,
      ]);
      if (found !== null) return found;
    }
  }
  return null;
}
