/**
 * Block Original Toolbar View Component
 *
 * Presentational component: 렌더링만 담당
 * - Props만 받음
 * - Hook 사용 없음
 * - Context 사용 없음
 * - Storybook에서 독립적으로 테스트 가능
 */

'use client';

import { ToolbarContainer } from '@workspace/ui/components/ssota-ui/toolbar-container';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';
import { Separator } from '@/components/ui/separator';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockType } from '@/domains/block-management/shared/types/block-types';
import type { BlockViewModeValue } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';

import {
  EditorToolbarButton,
  MoreMenuToolbarItem,
  ViewModeToolbarItem,
} from '../../common-toolbar-items';
import { BlockToolbarMapper } from './block-toolbar-mapper';

export interface BlockOriginalToolbarViewProps {
  blockId: string;
  blockMountId: string;
  blockType: BlockType;
  blockData: BlockNodeData;
  width?: number;
  height?: number;
  viewMode: BlockViewModeValue;
  zoom: number;
  pageId: string | undefined;
  toolbarRef: React.RefObject<HTMLDivElement | null>;
  onViewModeChange: (newViewMode: BlockViewModeValue) => Promise<void>;
  onDetails: () => void;
  readonly?: boolean;
}

/**
 * Block Original Toolbar View
 *
 * Presentational 컴포넌트 (렌더링만)
 */
export function BlockOriginalToolbarView({
  blockId,
  blockMountId,
  blockType,
  blockData,
  width,
  height,
  viewMode,
  zoom,
  pageId,
  toolbarRef,
  onViewModeChange,
  onDetails,
  readonly = false,
}: BlockOriginalToolbarViewProps) {
  return (
    <Box
      className={cn(
        'absolute top-[-50px] left-1/2 -translate-x-1/2 z-50',
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
          {/* 블럭 타입별 기본 속성 툴바 아이템 (좌측부터) */}
          <BlockToolbarMapper
            blockId={blockId}
            blockType={blockType}
            blockData={blockData}
            disabled={false}
            width={width}
            height={height}
            zoom={zoom}
            readonly={readonly}
          />
          {/* readonly일 때는 Separator 숨김 */}
          {!readonly && (
            <Separator orientation="vertical" className="h-6!" />
          )}
          {/* 보기 방식 변경 - readonly일 때 숨김 */}
          {!readonly && pageId && (
            <ViewModeToolbarItem
              blockType={blockData.blockType}
              currentViewMode={viewMode}
              onViewModeChange={onViewModeChange}
              zoom={zoom}
            />
          )}

          {/* Editor 버튼 */}
          <EditorToolbarButton
            onClick={onDetails}
            onMouseDown={e => e.stopPropagation()}
            className="h-7 gap-1 px-2 rounded-sm"
            iconClassName="size-3 shrink-0"
          />
          {/* 더보기 메뉴 - readonly일 때 Separator와 함께 숨김 */}
          {!readonly && (
            <>
              <Separator orientation="vertical" className="h-6!" />
              <MoreMenuToolbarItem
                blockId={blockId}
                blockMountId={blockMountId}
                width={width}
                height={height}
                parentBlockMountId={blockData.parentBlockMountId}
              />
            </>
          )}
        </TooltipProvider>
      </ToolbarContainer>
    </Box>
  );
}
