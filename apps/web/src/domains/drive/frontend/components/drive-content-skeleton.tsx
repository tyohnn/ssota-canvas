import { HeaderSkeleton } from '@/app/(dashboard)/components/skeletons';
import { Box } from '@workspace/ui/components/ui/box';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';

import { DriveGridSkeleton } from './drive-grid/components/drive-grid-skeleton';

/**
 * Drive 페이지 로딩 스켈레톤.
 * Header + Filter bar + Grid 구조로 실제 Drive 레이아웃과 일치.
 */
export function DriveContentSkeleton() {
  return (
    <Box className="flex h-full flex-col">
      <HeaderSkeleton />
      <Box className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-4 py-2">
        <Skeleton className="h-8 w-32 rounded-md" />
        <Skeleton className="h-7 w-14 rounded-md" />
      </Box>
      <Box className="flex-1 overflow-hidden">
        <DriveGridSkeleton />
      </Box>
    </Box>
  );
}
