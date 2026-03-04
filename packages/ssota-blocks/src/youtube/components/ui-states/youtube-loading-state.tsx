'use client';

import React from 'react';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * YouTube Loading State Component
 *
 * 메타데이터를 로딩 중일 때 표시되는 스켈레톤 컴포넌트
 */
export function YoutubeLoadingState() {
  return (
    <>
      <Box className="flex-1 relative min-h-0">
        <Skeleton className="absolute inset-0" />
      </Box>

      <Box className="p-3 flex items-start gap-3 bg-background border-t border-border">
        <Skeleton className="w-9 h-9 rounded-full shrink-0" />

        <Box className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </Box>
      </Box>
    </>
  );
}
