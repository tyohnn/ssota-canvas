'use client';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { Box } from '@workspace/ui/components/ui/box';

export function AudioLoadingState() {
  return (
    <Box className="absolute inset-0">
      <Skeleton className="absolute inset-0" />
    </Box>
  );
}
