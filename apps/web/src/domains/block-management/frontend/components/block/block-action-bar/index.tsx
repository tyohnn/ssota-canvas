'use client';

import React, { useRef } from 'react';

import { ToolbarContainer } from '@workspace/ui/components/ssota-ui/toolbar-container';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
// Canvas Management Hooks
import { usePreventPinchZoom } from '@/domains/canvas-management/frontend/hooks/control/use-prevent-pinch-zoom';

import { BLOCK_ACTION_MODULES } from './action-prefetch';
import { BlockActionMapper } from './block-action-mapper';

export interface BlockActionBarProps {
  blockId: string;
  blockType: string;
  blockData: BlockNodeData;
}

/**
 * BlockActionBar Component
 *
 * 선택된 블럭에 대한 액션을 제공하는 툴바 컴포넌트
 * 블록 아래쪽에 표시되며 블록 타입별로 다른 액션 아이템을 제공합니다.
 *
 * Features:
 * - 선택된 블럭 아래쪽에 표시되는 컨텍스트 액션 바
 * - 블럭 타입별 액션 아이템 (이미지 검색, AI 생성 등)
 * - BlockOriginalToolbar와 동일한 UX/UI (Absolute + ToolbarContainer)
 *
 * 렌더링 조건: 블록이 선택되었을 때
 */

export function BlockActionBar({
  blockId,
  blockType,
  blockData,
}: BlockActionBarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);

  // 트랙패드 핀치 줌 방지
  usePreventPinchZoom(toolbarRef);

  // 액션 아이템이 없는 블록 타입이면 렌더링하지 않음
  if (!BLOCK_ACTION_MODULES[blockType]) {
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
        <TooltipProvider>
          {/* 블록 타입별 액션 아이템 매퍼 */}
          <BlockActionMapper
            blockId={blockId}
            blockType={blockType}
            blockData={blockData}
          />
        </TooltipProvider>
      </ToolbarContainer>
    </Box>
  );
}
