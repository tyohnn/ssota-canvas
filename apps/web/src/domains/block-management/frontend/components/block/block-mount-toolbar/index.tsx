'use client';

import React, { useRef } from 'react';
import { NodeToolbar, Position, useReactFlow } from '@xyflow/react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Copy, Trash2, ChevronRight } from 'lucide-react';

// Canvas Management Hooks
import { useCanvasMode } from '@/domains/canvas-management/frontend/hooks/use-canvas-mode';
import { useCanvasBlockLifecycle } from '@/domains/canvas-management/frontend/hooks/use-canvas-block-lifecycle';
import { usePreventPinchZoom } from '@/domains/canvas-management/frontend/hooks/use-prevent-pinch-zoom';
import { BlockToolbarMapper } from './block-toolbar-mapper';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

export interface BlockMountToolbarProps {
  blockId: string;
  blockMountId: string;
  blockType: string;
  blockData: BlockNodeData;
  pageId: string;
  orgId: string;
  workspaceId: string;
  width?: number;
  height?: number;
}

/**
 * BlockMountToolbar Component
 *
 * 선택된 블럭에 대한 편집 도구를 제공하는 툴바 컴포넌트
 * (기존 BlockToolbar의 확장)
 *
 * Features:
 * - 선택된 블럭 위에 표시되는 컨텍스트 툴바
 * - Details 버튼: 에디터 패널 열기/닫기
 * - 더보기 메뉴: Edit, Duplicate, Create Component, Delete
 * - 블럭 타입별 추가 옵션들
 *
 * 렌더링 조건: isSingleSelectionMode() === true && isSelected(blockId)
 */
export function BlockMountToolbar({
  blockId,
  blockMountId,
  blockType,
  blockData,
  pageId,
  orgId,
  workspaceId,
  width,
  height,
}: BlockMountToolbarProps) {
  const canvasMode = useCanvasMode();
  const blockLifecycle = useCanvasBlockLifecycle({
    pageId,
    orgId,
    workspaceId,
  });
  const { deleteElements } = useReactFlow();

  // Canvas Mode 함수들 미리 추출
  const { exitToDefaultMode } = canvasMode;

  // Details 버튼 핸들러 (에디터 패널 열기)
  const handleDetails = () => {
    canvasMode.enterBlockEditingMode(blockId);
  };

  // 더보기 메뉴 핸들러들
  const handleEdit = () => {
    canvasMode.enterBlockEditingMode(blockId);
  };

  const handleDuplicate = async () => {
    try {
      // 블럭 복제 실행 (블럭 너비 + 50px 오프셋)
      const blockWidth = width || 200; // 기본 너비 200px
      const offsetX = blockWidth + 50;
      const offsetY = 20; // Y축은 기본 20px

      await blockLifecycle.duplicateBlockAndMount(
        blockMountId,
        offsetX,
        offsetY
      );
    } catch (error) {
      console.error('Block duplication failed:', error);
    }
  };

  const handleCreateComponent = () => {
    // TODO: 컴포넌트 생성 구현 (추후 구현 예정)
  };

  const handleDelete = async () => {
    // 1. React Flow에서 즉시 제거 (Optimistic UI)
    deleteElements({ nodes: [{ id: blockId }] });

    // 2. 기본 모드로 복귀
    exitToDefaultMode();

    // 3. 서버 액션은 onNodesDelete 콜백에서 처리됨
  };

  const toolbarRef = useRef<HTMLDivElement>(null);

  // 트랙패드 핀치 줌 방지
  usePreventPinchZoom(toolbarRef);

  return (
    <NodeToolbar
      isVisible={true}
      position={Position.Top}
      className="nodrag nowheel"
    >
      {/* z-index: React Flow NodeToolbar (자동 관리) < canvas-toolbar(10) < multi-selection-toolbar(50) */}
      <div
        ref={toolbarRef}
        className="bg-background/90 backdrop-blur-md border border-border rounded-lg shadow-lg px-2 py-1 flex items-center gap-1"
        style={{ touchAction: 'none' }}
        onWheel={e => e.stopPropagation()}
      >
        <TooltipProvider>
          {/* 블럭 타입별 기본 속성 툴바 아이템 (좌측부터) */}
          <BlockToolbarMapper
            blockId={blockId}
            blockType={blockType}
            blockData={blockData}
            disabled={false}
          />

          {/* Details 버튼 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={e => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleDetails();
                }}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" hasArrow={false} sideOffset={10}>
              <p>블럭 세부사항</p>
            </TooltipContent>
          </Tooltip>

          {/* 더보기 메뉴 */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="top" hasArrow={false} sideOffset={10}>
                <p>더보기</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="start" side="right" className="w-48">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                편집
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                복제
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleCreateComponent}>
                <Edit className="h-4 w-4 mr-2" />
                컴포넌트 생성
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
      </div>
    </NodeToolbar>
  );
}
