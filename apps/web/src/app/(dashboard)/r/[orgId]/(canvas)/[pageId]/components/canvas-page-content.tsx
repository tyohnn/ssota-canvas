'use client';

import { Box } from '@/components/ui/box';
import { CanvasLayoutProvider } from '@/app/(dashboard)/contexts/canvas-layout-context';

interface CanvasPageContentProps {
  children: React.ReactNode;
}

/**
 * 캔버스 + 우측 채팅 패널 레이아웃.
 * 좌측 사이드바 | (캔버스 | 우측 사이드바) 구조에서 캔버스와 우측 사이드바를 묶음.
 * 
 * Note: ChatPanelSidebar is now rendered inside CanvasBase (via children)
 * to access ReactFlowProvider and CanvasdownProvider.
 */
export function CanvasPageContent({ children }: CanvasPageContentProps) {
  return (
    <CanvasLayoutProvider defaultRightSidebarOpen={true}>
      <Box className="flex flex-1 min-h-0 min-w-0 w-full">
        {children}
      </Box>
    </CanvasLayoutProvider>
  );
}
