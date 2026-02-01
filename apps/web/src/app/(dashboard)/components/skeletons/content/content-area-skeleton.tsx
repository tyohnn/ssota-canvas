import { CanvasLoadingSkeleton } from '@/domains/workspace-management/frontend/components/page-viewer/canvas-loading-skeleton';

import { Box } from '@/components/ui/box';

import { HeaderSkeleton } from './header-skeleton';

/**
 * 콘텐츠 영역 스켈레톤 (헤더 + 캔버스).
 * SidebarInset 내부에서 사용. r/page fallback 등.
 */
export function ContentAreaSkeleton() {
  return (
    <>
      <HeaderSkeleton />
      <Box className="flex-1 relative overflow-hidden">
        <CanvasLoadingSkeleton />
      </Box>
    </>
  );
}
