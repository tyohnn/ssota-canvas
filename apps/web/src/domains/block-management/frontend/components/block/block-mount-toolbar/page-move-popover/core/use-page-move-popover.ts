'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { usePageMovePopoverUI } from './use-page-move-popover.ui';
import {
  usePageMoveBusiness,
  type PageMoveBusinessLogic,
} from './use-page-move-popover.business';
import type { RecentPageDTO } from '@/domains/workspace-management/shared/dtos';

export function usePageMovePopover(
  blockMountId: string,
  currentPageId: string,
  workspaceId: string,
  orgId: string,
  businessLogic?: PageMoveBusinessLogic // Optional injection
) {
  // Business Logic
  const defaultBusiness = usePageMoveBusiness(
    blockMountId,
    currentPageId,
    workspaceId,
    orgId
  );
  const business = businessLogic ?? defaultBusiness;

  // Fetch pages on mount
  const [recentPages, setRecentPages] = useState<RecentPageDTO[]>([]);
  const [searchResults, setSearchResults] = useState<RecentPageDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 검색어에 따라 표시할 페이지 결정
  const displayPages = useMemo(() => {
    return searchQuery.trim() ? searchResults : recentPages;
  }, [searchQuery, searchResults, recentPages]);

  // UI State
  const uiState = usePageMovePopoverUI(displayPages, currentPageId);

  // 초기 로드: 최근 페이지
  useEffect(() => {
    if (!uiState.open) {
      return;
    }

    business.fetchPages().then(setRecentPages);
  }, [uiState.open, business.fetchPages]);

  // 검색어 동기화
  useEffect(() => {
    setSearchQuery(uiState.searchQuery);
  }, [uiState.searchQuery]);

  // 검색어 변경 시 디바운싱
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const query = searchQuery.trim();

    if (!query) {
      // 검색어 없으면 검색 결과 초기화
      setSearchResults([]);
      uiState.setIsSearching(false);
      return;
    }

    uiState.setIsSearching(true);

    searchTimeoutRef.current = setTimeout(() => {
      business
        .searchPages(query)
        .then(results => {
          setSearchResults(results);
          uiState.setIsSearching(false);
        })
        .catch(() => {
          uiState.setIsSearching(false);
        });
    }, 300); // 300ms 디바운싱

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, business.searchPages, uiState.setIsSearching]);

  // Combined Logic
  const handleSelectPage = useCallback(
    async (pageId: string) => {
      if (!business.canMoveTo(pageId)) {
        return;
      }

      // UI: Close immediately
      uiState.setOpen(false);

      try {
        // Business: Move block
        await business.moveBlock(pageId);
      } catch (error) {
        // UI: Reopen on error
        uiState.setOpen(true);
      }
    },
    [uiState, business]
  );

  return {
    ...uiState,
    handleSelectPage,
    canMoveTo: business.canMoveTo,
  };
}
