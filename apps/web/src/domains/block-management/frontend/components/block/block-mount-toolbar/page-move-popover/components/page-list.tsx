'use client';

import React from 'react';
import { ScrollArea } from '@workspace/ui/components/ui/scroll-area';
import { usePageMovePopoverContext } from '../core/context';
import { PageListItem } from './page-list-item';
import { Box } from '@workspace/ui/components/ui/box';

export function PageList() {
  const { filteredPages, isSearching, searchQuery } =
    usePageMovePopoverContext();

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
            <PageListItem key={page.pageId} page={page} />
          ))
        )}
      </Box>
    </ScrollArea>
  );
}
