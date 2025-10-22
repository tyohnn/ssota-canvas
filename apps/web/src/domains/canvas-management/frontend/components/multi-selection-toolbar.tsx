'use client';

import { memo, useMemo, useRef } from 'react';
import { useStore, useViewport, useReactFlow } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
  MoreVertical,
} from 'lucide-react';
import { useCanvasMode } from '../hooks/use-canvas-mode';
import { useCanvasSelection } from '../hooks/use-canvas-selection';
import {
  useCanvasBlockTransform,
  AlignmentType,
} from '../hooks/use-canvas-block-transform';
import { useCanvasBlockLifecycle } from '../hooks/use-canvas-block-lifecycle';
import { usePreventPinchZoom } from '../hooks/use-prevent-pinch-zoom';
import { deleteMultipleBlockMountsAction } from '../../actions/block.actions';

const PADDING = 0;
const TOOLBAR_OFFSET = 12; // 툴바와 선택 박스 사이의 간격

interface MultiSelectionToolbarProps {
  pageId: string;
  orgId?: string;
  workspaceId?: string;
}

/**
 * MultiSelectionToolbar 컴포넌트
 *
 * 렌더링 조건: isMultiSelectionMode() === true && getSelectionCount() >= 2
 * 다중 선택된 블럭들에 대한 정렬 및 편집 도구 제공
 */
export const MultiSelectionToolbar = memo(function MultiSelectionToolbar({
  pageId,
  orgId,
  workspaceId,
}: MultiSelectionToolbarProps) {
  const { isMultiSelectionMode, exitToDefaultMode } = useCanvasMode();
  const { getSelectedBlocks, getSelectionCount } = useCanvasSelection();
  const { alignBlocks, distributeBlocks } = useCanvasBlockTransform({ pageId });
  const blockLifecycle = useCanvasBlockLifecycle({ pageId, orgId });
  const viewport = useViewport();

  // React Flow Store 직접 접근
  const nodes = useStore(state => state.nodes);
  const setNodes = useStore(state => state.setNodes);
  const { deleteElements } = useReactFlow();

  // 선택된 노드들의 정보 가져오기
  const selectedNodes = useStore(state =>
    state.nodes.filter(node => node.selected)
  );

  // 각 노드의 실제 크기를 DOM에서 측정 (선택이 바뀔 때만)
  const nodesWithSize = useMemo(() => {
    if (selectedNodes.length === 0) {
      return [];
    }

    return selectedNodes.map(node => {
      const element = document.querySelector(`[data-id="${node.id}"]`);
      let width = 0;
      let height = 0;

      if (element) {
        // React Flow 노드 구조: Handle을 제외한 실제 컨텐츠 요소 찾기
        const children = Array.from(element.children);
        const contentElement = children.find(
          child => !child.classList.contains('react-flow__handle')
        ) as HTMLElement | undefined;

        if (contentElement) {
          width = contentElement.offsetWidth;
          height = contentElement.offsetHeight;
        }
      }

      // Fallback: measured 또는 node.width 사용
      if (!width || !height) {
        width =
          node.measured?.width ||
          node.width ||
          (node.style?.width as number) ||
          200;
        height =
          node.measured?.height ||
          node.height ||
          (node.style?.height as number) ||
          150;
      }

      return {
        id: node.id,
        position: node.position,
        actualWidth: width,
        actualHeight: height,
      };
    });
  }, [selectedNodes]);

  // 선택된 노드들의 경계 계산 (viewport 좌표계 고려)
  const toolbarPosition = useMemo(() => {
    if (nodesWithSize.length === 0) {
      return null;
    }

    // Flow 좌표계에서 경계 계산
    const minX = Math.min(...nodesWithSize.map(n => n.position.x));
    const minY = Math.min(...nodesWithSize.map(n => n.position.y));
    const maxX = Math.max(
      ...nodesWithSize.map(n => n.position.x + n.actualWidth)
    );

    // Flow 좌표계에서 중앙 X와 상단 Y 계산
    const centerX = (minX + maxX) / 2;
    const topY = minY - PADDING;

    // Screen 좌표계로 변환 (viewport 적용)
    return {
      left: centerX * viewport.zoom + viewport.x,
      top: topY * viewport.zoom + viewport.y - TOOLBAR_OFFSET,
    };
  }, [nodesWithSize, viewport]);

  const toolbarRef = useRef<HTMLDivElement>(null);

  // 트랙패드 핀치 줌 방지
  usePreventPinchZoom(toolbarRef);

  // 다중 선택 모드가 아니거나 2개 미만 선택 시 렌더링하지 않음
  if (!isMultiSelectionMode() || getSelectionCount() < 2 || !toolbarPosition) {
    return null;
  }

  const selectedBlockIds = getSelectedBlocks();

  const handleAlign = (alignmentType: AlignmentType) => {
    alignBlocks(selectedBlockIds, alignmentType);
  };

  const handleDistribute = (direction: 'horizontal' | 'vertical') => {
    distributeBlocks(selectedBlockIds, direction);
  };

  const handleDuplicate = async () => {
    if (!workspaceId) {
      return;
    }

    try {
      // 선택된 모든 블럭을 순차적으로 복제
      for (const blockId of selectedBlockIds) {
        const selectedNode = nodes.find(node => node.id === blockId);
        if (!selectedNode?.data?.blockMountId) {
          continue;
        }

        // 각 블럭을 복제 (블럭 너비 + 50px + 인덱스 오프셋)
        const index = selectedBlockIds.indexOf(blockId);
        const blockWidth = selectedNode.width || 200; // 기본 너비 200px
        const baseOffsetX = blockWidth + 50; // 기본 오프셋: 블럭 너비 + 50px
        const offsetX = baseOffsetX + index * 20; // 각 블럭마다 20px씩 추가 오프셋
        const offsetY = 20 + index * 20; // Y축도 인덱스에 따라 오프셋

        await blockLifecycle.duplicateBlock(
          selectedNode.data.blockMountId as string,
          workspaceId,
          offsetX,
          offsetY
        );
      }
    } catch (error) {
      console.error('Multiple blocks duplication failed:', error);
    }
  };

  const handleDelete = async () => {
    // 1. React Flow에서 즉시 제거 (Optimistic UI)
    deleteElements({
      nodes: selectedBlockIds.map(id => ({ id })),
    });

    // 2. 기본 모드로 복귀
    exitToDefaultMode();

    // 3. 서버 액션은 onNodesDelete 콜백에서 처리됨
  };

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50"
      style={{
        left: toolbarPosition.left,
        top: toolbarPosition.top,
        transform: 'translateX(-50%) translateY(-100%)',
        willChange: 'transform', // 성능 최적화
        touchAction: 'none', // 핀치 줌 방지
      }}
      onWheel={e => e.stopPropagation()}
    >
      {/* z-index 계층: 블럭(0) < canvas-toolbar(10) < multi-selection-toolbar(50) */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex items-center gap-1">
        <TooltipProvider delayDuration={300}>
          {/* 좌우 정렬 3개 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAlign('left')}
                className="h-8 w-8 p-0"
              >
                <AlignHorizontalJustifyStart className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>좌측 정렬</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAlign('center')}
                className="h-8 w-8 p-0"
              >
                <AlignHorizontalJustifyCenter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>중앙 정렬</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAlign('right')}
                className="h-8 w-8 p-0"
              >
                <AlignHorizontalJustifyEnd className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>우측 정렬</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 상하 정렬 3개 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAlign('top')}
                className="h-8 w-8 p-0"
              >
                <AlignVerticalJustifyStart className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>상단 정렬</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAlign('middle')}
                className="h-8 w-8 p-0"
              >
                <AlignVerticalJustifyCenter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>중앙 정렬</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAlign('bottom')}
                className="h-8 w-8 p-0"
              >
                <AlignVerticalJustifyEnd className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>하단 정렬</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 간격 2개 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDistribute('horizontal')}
                className="h-8 w-8 p-0"
                disabled={selectedBlockIds.length < 2}
              >
                <AlignHorizontalSpaceBetween className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>수평 균등 분포</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDistribute('vertical')}
                className="h-8 w-8 p-0"
                disabled={selectedBlockIds.length < 2}
              >
                <AlignVerticalSpaceBetween className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>수직 균등 분포</TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* 더보기 메뉴 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onMouseDown={e => e.stopPropagation()}
                className="h-8 w-8 p-0"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="start"
              className="nodrag nowheel border border-border/50 bg-background/70 px-1 py-1 shadow-xl backdrop-blur-md"
            >
              <DropdownMenuItem onClick={handleDuplicate}>
                Duplicate All
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} variant="destructive">
                Delete All
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TooltipProvider>
      </div>
    </div>
  );
});
