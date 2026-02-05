import { SidebarInset } from '@workspace/ui/components/ui/sidebar';
import { CanvasLoadingSkeleton } from '@/domains/workspace-management/frontend/components/page-viewer/canvas-loading-skeleton';

import { Box } from '@/components/ui/box';

import { HeaderSkeleton } from './header-skeleton';

/**
 * SidebarInset 영역 스켈레톤.
 * 헤더 + 캔버스 로딩 스켈레톤 조합.
 * r/loading.tsx, DashboardLoadingSkeleton 등에서 재사용.
 */
export function SidebarInsetSkeleton({
  loadingMessage,
}: {
  loadingMessage?: string;
} = {}) {
  return (
    <SidebarInset className="overflow-hidden overscroll-none h-svh flex flex-col">
      <HeaderSkeleton />
      <Box className="flex-1 relative overflow-hidden">
        <CanvasLoadingSkeleton loadingMessage={loadingMessage} />
      </Box>
    </SidebarInset>
  );
}
