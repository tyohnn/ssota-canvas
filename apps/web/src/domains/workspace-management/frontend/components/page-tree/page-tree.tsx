// apps/web/src/domains/workspace-management/frontend/components/page-tree/page-tree.tsx
'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import { useTree, AssistiveTreeDescription } from '@headless-tree/react';
import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from '@headless-tree/core';
import { Tree, TreeDragLine } from '@workspace/ui/components/ui/tree';
import type { PageTreeProps, PageTreeItem } from './types';
import { usePageTreeData } from './use-page-tree-data';
import { PageTreeItemRenderer } from './page-tree-item';
import { useWorkspace } from '../../hooks/use-workspace';

/**
 * Page Tree Component
 *
 * Workspace의 Page 트리를 @headless-tree/core 기반으로 렌더링
 * - WorkspaceContext와 완전 통합
 * - 로컬스토리지 기반 펼치기/접기 상태 동기화
 * - 단일 페이지 선택
 * - 드래그앤드롭 조건부 활성화 (Scenario 4 대비)
 */
// 상수 정의
const ROOT_DEPTH = -1;
const DEFAULT_DEPTH = 0;

export function PageTree({
  workspaceId,
  pages,
  selectedPageId,
  expandedPageIds,
  onSelectPage,
  onTogglePage,
  enableDragDrop = false,
  indent = 20,
}: PageTreeProps) {
  const { movePage, reorderPages } = useWorkspace();

  // 페이지 데이터 변환
  const { treeData, getItem, getChildren } = usePageTreeData(
    pages,
    workspaceId
  );

  // Root 페이지 IDs (parentId가 null인 페이지들)
  const rootPageIds = useMemo(() => {
    return Object.values(treeData)
      .filter(page => page.parentId === null)
      .sort((a, b) => a.order - b.order)
      .map(page => page.id);
  }, [treeData]);

  // 드래그앤드롭 핸들러 - 부모 변경 및 순서 재정렬
  const handleDrop = useCallback(
    (parentItem: any, newChildrenIds: Iterable<string>) => {
      const parentId = parentItem.getId();
      const newParentId = parentId === workspaceId ? undefined : parentId;

      // 중복 제거
      const uniqueChildren = [...new Set(Array.from(newChildrenIds))];

      // 변경 사항 분석
      const currentChildren = treeData[parentId]?.children || [];
      const addedIds = uniqueChildren.filter(
        id => !currentChildren.includes(id)
      );
      const removedIds = currentChildren.filter(
        id => !uniqueChildren.includes(id)
      );

      console.log('[handleDrop] Debug:', {
        parentId,
        newParentId,
        uniqueChildren,
        currentChildren,
        addedIds,
        removedIds,
        isOrderChanged:
          JSON.stringify(uniqueChildren) !== JSON.stringify(currentChildren),
      });

      // 케이스 1: 부모 변경 (다른 부모로 이동)
      if (addedIds.length > 0) {
        console.log('[handleDrop] 케이스 1: 부모 변경');
        addedIds
          .filter(id => id !== workspaceId)
          .forEach(id => {
            // 드롭된 위치의 인덱스 찾기
            const insertIndex = uniqueChildren.indexOf(id);
            movePage(id, newParentId, insertIndex);
          });

        // 모든 자식들의 order를 순서대로 업데이트
        reorderPages(workspaceId, newParentId, uniqueChildren);
        return uniqueChildren;
      }

      // 케이스 2: 같은 부모 내 드롭 진행 중
      // removedIds가 있으면 드래그 중인 아이템이 일시 제거된 상태
      // currentChildren을 반환하여 상태 유지
      if (addedIds.length === 0 && removedIds.length > 0) {
        console.log('[handleDrop] 케이스 2: 드롭 진행 중 (일시 제거), 대기');
        return currentChildren;
      }

      // 순서가 변경되었는지 확인
      const isOrderChanged =
        JSON.stringify(uniqueChildren) !== JSON.stringify(currentChildren);

      // 케이스 3: 순서 변경 완료 (같은 부모 내에서 재정렬)
      // addedIds와 removedIds가 모두 없고 순서가 변경되었으면 최종 확정
      if (addedIds.length === 0 && removedIds.length === 0 && isOrderChanged) {
        console.log('[handleDrop] 케이스 3: 순서 변경 완료');
        reorderPages(workspaceId, newParentId, uniqueChildren);
        return uniqueChildren;
      }

      // 케이스 4: 변경 없음
      console.log('[handleDrop] 케이스 4: 변경 없음');
      return currentChildren;
    },
    [workspaceId, treeData, movePage, reorderPages]
  );

  // 기본 클릭 동작 비활성화 (각 버튼에서 직접 처리)
  const disableDefaultClick = useMemo(
    () => ({
      onClick: (item: any, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      },
    }),
    []
  );

  // @headless-tree/core 설정
  // pages가 변경될 때마다 재생성하되, 현재 펼쳐진 상태를 유지
  const tree = useTree<PageTreeItem>({
    initialState: {
      expandedItems: expandedPageIds,
      selectedItems: selectedPageId ? [selectedPageId] : [],
    },
    indent,
    rootItemId: workspaceId, // Workspace ID를 root로 사용
    getItemName: item => item.getItemData()?.title ?? 'Unknown',
    isItemFolder: item => {
      // 모든 페이지를 폴더처럼 동작하도록 (자식이 없어도 펼치기/접기 가능)
      return true;
    },
    canReorder: enableDragDrop,
    canDrop: enableDragDrop
      ? (dragItems, target) => {
          // TODO: 순환 참조 체크 구현
          return true;
        }
      : undefined,
    onDrop: enableDragDrop ? createOnDropHandler(handleDrop) : undefined,
    dataLoader: {
      getItem: (itemId: string): PageTreeItem => {
        // Root일 경우 가상 아이템 반환
        if (itemId === workspaceId) {
          return {
            id: workspaceId,
            pageId: workspaceId,
            workspaceId,
            title: 'Root',
            children: rootPageIds,
            parentId: null,
            order: 0,
            isFavorite: false,
            lastModified: new Date().toISOString(),
            depth: ROOT_DEPTH,
          };
        }
        const item = getItem(itemId);
        // null일 경우 빈 아이템 반환 (타입 안정성)
        if (!item) {
          return {
            id: itemId,
            pageId: itemId,
            workspaceId,
            title: 'Unknown',
            children: [],
            parentId: null,
            order: 0,
            isFavorite: false,
            lastModified: new Date().toISOString(),
            depth: DEFAULT_DEPTH,
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
      disableDefaultClick as any,
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

  // 펼침 상태 동기화 (Context → Tree) - 부모 페이지 자동 펼침 지원
  useEffect(() => {
    const treeItems = tree.getItems();
    expandedPageIds.forEach(pageId => {
      const item = treeItems.find(i => i.getId() === pageId);
      if (item && !item.isExpanded()) {
        item.expand();
      }
    });
  }, [expandedPageIds, tree]);

  // pages 데이터 변경 시 Tree 리빌드 (Optimistic Update 반영)
  useEffect(() => {
    tree.rebuildTree();
  }, [pages, tree]);

  // 빈 페이지 트리 처리
  if (rootPageIds.length === 0) {
    return null;
  }

  // @headless-tree/core가 제공하는 모든 아이템 가져오기
  const treeItems = tree.getItems();

  return (
    <Tree tree={tree} className="text-xs pl-2 relative" indent={indent}>
      <AssistiveTreeDescription tree={tree} />
      <TreeDragLine />
      {treeItems.map(item => (
        <PageTreeItemRenderer
          key={item.getId()}
          item={item}
          onToggle={onTogglePage}
          selectedPageId={selectedPageId}
        />
      ))}
    </Tree>
  );
}
