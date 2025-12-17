'use client';

import { useMemo } from 'react';
import { useTree } from '@headless-tree/react';
import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from '@headless-tree/core';
import type { PageTreeNodeDTO } from '@/domains/workspace-management/shared/dtos';
import type { PageTreeItem } from './types';
import { usePageTreeSync } from './use-page-tree-sync';
import type { usePageTreeData } from './use-page-tree-data';

/**
 * useHeadlessTree
 *
 * @headless-tree/core 통합 훅 (Refactored)
 * - 상태 동기화: usePageTreeSync
 * - 트리 설정: useTree
 * - 데이터는 props로 주입받음 (Pure Component 성격)
 */
export function useHeadlessTree({
  workspaceId,
  pages,
  selectedPageId,
  expandedPageIds,
  enableDragDrop = false,
  indent = 20,
  onDrop,
  // Data props (from usePageTreeData)
  dataLoader,
}: {
  workspaceId: string;
  pages: PageTreeNodeDTO[];
  selectedPageId: string | null;
  expandedPageIds: Set<string>;
  enableDragDrop?: boolean;
  indent?: number;
  onDrop?: (
    parentItem: any,
    newChildrenIds: Iterable<string>
  ) => Promise<string[]>;
  dataLoader: ReturnType<typeof usePageTreeData>['createTreeDataLoader'];
}) {
  // 1. 기본 클릭 동작 비활성화 (Memoized)
  const disableDefaultClick = useMemo(
    () => ({
      onClick: (item: any, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      },
    }),
    []
  );

  // 2. Tree 인스턴스 생성
  const tree = useTree<PageTreeItem>({
    initialState: {
      expandedItems: Array.from(expandedPageIds),
      selectedItems: selectedPageId ? [selectedPageId] : [],
    },
    indent,
    rootItemId: workspaceId,
    getItemName: item => item.getItemData()?.title ?? 'Unknown',
    isItemFolder: () => true, // 모든 페이지를 폴더처럼 동작
    canReorder: enableDragDrop,
    canDrop: enableDragDrop
      ? () => true // TODO: 순환 참조 체크 구현
      : undefined,
    onDrop: enableDragDrop && onDrop ? createOnDropHandler(onDrop) : undefined,
    dataLoader: dataLoader,
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      ...(enableDragDrop
        ? [dragAndDropFeature, keyboardDragAndDropFeature]
        : []),
      disableDefaultClick as any,
    ],
  });

  // 3. 상태 동기화 (Effect)
  usePageTreeSync(tree, pages, workspaceId, selectedPageId, expandedPageIds);

  return {
    tree,
  };
}
