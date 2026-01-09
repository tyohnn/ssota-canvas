'use client';

import { useState, useCallback, useMemo } from 'react';
import type { RecentPageDTO } from '@/domains/workspace-management/shared/dtos';

export interface PageMovePopoverUIState {
  // UI 상태
  open: boolean;
  searchQuery: string;
  selectedPageId: string | null;
  isSearching: boolean;

  // UI 액션
  setOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedPageId: (pageId: string | null) => void;
  setIsSearching: (isSearching: boolean) => void;
  handleOpenChange: (open: boolean) => void;

  // Computed
  filteredPages: RecentPageDTO[];
}

export function usePageMovePopoverUI(
  pages: RecentPageDTO[],
  currentPageId: string
): PageMovePopoverUIState {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSearchQuery('');
      setSelectedPageId(null);
    }
  }, []);

  const filteredPages = useMemo(() => {
    if (!searchQuery) return pages;

    const query = searchQuery.toLowerCase();
    return pages.filter(
      page =>
        page.title.toLowerCase().includes(query) ||
        page.workspaceName.toLowerCase().includes(query)
    );
  }, [pages, searchQuery]);

  return {
    open,
    searchQuery,
    selectedPageId,
    isSearching,
    setOpen,
    setSearchQuery,
    setSelectedPageId,
    setIsSearching,
    handleOpenChange,
    filteredPages,
  };
}
