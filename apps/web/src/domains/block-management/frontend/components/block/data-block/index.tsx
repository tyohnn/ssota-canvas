/**
 * DataBlock Component
 *
 * 여러 View Mode를 지원하는 블록의 기본 컴포넌트
 * - Note View: content를 마크다운으로 표시
 * - Original View: 블록 고유의 UI
 * - Card View: 속성 중심 카드 형태
 */

'use client';

import { memo } from 'react';

import { BaseBlock } from '../base-block';
import { DataBlockView } from './components/data-block-view';
import type { DataBlockProps } from './core/types';
import { useDataBlock } from './core/use-data-block';

export const DataBlock = memo(function DataBlock(props: DataBlockProps) {
  const {
    data,
    selected = false,
    draggable,
    width,
    height,
    renderOriginalView,
    renderCardView,
  } = props;

  const {
    viewMode,
    isSingleSelection,
    onViewModeChange,
    zoom,
    isMultiSelection,
    onEdit,
  } = useDataBlock(props);

  return (
    <BaseBlock
      data={data}
      selected={selected}
      draggable={draggable}
      width={width}
      height={height}
      toolbarProps={{
        viewMode,
        onViewModeChange,
        zoom,
        isMultiSelection,
        onEdit,
        showBlockToolbarMapper: viewMode === 'original',
      }}
    >
      {/* children에는 DataBlockView만 전달 */}
      <DataBlockView
        data={data}
        viewMode={viewMode}
        renderOriginalView={renderOriginalView}
        renderCardView={renderCardView}
        selected={selected}
      />
    </BaseBlock>
  );
});
