/**
 * Tabs Loading Skeleton
 *
 * 탭 설정 로딩 중 표시되는 스켈레톤
 */

'use client';

import { Box } from '@/components/ui/box';

export function TabsLoadingSkeleton() {
  return (
    <Box className="border-t border-border/40 px-4 py-6">
      <Box className="h-8 bg-muted animate-pulse rounded" />
    </Box>
  );
}
