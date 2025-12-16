import { useState, useCallback, useEffect, useRef } from 'react';
import type { PageTreeNodeDTO } from '@/domains/workspace-management/shared/dtos';
import {
  flattenPageTree,
  getCookieValue,
  getPageCollapsedKey,
  getRecentPageKey,
} from './utils';
import { findPageInTreeHelper, findPageAncestors } from './tree-helpers';

/**
 * PageTree UI State
 *
 * 로컬 상태만 관리 (전역 상태 독립)
 * - selectedPageId: 선택된 페이지
 * - expandedPageIds: 펼쳐진 페이지들
 */
export interface PageTreeUIState {
  // 선택/펼침 상태
  selectedPageId: string | null;
  expandedPageIds: Set<string>;

  // UI 액션
  setSelectedPageId: (pageId: string | null) => void;
  togglePage: (pageId: string) => void;
  expandPage: (pageId: string) => void;
  collapsePage: (pageId: string) => void;
}

// Helper: 상태 업데이트 및 로컬 스토리지 저장 로직 통합
const updateExpansionState = (
  prev: Set<string>,
  pageId: string,
  shouldExpand: boolean
) => {
  const newSet = new Set(prev);
  if (shouldExpand) {
    newSet.add(pageId);
    if (typeof window !== 'undefined') {
      const key = getPageCollapsedKey(pageId);
      localStorage.setItem(key, 'false');
    }
  } else {
    newSet.delete(pageId);
    if (typeof window !== 'undefined') {
      const key = getPageCollapsedKey(pageId);
      localStorage.setItem(key, 'true');
    }
  }
  return newSet;
};

/**
 * usePageTreeUI
 *
 * PageTree의 로컬 UI 상태 관리
 * - 전역 상태와 독립적으로 동작
 * - localStorage에 펼침 상태 저장
 * - 초기 로드 시 선택된 페이지 복원 및 부모 펼치기
 */
export function usePageTreeUI(
  initialSelectedPageId: string | null | undefined,
  pages: PageTreeNodeDTO[],
  workspaceId: string,
  organizationId: string
): PageTreeUIState {
  const isInitialized = useRef(false);

  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    initialSelectedPageId || null
  );

  // localStorage에서 펼침 상태 복원
  const [expandedPageIds, setExpandedPageIds] = useState<Set<string>>(() => {
    if (typeof window === 'undefined' || !pages || !workspaceId)
      return new Set();

    const expanded = new Set<string>();
    const flatPages = flattenPageTree(pages, workspaceId);

    flatPages.forEach(page => {
      const key = getPageCollapsedKey(page.id);
      const collapsed = localStorage.getItem(key);

      // 'false'이거나 키가 없으면(기본값) 펼친 상태
      if (collapsed !== 'true') {
        expanded.add(page.id);
      }
    });

    return expanded;
  });

  const togglePage = useCallback((pageId: string) => {
    setExpandedPageIds(prev => {
      const isExpanded = prev.has(pageId);
      return updateExpansionState(prev, pageId, !isExpanded);
    });
  }, []);

  const expandPage = useCallback((pageId: string) => {
    setExpandedPageIds(prev => updateExpansionState(prev, pageId, true));
  }, []);

  const collapsePage = useCallback((pageId: string) => {
    setExpandedPageIds(prev => updateExpansionState(prev, pageId, false));
  }, []);

  // initialSelectedPageId가 변경되면 로컬 상태도 업데이트
  // 컴포넌트가 이미 화면에 있는 상태에서 initialSelectedPageId가 바뀔 때(예: 다른 페이지 클릭) 실행됩니다.
  // Next.js의 레이아웃은 페이지 이동 시에도 그대로 유지(리렌더링)되는 경우가 많으므로, 이 코드가 있어야 선택 상태가 최신으로 동기화됩니다.
  useEffect(() => {
    if (initialSelectedPageId !== undefined) {
      setSelectedPageId(initialSelectedPageId);
    }
  }, [initialSelectedPageId]);

  // ========================================
  // 초기화: 선택된 페이지 복원 + 부모 펼치기
  // ========================================
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized.current) return;
    if (!pages || pages.length === 0) return;

    isInitialized.current = true;

    let pageToSelect = initialSelectedPageId;

    if (!pageToSelect) {
      const recentPageKey = getRecentPageKey(organizationId);
      const recentPageId = getCookieValue(recentPageKey);

      if (recentPageId) {
        const pageExists = findPageInTreeHelper(pages, recentPageId);
        if (pageExists) {
          pageToSelect = recentPageId;
        }
      }
    }

    if (!pageToSelect && pages.length > 0) {
      pageToSelect = pages[0]?.id;
    }

    if (pageToSelect) {
      const pageExists = findPageInTreeHelper(pages, pageToSelect);
      if (pageExists) {
        setSelectedPageId(pageToSelect);
      }
    }

    // 부모 페이지들 펼치기
    if (pageToSelect) {
      const ancestors = findPageAncestors(pages, pageToSelect);
      if (ancestors && ancestors.length > 0) {
        ancestors.forEach(ancestorId => {
          expandPage(ancestorId);
        });
      }
    }
  }, [pages, initialSelectedPageId, organizationId, expandPage]);

  return {
    selectedPageId,
    expandedPageIds,
    setSelectedPageId,
    togglePage,
    expandPage,
    collapsePage,
  };
}
