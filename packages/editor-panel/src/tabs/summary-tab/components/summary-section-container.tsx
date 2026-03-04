'use client';

import type { ReactNode } from 'react';
import { Box } from '@workspace/ui/components/ui/box';

export interface SummarySectionContainerProps {
  children: ReactNode;
}

export function SummarySectionContainer({ children }: SummarySectionContainerProps) {
  return (
    <Box className="pl-6 pr-12 py-3 min-h-[200px]" data-summary-section="true">
      {children}
    </Box>
  );
}
