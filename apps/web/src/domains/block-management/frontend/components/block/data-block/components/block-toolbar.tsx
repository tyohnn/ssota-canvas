/**
 * Block Toolbar Component
 *
 * 블록 상단에 표시되는 통합 툴바 (모든 view mode에서 사용)
 * - 좌측: BlockHeader (제목 + Badge)
 * - 우측: Toolbar buttons (ViewMode + Details + BlockToolbarMapper)
 */

'use client';

import { Separator } from '@/components/ui/separator';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { BlockViewModeValue } from '@/domains/canvas-management/shared/value-objects/block-view-mode.vo';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import { GroupBlockToolbar } from './group-block-toolbar';
import { BlockHeader } from './block-header';
import {
  EditorToolbarButton,
  ViewModeToolbarItem,
} from '../../common-toolbar-items';
import { BlockToolbarMapper } from '../../block-original-toolbar/components/block-toolbar-mapper';
import { BlockToolbarView } from './block-toolbar.view';

export interface BlockToolbarProps {
  data: BlockNodeData;
  selected: boolean;
  viewMode: BlockViewModeValue;
  onViewModeChange?: (viewMode: BlockViewModeValue) => void;
  width?: number;
  height?: number;
  className?: string;
  zoom: number;
  isMultiSelection: boolean;
  onEdit: () => void;
  showBlockToolbarMapper?: boolean;
}

export function BlockToolbar({
  data,
  selected,
  viewMode,
  onViewModeChange,
  width,
  height,
  className,
  zoom,
  isMultiSelection,
  onEdit,
  showBlockToolbarMapper = false,
}: BlockToolbarProps) {
  const { readonly } = useCanvasReadOnly();

  // 렌더링 조건 체크
  if (!selected) {
    return null;
  }

  // 멀티셀렉트일 때는 표시하지 않음
  if (isMultiSelection) {
    return null;
  }

  // zoom이 60% 이하일 때는 표시하지 않음
  // if (zoom <= 0.6) {
  //   return null;
  // }

  // 그룹 블록: 전용 툴바 레이아웃 (좌측 제목만, 중앙 툴바, 배지 없음)
  if (data.blockType === 'group') {
    return (
      <GroupBlockToolbar
        data={data}
        selected={selected}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        width={width}
        height={height}
        className={className}
        zoom={zoom}
        isMultiSelection={isMultiSelection}
        showBlockToolbarMapper={showBlockToolbarMapper}
      />
    );
  }

  // 도형 블록: 도형·색상만 표시 (제목, 배지, view mode, details, more 메뉴 없음)
  const isShapeBlock = data.blockType === 'shape';

  const headerContent = isShapeBlock ? null : (
    <BlockHeader
      data={data}
      selected={selected}
      width={width}
    />
  );

  const toolbarItems = isShapeBlock ? (
    /* 도형 블록: BlockToolbarMapper + Separator + Details + More */
    <>
      {showBlockToolbarMapper && (
        <BlockToolbarMapper
          blockId={data.blockId}
          blockType={data.blockType || 'basic'}
          blockData={data}
          width={width}
          height={height}
          zoom={zoom}
          readonly={readonly}
        />
      )}
      <Separator orientation="vertical" className="h-4!" />
      <EditorToolbarButton
        onClick={() => onEdit()}
        onMouseDown={e => e.stopPropagation()}
      />
    </>
  ) : (
    <>
      {/* Original view: BlockToolbarMapper */}
      {showBlockToolbarMapper && (
        <>
          <BlockToolbarMapper
            blockId={data.blockId}
            blockType={data.blockType || 'basic'}
            blockData={data}
            width={width}
            height={height}
            zoom={zoom}
            readonly={readonly}
          />
          {!readonly && (
            <Separator orientation="vertical" className="h-4!" />
          )}
        </>
      )}

      {/* 보기 방식 변경 - readonly일 때 숨김 */}
      {!readonly && onViewModeChange && (
        <ViewModeToolbarItem
          blockType={data.blockType}
          currentViewMode={viewMode}
          onViewModeChange={onViewModeChange}
          zoom={zoom}
        />
      )}

      {/* 에디터 열기 */}
      <EditorToolbarButton
        onClick={() => onEdit()}
        onMouseDown={e => e.stopPropagation()}
      />
    </>
  );

  return (
    <BlockToolbarView
      className={className}
      headerContent={headerContent}
      toolbarItems={toolbarItems}
      hideHeader={isShapeBlock}
      hideToolbarContainer={isShapeBlock}
    />
  );
}
