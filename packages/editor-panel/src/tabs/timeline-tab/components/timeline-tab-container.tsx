'use client';

import type { ReactNode } from 'react';
import { Box } from '@workspace/ui/components/ui/box';

export interface TimelineTabContainerProps {
  children: ReactNode;
}

export function TimelineTabContainer({ children }: TimelineTabContainerProps) {
  return (
    <Box className="pl-6 pr-12 py-3 min-h-[200px]" data-timeline-tab="true">
      {children}
    </Box>
  );
}
