/**
 * Block Action Bar View Component
 *
 * Presentational component: 렌더링만 담당
 * - Props만 받음
 * - Hook 사용 없음
 * - Context 사용 없음
 * - Storybook에서 독립적으로 테스트 가능
 */

'use client';

import { useRef } from 'react';

import { ToolbarContainer } from '@workspace/ui/components/ssota-ui/toolbar-container';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';
// Canvas Management Hooks
import { usePreventPinchZoom } from '@/domains/canvas-management/frontend/hooks/control/use-prevent-pinch-zoom';

export interface BlockActionBarViewProps {
  show: boolean;
  children: React.ReactNode; // Action items
}

/**
 * Block Action Bar View
 *
 * 실제 DOM 컨테이너 (Presentational)
 */
export function BlockActionBarView({
  show,
  children,
}: BlockActionBarViewProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 트랙패드 핀치 줌 방지
  usePreventPinchZoom(toolbarRef);

  if (!show) {
    return null;
  }

  return (
    <Box
      className={cn(
        'absolute bottom-[-50px] left-1/2 -translate-x-1/2 z-50',
        'pointer-events-auto'
      )}
    >
      <ToolbarContainer
        toolbarRef={toolbarRef}
        preventDrag
        preventMouseDown
        preventClick
        className="gap-0.5"
      >
        <TooltipProvider>{children}</TooltipProvider>
      </ToolbarContainer>
    </Box>
  );
}
