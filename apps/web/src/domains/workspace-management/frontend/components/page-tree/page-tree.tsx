// apps/web/src/domains/workspace-management/frontend/components/page-tree/page-tree.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import { useTree } from '@headless-tree/react';
import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from '@headless-tree/core';
import { Tree } from '@workspace/ui/components/ui/tree';
import type { PageTreeProps, PageTreeItem } from './types';
import { usePageTreeData } from './use-page-tree-data';
import { PageTreeItemRenderer } from './page-tree-item';

/**
 * Page Tree Component
 *
 * Workspace의 Page 트리를 @headless-tree/core 기반으로 렌더링
 * - WorkspaceContext와 완전 통합
 * - 로컬스토리지 기반 펼치기/접기 상태 동기화
 * - 단일 페이지 선택
 * - 드래그앤드롭 조건부 활성화 (Scenario 4 대비)
 */
export function PageTree({
  workspaceId,
  pages,
  selectedPageId,
  expandedPageIds,
  onSelectPage,
  onTogglePage,
  enableDragDrop = false,
  indent = 16,
}: PageTreeProps) {
  // 페이지 데이터 변환
  const { treeData, getItem, getChildren } = usePageTreeData(pages);

  // Root 페이지 IDs (parentId가 null인 페이지들)
  const rootPageIds = useMemo(() => {
    return Object.values(treeData)
      .filter(page => page.parentId === null)
      .sort((a, b) => a.order - b.order)
      .map(page => page.id);
  }, [treeData]);

  // Custom click behavior (페이지 선택 시 Context 업데이트)
  const customClickBehavior = useMemo(
    () => ({
      onClick: (item: any, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const pageId = item.getId();
        onSelectPage(pageId);
      },
    }),
    [onSelectPage]
  );

  // @headless-tree/core 설정
  const tree = useTree<PageTreeItem>({
    initialState: {
      expandedItems: expandedPageIds,
      selectedItems: selectedPageId ? [selectedPageId] : [],
    },
    indent,
    rootItemId: workspaceId, // Workspace ID를 root로 사용
    getItemName: item => item.getItemData()?.title ?? 'Unknown',
    isItemFolder: item => {
      const data = item.getItemData();
      return (data?.children?.length ?? 0) > 0; // 자식이 있으면 폴더
    },
    canReorder: enableDragDrop,
    canDrop: enableDragDrop
      ? (dragItems, target) => {
          // Scenario 4에서 구현: 순환 참조 체크 등
          return true;
        }
      : undefined,
    onDrop: enableDragDrop
      ? createOnDropHandler((parentItem, newChildrenIds) => {
          // Scenario 4에서 구현: Server Action 호출하여 순서 변경
          console.log('[PageTree] onDrop:', {
            parentId: parentItem.getId(),
            newChildrenIds,
          });
        })
      : undefined,
    dataLoader: {
      getItem: (itemId: string): PageTreeItem => {
        // Root일 경우 가상 아이템 반환
        if (itemId === workspaceId) {
          return {
            id: workspaceId,
            title: 'Root',
            children: rootPageIds,
            parentId: null,
            order: 0,
            isFavorite: false,
            lastModified: new Date().toISOString(),
            depth: -1,
          };
        }
        const item = getItem(itemId);
        // null일 경우 빈 아이템 반환 (타입 안정성)
        if (!item) {
          return {
            id: itemId,
            title: 'Unknown',
            children: [],
            parentId: null,
            order: 0,
            isFavorite: false,
            lastModified: new Date().toISOString(),
            depth: 0,
          };
        }
        return item;
      },
      getChildren: (itemId: string) => {
        // Root일 경우 최상위 페이지들 반환
        if (itemId === workspaceId) {
          return rootPageIds;
        }
        return getChildren(itemId);
      },
    },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      ...(enableDragDrop
        ? [dragAndDropFeature, keyboardDragAndDropFeature]
        : []),
      customClickBehavior as any,
    ],
  });

  // 선택 상태 동기화 (Context → Tree)
  useEffect(() => {
    if (selectedPageId) {
      tree.setSelectedItems([selectedPageId]);
    } else {
      tree.setSelectedItems([]);
    }
  }, [selectedPageId, tree]);

  // 펼치기/접기 상태는 initialState에서만 설정
  // @headless-tree/core가 내부적으로 관리
  // onTogglePage를 통해 Context는 업데이트됨 (Tree → Context)

  // 빈 페이지 트리 처리
  if (rootPageIds.length === 0) {
    return null;
  }

  // @headless-tree/core가 제공하는 모든 아이템 가져오기
  const treeItems = tree.getItems();

  return (
    <Tree tree={tree} className="text-xs" indent={indent}>
      {treeItems.map(item => (
        <PageTreeItemRenderer
          key={item.getId()}
          item={item}
          onToggle={onTogglePage}
        />
      ))}
    </Tree>
  );
}
