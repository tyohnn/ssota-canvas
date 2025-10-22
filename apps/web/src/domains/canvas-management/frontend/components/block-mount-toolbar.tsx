'use client';

import React, { useRef } from 'react';
import { NodeToolbar, Position } from '@xyflow/react';
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
import { Separator } from '@workspace/ui/components/ui/separator';
import { MoreHorizontal, Edit, Copy, Trash2, ChevronRight } from 'lucide-react';

// Canvas Management Hooks
import { useCanvasMode } from '../hooks/use-canvas-mode';
import { useCanvasSelection } from '../hooks/use-canvas-selection';
import { useCanvasBlockLifecycle } from '../hooks/use-canvas-block-lifecycle';
import { usePreventPinchZoom } from '../hooks/use-prevent-pinch-zoom';

export interface BlockMountToolbarProps {
  pageId: string;
  orgId?: string;
  workspaceId: string;
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
  pageId,
  orgId,
  workspaceId,
}: BlockMountToolbarProps) {
  const canvasMode = useCanvasMode();
  const canvasSelection = useCanvasSelection();
  const blockLifecycle = useCanvasBlockLifecycle({ pageId, orgId });

  // 선택된 블럭 정보 (단일 선택 시에만 이 컴포넌트가 렌더링됨)
  const selectedBlocks = canvasSelection.getSelectedBlocks();
  const selectedBlockId = selectedBlocks[0];

  const selectedNode = canvasSelection.selectedNodes.find(
    node => node.id === selectedBlockId
  );

  // 블럭 타입 확인
  const blockType = selectedNode?.data?.blockType || 'basic';

  // Details 버튼 핸들러 (에디터 패널 열기)
  const handleDetails = () => {
    if (!selectedBlockId) return;
    canvasMode.enterBlockEditingMode(selectedBlockId);
  };

  // 더보기 메뉴 핸들러들
  const handleEdit = () => {
    // TODO: 블럭 편집 모드 (CM-003에서 구현 예정)
  };

  const handleDuplicate = () => {
    // TODO: 블럭 복제 구현 (Phase 4에서 구현 예정)
  };

  const handleCreateComponent = () => {
    // TODO: 컴포넌트 생성 구현 (추후 구현 예정)
  };

  const handleDelete = () => {
    // TODO: 블럭 삭제 구현 (Phase 4에서 구현 예정)
  };

  const toolbarRef = useRef<HTMLDivElement>(null);

  // 트랙패드 핀치 줌 방지
  usePreventPinchZoom(toolbarRef);

  // 툴바 표시 조건: 단일 선택 모드 && 선택된 블럭이 있음
  const shouldShowToolbar = !!selectedBlockId && selectedBlocks.length === 1;

  return (
    <NodeToolbar
      isVisible={shouldShowToolbar}
      position={Position.Top}
      className="nodrag nowheel"
    >
      {/* z-index: React Flow NodeToolbar (자동 관리) < canvas-toolbar(10) < multi-selection-toolbar(50) */}
      <div
        ref={toolbarRef}
        className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-lg shadow-lg px-2 py-1 flex items-center gap-1"
        style={{ touchAction: 'none' }}
        onWheel={e => e.stopPropagation()}
      >
        <TooltipProvider>
          {/* Details 버튼 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDetails}
                className="h-7 px-2 text-xs"
              >
                <ChevronRight className="h-3 w-3 mr-1" />
                Details
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>블럭 세부사항</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="mx-1 h-4" />

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
              <TooltipContent side="bottom">
                <p>더보기</p>
              </TooltipContent>
            </Tooltip>

            <DropdownMenuContent align="end" className="w-48">
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
