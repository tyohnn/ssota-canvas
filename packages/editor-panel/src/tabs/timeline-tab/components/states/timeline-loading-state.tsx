'use client';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { Box } from '@workspace/ui/components/ui/box';

export interface TimelineLoadingStateProps {
  isExtracting?: boolean;
}

export function TimelineLoadingState({ isExtracting = false }: TimelineLoadingStateProps) {
  return (
    <Box className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {isExtracting ? 'Extracting transcript...' : 'Loading transcript...'}
      </p>
      <Box className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </Box>
    </Box>
  );
}
