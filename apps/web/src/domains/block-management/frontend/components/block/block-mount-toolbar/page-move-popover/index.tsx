'use client';

import React from 'react';
import { PageMovePopoverProvider } from './core/provider';
import { Trigger } from './components/trigger';
import { Content } from './components/content';
import type { PageMovePopoverProps } from './core/types';

export function PageMovePopover({
  blockMountId,
  currentPageId,
  workspaceId,
  orgId,
}: PageMovePopoverProps & { orgId: string }) {
  return (
    <PageMovePopoverProvider
      blockMountId={blockMountId}
      currentPageId={currentPageId}
      workspaceId={workspaceId}
      orgId={orgId}
    >
      <Trigger />
      <Content />
    </PageMovePopoverProvider>
  );
}
