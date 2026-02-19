'use client';

import React from 'react';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';

import { Box } from '@/components/ui/box';

/**
 * Link Loading State Component
 *
 * Skeleton shown while fetching Open Graph metadata.
 * Layout mirrors the preview card (image area + title/description) for a smooth transition.
 */
export function LinkLoadingState() {
  return (
    <>
      {/* OG image area skeleton */}
      <Box className="w-full aspect-2/1 bg-muted shrink-0 overflow-hidden">
        <Skeleton className="w-full h-full" />
      </Box>

      {/* Title & description skeleton */}
      <Box className="flex-1 p-3 pb-2 flex flex-col gap-2 min-h-0">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </Box>
    </>
  );
}
