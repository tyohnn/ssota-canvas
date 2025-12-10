'use client';

import React, { createContext, useContext } from 'react';
import { usePageMovePopover } from './use-page-move-popover';
import type { PageMovePopoverProps } from './types';
import type { RecentPageDTO } from '@/domains/workspace-management/shared/dtos';

interface PageMovePopoverContextValue {
  blockMountId: string;
  currentPageId: string;
  workspaceId: string;
  orgId: string;
  open: boolean;
  searchQuery: string;
  selectedPageId: string | null;
  isSearching: boolean;
  filteredPages: RecentPageDTO[];
  setOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedPageId: (pageId: string | null) => void;
  setIsSearching: (isSearching: boolean) => void;
  handleOpenChange: (open: boolean) => void;
  handleSelectPage: (pageId: string) => Promise<void>;
  canMoveTo: (pageId: string) => boolean;
}

const PageMovePopoverContext =
  createContext<PageMovePopoverContextValue | null>(null);

export function usePageMovePopoverContext(): PageMovePopoverContextValue {
  const context = useContext(PageMovePopoverContext);
  if (!context) {
    throw new Error(
      'usePageMovePopoverContext must be used within PageMovePopoverProvider'
    );
  }
  return context;
}

interface PageMovePopoverProviderProps extends PageMovePopoverProps {
  orgId: string;
  children: React.ReactNode;
}

export function PageMovePopoverProvider({
  blockMountId,
  currentPageId,
  workspaceId,
  orgId,
  children,
}: PageMovePopoverProviderProps) {
  const state = usePageMovePopover(
    blockMountId,
    currentPageId,
    workspaceId,
    orgId
  );

  const contextValue: PageMovePopoverContextValue = {
    blockMountId,
    currentPageId,
    workspaceId,
    orgId,
    ...state,
  };

  return (
    <PageMovePopoverContext.Provider value={contextValue}>
      {children}
    </PageMovePopoverContext.Provider>
  );
}
