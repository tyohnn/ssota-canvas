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
