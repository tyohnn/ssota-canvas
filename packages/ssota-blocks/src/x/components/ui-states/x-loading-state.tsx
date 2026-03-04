'use client';

import React from 'react';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * X Loading State Component
 *
 * Skeleton that mirrors the X preview card layout for a smooth transition:
 * header (avatar, name, @username, link icon, X logo) → body (post text lines) → stats + date.
 */
export function XLoadingState() {
  return (
    <Box className="w-full h-full flex flex-col overflow-hidden">
      <Box className="flex-1 p-4 flex flex-col gap-3 min-h-0 overflow-hidden">
        {/* Header: avatar + name/username + icons (matches XPreviewCard) */}
        <Box className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <Box className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-20" />
          </Box>
          <Skeleton className="w-4 h-4 shrink-0 rounded" />
          <Skeleton className="w-4 h-4 shrink-0 rounded" />
        </Box>

        {/* Body: post text lines (≈ line-clamp-6) */}
        <Box className="space-y-2 flex-1 min-h-0">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-2/3" />
        </Box>

        {/* Stats row */}
        <Box className="flex gap-4">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </Box>

        {/* Date */}
        <Skeleton className="h-3 w-24" />
      </Box>
    </Box>
  );
}
