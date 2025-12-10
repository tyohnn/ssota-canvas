'use client';

import React from 'react';
import { Popover } from '@workspace/ui/components/ui/popover';
import {
  PageMovePopoverProvider as ContextProvider,
  usePageMovePopoverContext,
} from './context';
import type { PageMovePopoverProps } from './types';

interface PageMovePopoverProviderProps extends PageMovePopoverProps {
  orgId: string;
  children: React.ReactNode;
}

function PopoverWrapper({ children }: { children: React.ReactNode }) {
  const { open, handleOpenChange } = usePageMovePopoverContext();

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      {children}
    </Popover>
  );
}

export function PageMovePopoverProvider({
  blockMountId,
  currentPageId,
  workspaceId,
  orgId,
  children,
}: PageMovePopoverProviderProps) {
  return (
    <ContextProvider
      blockMountId={blockMountId}
      currentPageId={currentPageId}
      workspaceId={workspaceId}
      orgId={orgId}
    >
      <PopoverWrapper>{children}</PopoverWrapper>
    </ContextProvider>
  );
}
