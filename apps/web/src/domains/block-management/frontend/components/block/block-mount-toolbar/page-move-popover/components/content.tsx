'use client';

import React from 'react';

import { Box } from '@workspace/ui/components/ui/box';
import { PopoverContent } from '@workspace/ui/components/ui/popover';

import type { RecentPageDTO } from '@/domains/workspace-management/shared/dtos';

import { PageList } from './page-list';
import { PageSearchInput } from './page-search-input';

export interface ContentProps {
  currentPageId: string;
  handleOpenChange: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredPages: RecentPageDTO[];
  isSearching: boolean;
  canMoveTo: (pageId: string) => boolean;
  handleSelectPage: (pageId: string) => Promise<void>;
}

export function Content({
  currentPageId,
  handleOpenChange,
  searchQuery,
  setSearchQuery,
  filteredPages,
  isSearching,
  canMoveTo,
  handleSelectPage,
}: ContentProps) {
  return (
    <PopoverContent
      align="start"
      side="right"
      className="w-48 p-0"
      onEscapeKeyDown={() => handleOpenChange(false)}
      onInteractOutside={e => {
        // Prevent closing when clicking on dropdown menu
        const target = e.target as HTMLElement;
        if (target.closest('[role="menu"]')) {
          e.preventDefault();
        }
      }}
    >
      <Box className="p-1.5">
        <PageSearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <PageList
          filteredPages={filteredPages}
          isSearching={isSearching}
          searchQuery={searchQuery}
          currentPageId={currentPageId}
          canMoveTo={canMoveTo}
          handleSelectPage={handleSelectPage}
        />
      </Box>
    </PopoverContent>
  );
}
