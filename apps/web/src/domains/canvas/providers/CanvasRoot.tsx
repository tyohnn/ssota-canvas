'use client';

import React from 'react';
import type { Block } from '@/db/schema';
import { CanvasDataProvider } from '../contexts/CanvasDataContext';
import { CanvasPageCommandsProvider } from '../contexts/CanvasPageCommandsContext';

interface CanvasRootProps {
  workspaceId: string;
  initialPageBlocks: Block[];
  initialComponentBlocks: Block[];
  children: React.ReactNode;
}

/**
 * Root provider component that supplies canvas data and page command context to its children.
 *
 * The `initialPageBlocks` prop is forwarded to the data provider. The `initialComponentBlocks` prop
 * is intentionally ignored here and an empty array is passed to the data provider instead.
 *
 * @param workspaceId - Identifier for the current workspace; passed to the page commands provider.
 * @param initialComponentBlocks - Provided component blocks are not used; `[]` is supplied to the data provider.
 * @returns A React element that wraps `children` with CanvasDataProvider and CanvasPageCommandsProvider.
 */
export function CanvasRoot({
  workspaceId,
  initialPageBlocks,
  initialComponentBlocks,
  children,
}: CanvasRootProps) {
  return (
    <CanvasDataProvider
      initialPageBlocks={initialPageBlocks}
      // initialComponentBlocks={initialComponentBlocks}
      initialComponentBlocks={[]}
    >
      <CanvasPageCommandsProvider workspaceId={workspaceId}>
        {children}
      </CanvasPageCommandsProvider>
    </CanvasDataProvider>
  );
}