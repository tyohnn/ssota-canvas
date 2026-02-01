'use client';

import { useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { PageTreeNodeDTO } from '@/domains/workspace-management/shared/dtos';
import { generateTempPageId } from '@/domains/workspace-management/shared/utils/temp-page-id.utils';
import { usePageTreeUI } from './use-page-tree.ui';
import { usePageTreeBusiness } from './use-page-tree.business';
import { useHeadlessTree } from './use-headless-tree';
import { findPageInTreeHelper, findPageAncestors } from './tree-helpers';
import { usePageTreeData } from './use-page-tree-data';
import { usePageTreeDnD } from './use-page-tree-dnd';
import { getRecentPageKey, setCookieValue } from './utils';

/**
 * usePageTree: 통합 Hook (Refactored)
 */
export function usePageTree({
  workspaceId,
  pages,
  organizationId,
  initialSelectedPageId,
  onSelectPage,
  onPagesUpdate,
  enableDragDrop = false,
  indent = 20,
}: {
  workspaceId: string;
  pages: PageTreeNodeDTO[];
  organizationId: string;
  initialSelectedPageId?: string | null;
  onSelectPage?: (pageId: string) => void;
  onPagesUpdate?: (pages: PageTreeNodeDTO[]) => void;
  enableDragDrop?: boolean;
  indent?: number;
}) {
  const router = useRouter();

  // Drag & Drop 시 임시로 숨길 아이템 ID를 관리하는 Ref
  // Optimistic Update와 라이브러리 간의 싱크 문제를 해결하기 위함
  const dragHiddenIds = useRef<Set<string>>(new Set());

  // ========================================
  // 1. UI State (로컬)
  // ========================================
  const uiState = usePageTreeUI(
    initialSelectedPageId,
    pages,
    workspaceId,
    organizationId
  );

  // ========================================
  // 2. Data Logic (데이터 변환)
  // ========================================
  const {
    treeData,
    rootPageIds,
    createTreeDataLoader,
    getPageTreeItemById,
    getChildPageIds,
  } = usePageTreeData(workspaceId, pages, dragHiddenIds);

  // ========================================
  // 3. Business Logic
  // ========================================
  // 생성 후 자동 선택 로직(handleCreatePageSuccess) 제거됨 (요구사항 변경)
  const business = usePageTreeBusiness(workspaceId, pages, onPagesUpdate);

  // ========================================
  // 4. Drag & Drop Logic
  // ========================================
  const { handleDrop } = usePageTreeDnD(
    business,
    workspaceId,
    treeData,
    dragHiddenIds,
    rootPageIds
  );

  // ========================================
  // 5. Headless Tree 통합
  // ========================================
  const { tree } = useHeadlessTree({
    workspaceId,
    pages,
    selectedPageId: uiState.selectedPageId,
    expandedPageIds: uiState.expandedPageIds,
    enableDragDrop,
    indent,
    onDrop: handleDrop,
    dataLoader: createTreeDataLoader,
  });

  // ========================================
  // 6. 계산된 속성
  // ========================================
  const selectedPage = useMemo(() => {
    // 선택된 ID에 해당하는 실제 페이지 객체를 반환합니다 (UI 표시용)
    if (!uiState.selectedPageId) return null;
    return findPageInTreeHelper(pages, uiState.selectedPageId) || null;
  }, [pages, uiState.selectedPageId]);

  const selectedWorkspaceId = useMemo(() => {
    if (!uiState.selectedPageId) return null;
    // 선택된 페이지가 실제 트리에 존재하는지(유효한지) 검증하고,
    // 해당 페이지의 워크스페이스 ID를 반환합니다. (삭제된 페이지 ID가 남아있는 경우 방어)
    const page = findPageInTreeHelper(pages, uiState.selectedPageId);
    return page ? workspaceId : null;
  }, [pages, uiState.selectedPageId, workspaceId]);

  // ========================================
  // 7. Combined Actions (Business + UI)
  // ========================================

  // 페이지 선택 (네비게이션 포함)
  const selectPage = useCallback(
    (pageId: string, workspaceIdParam: string, skipNavigation = false) => {
      const page = findPageInTreeHelper(pages, pageId);
      if (!page) return;

      uiState.setSelectedPageId(pageId);

      // 상위로 선택 알림
      onSelectPage?.(pageId);

      // Cookie에 저장
      if (typeof window !== 'undefined') {
        const key = getRecentPageKey(organizationId);
        setCookieValue(key, pageId);
      }

      // 부모 페이지들 자동 펼치기
      // 사이드바에서 선택했으면 이미 부모 폴더가 펼쳐져 있어야 가능하기에 필요 없는 로직이지만,
      // (검색, 브레드크럼 등 트리 외부에서 진입했을 때 부모 폴더를 펼쳐주기 위함)
      const ancestors = findPageAncestors(pages, pageId);
      if (ancestors && ancestors.length > 0) {
        ancestors.forEach(ancestorId => uiState.expandPage(ancestorId));
      }

      // URL 변경
      if (!skipNavigation && typeof window !== 'undefined') {
        const targetUrl = `/r/${organizationId}/${pageId}`;
        if (window.location.pathname !== targetUrl) {
          router.push(targetUrl);
        }
      }
    },
    [pages, organizationId, router, uiState, onSelectPage]
  );

  // createPage + UI 업데이트
  const createPageWithUIUpdate = useCallback(
    async (
      workspaceId: string,
      parentId?: string,
      title?: string,
      icon?: string
    ) => {
      const tempPageId = await generateTempPageId();

      // 새 페이지가 생성되면 부모 폴더를 펼쳐서 사용자가 바로 확인할 수 있도록 함
      if (parentId) {
        uiState.expandPage(parentId);
      }

      const realPageId = await business.createPage(
        workspaceId,
        parentId,
        title,
        icon,
        tempPageId
      );

      if (!realPageId) {
        return null;
      }

      return realPageId;
    },
    [business, uiState]
  );

  // deletePage + UI 업데이트
  const deletePageWithUIUpdate = useCallback(
    async (pageId: string) => {
      const isDeleted = await business.deletePage(pageId);

      if (!isDeleted) return false;

      if (uiState.selectedPageId === pageId) {
        if (pages.length > 0) {
          const firstPage = pages[0];
          if (firstPage) {
            selectPage(firstPage.id, workspaceId);
          } else {
            uiState.setSelectedPageId(null);
          }
        } else {
          uiState.setSelectedPageId(null);
        }
      }

      return true;
    },
    [business, uiState, pages, selectPage, workspaceId]
  );

  // movePage + UI 업데이트
  const movePageWithUIUpdate = useCallback(
    async (pageId: string, newParentId?: string, insertIndex?: number) => {
      const isMoved = await business.movePage(pageId, newParentId, insertIndex);

      if (!isMoved) return false;

      if (newParentId) {
        uiState.expandPage(newParentId);
      }

      return true;
    },
    [business, uiState]
  );

  // duplicatePage + UI 업데이트
  const duplicatePageWithUIUpdate = useCallback(
    async (pageId: string) => {
      const duplicatedPageId = await business.duplicatePage(pageId);

      if (!duplicatedPageId) return null;

      // 복제된 페이지의 부모를 펼치기
      const originalPage = findPageInTreeHelper(pages, pageId);
      if (originalPage?.parentId) {
        uiState.expandPage(originalPage.parentId);
      }

      return duplicatedPageId;
    },
    [business, uiState, pages]
  );

  // ========================================
  // 8. 반환값
  // ========================================
  return {
    // UI State
    selectedPageId: uiState.selectedPageId,
    expandedPageIds: uiState.expandedPageIds,
    setSelectedPageId: uiState.setSelectedPageId,
    togglePage: uiState.togglePage,
    expandPage: uiState.expandPage,
    collapsePage: uiState.collapsePage,

    // Business Logic
    updatePageInfo: business.updatePageInfo,

    // Headless Tree
    tree,
    treeData,
    rootPageIds,

    // Helper (Data Logic)
    getPageTreeItemById,
    getChildPageIds,

    // Combined Actions
    selectPage,
    createPage: createPageWithUIUpdate,
    deletePage: deletePageWithUIUpdate,
    movePage: movePageWithUIUpdate,
    duplicatePage: duplicatePageWithUIUpdate,

    // Computed
    selectedPage,
    selectedWorkspaceId,

    // 기본 데이터
    workspaceId,
    pages,
    organizationId,
  };
}

export type PageTreeState = ReturnType<typeof usePageTree>;
