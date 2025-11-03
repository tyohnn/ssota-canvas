/**
 * Base Block Component
 *
 * 모든 블록의 공통 래퍼 컴포넌트
 * - NodeResizer (우측 하단 리사이즈 핸들)
 * - Handle 4개 (상하좌우 연결점)
 * - Top Toolbar (BlockMountToolbar)
 */

import { memo, forwardRef, useCallback, useState } from 'react';
import {
  Handle,
  Position,
  NodeResizeControl,
  useReactFlow,
} from '@xyflow/react';
import { BaseHandle } from '@workspace/ui/components/react-flow/base-handle';
import { BlockMountToolbar } from '@/domains/block-management/frontend/components/block-mount-toolbar';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { cn } from '@workspace/ui/lib/utils';
import { useBlockCommands } from '../../../hooks/use-block-commands';
import { useCanvasSelection } from '@/domains/canvas-management/frontend/hooks/use-canvas-selection';
import {
  ColorToken,
  getRichStyleClasses,
  getTextColorClass,
  getSelectedRingClasses,
  getGlowColor,
} from '@/domains/block-management/shared/types/style-tokens.types';

/**
 * 커스텀 리사이즈 아이콘 컴포넌트
 * 우측 하단 모서리에 곡선을 따라 배치되는 세련된 디자인
 */
function ResizeIcon() {
  return (
    <div
      className="absolute -right-1 -bottom-1 w-8 h-8 cursor-nwse-resize group"
      style={{
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
      }}
    >
      {/* 배경 원형 */}
      <div className="absolute right-0 bottom-0 w-7 h-7 bg-white rounded-tl-full border-2 border-blue-500 group-hover:bg-blue-50 group-hover:border-blue-600 transition-all">
        {/* Grip 패턴 (점선) */}
        <svg
          className="absolute right-1.5 bottom-1.5 w-3 h-3"
          viewBox="0 0 12 12"
          fill="none"
        >
          {/* 대각선 그립 점들 */}
          <circle cx="9" cy="9" r="1" fill="#3b82f6" className="group-hover:fill-blue-600" />
          <circle cx="6" cy="9" r="1" fill="#3b82f6" className="group-hover:fill-blue-600" />
          <circle cx="9" cy="6" r="1" fill="#3b82f6" className="group-hover:fill-blue-600" />
          <circle cx="3" cy="9" r="1" fill="#3b82f6" className="group-hover:fill-blue-600" />
          <circle cx="6" cy="6" r="1" fill="#3b82f6" className="group-hover:fill-blue-600" />
          <circle cx="9" cy="3" r="1" fill="#3b82f6" className="group-hover:fill-blue-600" />
        </svg>
      </div>
    </div>
  );
}

export interface BaseBlockProps {
  data: BlockNodeData;
  selected?: boolean;
  isConnectable?: boolean;
  children?: React.ReactNode;
  width?: number;
  height?: number;
  // 스타일 관련 props (선택적)
  styleProps?: {
    color?: string;
    richStyle?: boolean;
    textAlign?: string;
    fontSize?: string;
  };
  // 배경/테두리 제어
  noBorder?: boolean; // 테두리 제거 (각 블록에서 직접 처리)
  noBackground?: boolean; // 배경색 제거
}

/**
 * Base Block Component
 *
 * 모든 블록의 공통 래퍼로 다음 기능을 제공:
 * 1. NodeResizer - 우측 하단에서 종횡비 자유롭게 리사이즈
 * 2. Handle 4개 - 상하좌우 연결점
 * 3. Top Toolbar - BlockMountToolbar
 * 4. Children - 실제 블록 컨텐츠
 */
export const BaseBlock = memo(
  forwardRef<HTMLDivElement, BaseBlockProps>(
    (
      {
        data,
        selected = false,
        isConnectable = true,
        children,
        width,
        height,
        styleProps,
        noBorder = false,
        noBackground = false,
      },
      ref
    ) => {
      const { updateBlockSize } = useBlockCommands();
      const canvasSelection = useCanvasSelection();
      const [isResizing, setIsResizing] = useState(false);

      // 리사이즈 시작 시 transition 비활성화
      const handleResizeStart = useCallback(() => {
        setIsResizing(true);
      }, []);

      // 리사이즈 완료 시 DB에 저장 및 transition 재활성화
      const handleResizeEnd = useCallback(
        async (_event: any, resizeData: { width: number; height: number }) => {
          if (!data.blockMountId) {
            console.warn(
              'blockMountId가 없어서 리사이즈 정보를 저장할 수 없습니다.'
            );
            return;
          }

          // DB에 크기 업데이트 저장 (BlockMount Entity 업데이트)
          const result = await updateBlockSize(data.blockMountId, {
            width: resizeData.width,
            height: resizeData.height,
            pageId: data.pageId,
            orgId: data.orgId,
            workspaceId: data.workspaceId,
          });

          if (!result.ok) {
            console.error('블록 마운트 크기 업데이트 실패:', result.error);
          }

          // 리사이즈 완료 후 transition 재활성화
          setIsResizing(false);
        },
        [
          data.blockMountId,
          data.pageId,
          data.orgId,
          data.workspaceId,
          updateBlockSize,
        ]
      );

      // 색상 토큰 가져오기
      const colorToken = (styleProps?.color as ColorToken) || ColorToken.GRAY;
      const richStyle = styleProps?.richStyle || false;

      // 스타일 클래스 생성
      const styleClasses = richStyle ? getRichStyleClasses(colorToken) : '';
      const textColorClass = getTextColorClass(colorToken);
      const selectedRingClasses = getSelectedRingClasses(colorToken);

      // 현재 블럭이 선택된 블럭인지 확인
      const isCurrentBlockSelected = canvasSelection.isSelected(
        data.blockMountId || ''
      );
      const selectedBlocks = canvasSelection.getSelectedBlocks();
      const isSingleSelection = selectedBlocks.length === 1;

      return (
        <div
          ref={ref}
          className={cn(
            // 기본 스타일만 유지 (호버/선택 효과는 하위 블록에서 처리)
            'relative w-full h-full min-w-[100px] min-h-[50px]',
            // Transition (리사이즈 중에는 비활성화)
            !isResizing && 'transition-all duration-300 ease-out'
          )}
          style={
            {
              width: width || 'auto',
              height: height || 'auto',
              minHeight: noBackground ? undefined : '120px',
            } as React.CSSProperties
          }
        >
          {/* 커스텀 NodeResizeControl - 우측 하단 리사이즈 핸들 */}
          {selected && data.blockMountId && (
            <NodeResizeControl
              nodeId={data.blockMountId}
              position="bottom-right"
              style={{
                background: 'transparent',
                border: 'none',
                width: '32px',
                height: '32px',
              }}
              minWidth={100}
              minHeight={50}
              onResizeStart={handleResizeStart}
              onResizeEnd={handleResizeEnd}
            >
              <ResizeIcon />
            </NodeResizeControl>
          )}

          {/* Connection Handles - 각 방향당 1개씩 (source/target 모두 가능) */}
          <Handle
            type="source"
            position={Position.Left}
            isConnectable={isConnectable}
            id="left"
            className="w-3! h-3! bg-blue-500! border-2! border-white! hover:bg-blue-600! hover:scale-125! transition-all z-50!"
          />
          <Handle
            type="source"
            position={Position.Right}
            isConnectable={isConnectable}
            id="right"
            className="w-3! h-3! bg-blue-500! border-2! border-white! hover:bg-blue-600! hover:scale-125! transition-all z-50!"
          />
          <Handle
            type="source"
            position={Position.Top}
            isConnectable={isConnectable}
            id="top"
            className="w-3! h-3! bg-blue-500! border-2! border-white! hover:bg-blue-600! hover:scale-125! transition-all z-50!"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            isConnectable={isConnectable}
            id="bottom"
            className="w-3! h-3! bg-blue-500! border-2! border-white! hover:bg-blue-600! hover:scale-125! transition-all z-50!"
          />

          {/* Top Toolbar - BlockMountToolbar (선택된 블럭에만 표시) */}
          {data.blockMountId &&
            data.pageId &&
            data.workspaceId &&
            isCurrentBlockSelected &&
            isSingleSelection && (
              <BlockMountToolbar
                blockId={data.blockMountId}
                blockMountId={data.blockMountId}
                blockType={data.blockType || 'basic'}
                blockData={data}
                pageId={data.pageId}
                orgId={data.orgId}
                workspaceId={data.workspaceId}
                width={width}
                height={height}
              />
            )}

          {/* Children - 실제 블록 컨텐츠 */}
          <div className={cn('w-full h-full', textColorClass)}>{children}</div>
        </div>
      );
    }
  )
);

BaseBlock.displayName = 'BaseBlock';
