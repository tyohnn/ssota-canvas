'use client';

import React from 'react';

import { Box } from '@workspace/ui/components/ui/box';
import { ScrollArea } from '@workspace/ui/components/ui/scroll-area';

import type { RecentPageDTO } from '@/domains/workspace-management/shared/dtos';

import { PageListItem } from './page-list-item';

export interface PageListProps {
  filteredPages: RecentPageDTO[];
  isSearching: boolean;
  searchQuery: string;
  currentPageId: string;
  canMoveTo: (pageId: string) => boolean;
  handleSelectPage: (pageId: string) => Promise<void>;
}

export function PageList({
  filteredPages,
  isSearching,
  searchQuery,
  currentPageId,
  canMoveTo,
  handleSelectPage,
}: PageListProps) {
  return (
    <ScrollArea className="h-[200px]">
      <Box className="space-y-1">
        {isSearching ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Searching...
          </p>
        ) : filteredPages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {searchQuery ? 'No results found' : 'No pages found'}
          </p>
        ) : (
          filteredPages.map(page => (
            <PageListItem
              key={page.pageId}
              page={page}
              currentPageId={currentPageId}
              canMoveTo={canMoveTo}
              handleSelectPage={handleSelectPage}
            />
          ))
        )}
      </Box>
    </ScrollArea>
  );
}
