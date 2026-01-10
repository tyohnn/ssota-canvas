'use client';

import React, { useRef } from 'react';

import { NodeToolbar, Position } from '@xyflow/react';

import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';

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
 * 블록 우측에 표시되며 블록 타입별로 다른 액션 아이템을 제공합니다.
 *
 * Features:
 * - 선택된 블럭 우측에 표시되는 컨텍스트 액션 바
 * - 블럭 타입별 액션 아이템 (이미지 검색, AI 생성 등)
 * - BlockOriginalToolbar와 유사한 디자인
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
    <NodeToolbar
      isVisible={true}
      position={Position.Bottom}
      className="nodrag nowheel"
    >
      {/* z-index: React Flow NodeToolbar (자동 관리) < canvas-toolbar(10) < multi-selection-toolbar(50) */}
      <div
        ref={toolbarRef}
        className="bg-background/90 backdrop-blur-md border border-border rounded-lg shadow-lg px-1 py-1.5 flex items-center gap-0.5"
        style={{ touchAction: 'none' }}
        onWheel={e => e.stopPropagation()}
      >
        <TooltipProvider>
          {/* 블록 타입별 액션 아이템 매퍼 */}
          <BlockActionMapper
            blockId={blockId}
            blockType={blockType}
            blockData={blockData}
          />
        </TooltipProvider>
      </div>
    </NodeToolbar>
  );
}
