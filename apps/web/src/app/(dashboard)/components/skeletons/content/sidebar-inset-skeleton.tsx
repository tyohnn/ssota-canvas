import { SidebarInset } from '@workspace/ui/components/ui/sidebar';
import { CanvasLoadingSkeleton } from '@/domains/workspace-management/frontend/components/page-viewer/canvas-loading-skeleton';
import { DriveContentSkeleton } from '@/domains/drive/frontend/components/drive-content-skeleton';

import { Box } from '@/components/ui/box';

import { HeaderSkeleton } from './header-skeleton';

export type SidebarInsetContentVariant = 'canvas' | 'drive';

/**
 * SidebarInset 영역 스켈레톤.
 * contentVariant에 따라 Drive / Canvas 구분.
 * - drive: DriveContentSkeleton (헤더 + 필터 + 그리드)
 * - canvas(기본): HeaderSkeleton + CanvasLoadingSkeleton
 */
export function SidebarInsetSkeleton({
  loadingMessage,
  contentVariant = 'canvas',
}: {
  loadingMessage?: string;
  contentVariant?: SidebarInsetContentVariant;
} = {}) {
  if (contentVariant === 'drive') {
    return (
      <SidebarInset className="overflow-hidden overscroll-none h-svh flex flex-col">
        <DriveContentSkeleton />
      </SidebarInset>
    );
  }

  return (
    <SidebarInset className="overflow-hidden overscroll-none h-svh flex flex-col">
      <HeaderSkeleton />
      <Box className="flex-1 relative overflow-hidden">
        <CanvasLoadingSkeleton loadingMessage={loadingMessage} />
      </Box>
    </SidebarInset>
  );
}
