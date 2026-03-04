/**
 * Tabs Loading Skeleton
 *
 * Skeleton shown while tab config is loading
 */

'use client';

import { Box } from '@workspace/ui/components/ui/box';

export function TabsLoadingSkeleton() {
  return (
    <Box className="border-t border-border/40 px-4 py-6">
      <Box className="h-8 bg-muted animate-pulse rounded" />
    </Box>
  );
}
