/**
 * Content Area View
 *
 * Presentational scroll container for editor panel content
 */

'use client';

import React from 'react';
import { Box } from '@workspace/ui/components/ui/box';

export interface ContentAreaViewProps {
  children: React.ReactNode;
  className?: string;
}

export function ContentAreaView({
  children,
}: ContentAreaViewProps) {
  return (
    <Box
      className='flex-1 min-h-0 overflow-y-auto'
      data-content-area-scroll-container="true"
    >
      {children}
    </Box>
  );
}
