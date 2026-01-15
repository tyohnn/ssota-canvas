/**
 * Tab Content Loading Skeleton
 *
 * 탭 콘텐츠 로딩 중 표시되는 스켈레톤
 */

'use client';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';

import { Box } from '@/components/ui/box';

export function TabContentLoadingSkeleton() {
  return (
    <Box className="px-4 py-6">
      <Box className="space-y-2">
        <Skeleton className="h-4" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </Box>
    </Box>
  );
}
