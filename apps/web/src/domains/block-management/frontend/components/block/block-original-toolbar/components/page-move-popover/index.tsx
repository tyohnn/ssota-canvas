'use client';

import React from 'react';

import { Popover } from '@workspace/ui/components/ui/popover';

import { Content } from './components/content';
import { Trigger } from './components/trigger';
import type { PageMovePopoverProps } from './core/types';
import { usePageMovePopover } from './core/use-page-move-popover';

export function PageMovePopover({ blockMountId }: PageMovePopoverProps) {
  const popoverState = usePageMovePopover(blockMountId);

  return (
    <Popover
      open={popoverState.open}
      onOpenChange={popoverState.handleOpenChange}
    >
      <Trigger />
      <Content
        currentPageId={popoverState.pageId}
        handleOpenChange={popoverState.handleOpenChange}
        searchQuery={popoverState.searchQuery}
        setSearchQuery={popoverState.setSearchQuery}
        filteredPages={popoverState.filteredPages}
        isSearching={popoverState.isSearching}
        canMoveTo={popoverState.canMoveTo}
        handleSelectPage={popoverState.handleSelectPage}
      />
    </Popover>
  );
}
