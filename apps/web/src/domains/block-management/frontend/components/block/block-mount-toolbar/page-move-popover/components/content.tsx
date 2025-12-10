'use client';

import React from 'react';
import { PopoverContent } from '@workspace/ui/components/ui/popover';
import { usePageMovePopoverContext } from '../core/context';
import { PageSearchInput } from './page-search-input';
import { PageList } from './page-list';
import { Box } from '@workspace/ui/components/ui/box';

export function Content() {
  const { handleOpenChange } = usePageMovePopoverContext();

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
        <PageSearchInput />
        <PageList />
      </Box>
    </PopoverContent>
  );
}
