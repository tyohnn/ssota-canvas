'use client';

import React, { useCallback, useMemo } from 'react';
import type {
  TreeDataProps,
  UseTreeDataResult,
  ExplorerTreeItem,
} from '../types';

export function useTreeData<TSourceData>(
  params: TreeDataProps<TSourceData>
): UseTreeDataResult<TSourceData> {
  const {
    sourceData,
    getId,
    getName,
    getParentId,
    getOrder,
    getType,
    disableFolderStructure = false,
  } = params;

  // TSourceData를 ExplorerTreeNodeData로 변환하는 매핑
  const idToItem = useMemo(() => {
    const mapping = new Map<string, TSourceData>();
    for (const it of sourceData) {
      mapping.set(getId(it), it);
    }
    return mapping;
  }, [sourceData, getId]);

  const calculateNewOrder = useCallback(
    (targetIndex: number, siblings: TSourceData[]) => {
      if (siblings.length === 0) return 1000;
      const readOrder = (index: number) => {
        const sibling = siblings[index];
        if (!sibling) return 1000 + index * 1000;
        const ord = getOrder ? getOrder(sibling) : undefined;
        return typeof ord === 'number' && !Number.isNaN(ord)
          ? ord
          : 1000 + index * 1000;
      };

      if (targetIndex === 0) {
        return readOrder(0) / 2;
      } else if (targetIndex === siblings.length) {
        return readOrder(siblings.length - 1) + 1000;
      } else {
        const prevOrder = readOrder(targetIndex - 1);
        const nextOrder = readOrder(targetIndex);
        return prevOrder + (nextOrder - prevOrder) / 2;
      }
    },
    [getOrder]
  );

  // TSourceData를 ExplorerTreeNodeData로 변환하여 트리 구조 생성
  const treeData = useMemo(() => {
    const nodeMap: Record<string, ExplorerTreeItem> = {};
    const childrenByParent = new Map<string | null, string[]>();

    // 1단계: TSourceData를 ExplorerTreeItem으로 변환
    const rootItems: string[] = [];

    for (const item of sourceData) {
      const id = getId(item);
      const parentId = disableFolderStructure ? null : getParentId(item);

      nodeMap[id] = {
        id,
        name: getName(item),
        itemType: getType ? getType(item) : undefined,
        isFolder: disableFolderStructure ? false : parentId === null,
      };

      if (disableFolderStructure || parentId === null) {
        rootItems.push(id);
      } else {
        if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
        childrenByParent.get(parentId)!.push(id);
      }
    }

    const getChildrenOf = (parentId: string | null) =>
      childrenByParent.get(parentId) ?? [];

    // 2단계: 자식 정렬
    const sortChildren = (childIds: string[]) => {
      return [...childIds].sort((a, b) => {
        const itemA = nodeMap[a];
        const itemB = nodeMap[b];

        if (!itemA || !itemB) return 0;

        // Folders first
        if (itemA.isFolder && !itemB.isFolder) return -1;
        if (!itemA.isFolder && itemB.isFolder) return 1;

        // Then by order value
        const aItem = idToItem.get(a);
        const bItem = idToItem.get(b);
        const aOrder = aItem && getOrder ? (getOrder(aItem) ?? 0) : 0;
        const bOrder = bItem && getOrder ? (getOrder(bItem) ?? 0) : 0;

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        // Fallback to alphabetical by name
        return itemA.name.localeCompare(itemB.name);
      });
    };

    // 3단계: ExplorerTreeItem에 children 설정
    for (const id of Object.keys(nodeMap)) {
      const node = nodeMap[id];
      if (!node) continue;

      const rawChildren = getChildrenOf(id);
      if (rawChildren.length > 0) {
        node.children = sortChildren(rawChildren);
      } else {
        node.children = [];
      }
    }

    // 4단계: 루트 노드 생성
    const sortedRootItems = sortChildren(rootItems);
    nodeMap.root = {
      id: 'root',
      name: 'Pages',
      isFolder: true,
      children: sortedRootItems,
    };

    return nodeMap;
  }, [sourceData, getId, getName, getParentId, getOrder, getType, idToItem]);

  const getItem = useCallback(
    (itemId: string) => {
      const item = treeData[itemId];
      return item ?? { id: itemId, name: itemId };
    },
    [treeData]
  );

  const getChildren = useCallback(
    (itemId: string) => treeData[itemId]?.children ?? [],
    [treeData]
  );

  const hasRootChildren = (treeData.root?.children?.length ?? 0) > 0;
  const rootChildrenKey = (treeData.root?.children ?? []).join(',');

  return {
    treeData,
    sourceData,
    idToItem,
    hasRootChildren,
    rootChildrenKey,
    getItem,
    getChildren,
    calculateNewOrder,
  };
}
