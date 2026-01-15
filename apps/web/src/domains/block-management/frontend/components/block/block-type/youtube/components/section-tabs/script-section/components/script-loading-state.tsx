/**
 * Script Loading State
 *
 * 스크립트 로딩 중일 때 표시하는 컴포넌트 (Skeleton 사용)
 */

'use client';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';

import { Box } from '@/components/ui/box';

/**
 * Script Loading State Component
 */
export function ScriptLoadingState() {
  return (
    <Box className="space-y-4">
      <Box className="flex items-center justify-between">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-16" />
      </Box>
      <Box className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Box key={index} className="space-y-1">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-4 w-full" />
          </Box>
        ))}
      </Box>
    </Box>
  );
}
