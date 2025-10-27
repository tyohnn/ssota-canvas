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
 */
function ResizeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      strokeWidth="1.5"
      stroke="#3b82f6"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ position: 'absolute', right: 2, bottom: 2 }}
    >
      {/* 우측 하단 테두리를 따라 만들어진 리사이즈 핸들 */}
      <path d="M2 14 L14 14 L14 2" stroke="#3b82f6" strokeWidth="1.5" />
      {/* 작은 점들로 리사이즈 가능함을 표시 */}
      {/* <circle cx="12" cy="12" r="1" fill="#3b82f6" />
      <circle cx="10" cy="12" r="0.5" fill="#3b82f6" />
      <circle cx="12" cy="10" r="0.5" fill="#3b82f6" /> */}
    </svg>
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
            // 기본 스타일
            'relative w-full h-full min-w-[100px] min-h-[50px] rounded-lg shadow-sm',
            // 배경색: Rich Style이 아니면 기본 흰색
            !richStyle && 'bg-background',
            // Transition (리사이즈 중에는 비활성화)
            !isResizing && 'transition-all duration-300 ease-out',
            // 선택 상태만: 선명한 링 추가
            selected && selectedRingClasses,
            // 선택됨 + 호버: Shadow 강화
            selected && 'hover:!shadow-xl',
            // 선택 안됨 + 호버: 크기 확대 + 회전
            !selected &&
              'hover:shadow-lg hover:scale-[1.02] hover:rotate-[1deg]',
            // Rich Style 색상 (배경 + 텍스트 + 테두리)
            styleClasses,
            // 글로우 효과 (호버 + 선택 상태 모두)
            'hover:shadow-[0_0_4px_1px_var(--glow-color)]',
            selected && 'shadow-[0_0_4px_1px_var(--glow-color)]'
          )}
          style={
            {
              width: width || 'auto',
              height: height || 'auto',
              minHeight: '120px',
              '--glow-color': getGlowColor(colorToken),
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
              }}
              minWidth={100}
              minHeight={50}
              onResizeStart={handleResizeStart}
              onResizeEnd={handleResizeEnd}
            >
              <ResizeIcon />
            </NodeResizeControl>
          )}

          {/* Handle 4개 - 상하좌우 연결점 */}
          <BaseHandle
            type="target"
            position={Position.Left}
            isConnectable={isConnectable}
            id="left"
          />
          <BaseHandle
            type="target"
            position={Position.Right}
            isConnectable={isConnectable}
            id="right"
          />
          <BaseHandle
            type="target"
            position={Position.Top}
            isConnectable={isConnectable}
            id="top"
          />
          <BaseHandle
            type="target"
            position={Position.Bottom}
            isConnectable={isConnectable}
            id="bottom"
          />

          {/* Top Toolbar - BlockMountToolbar (선택된 블럭에만 표시) */}
          {data.pageId &&
            data.workspaceId &&
            isCurrentBlockSelected &&
            isSingleSelection && (
              <BlockMountToolbar
                pageId={data.pageId}
                orgId={data.orgId}
                workspaceId={data.workspaceId}
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
