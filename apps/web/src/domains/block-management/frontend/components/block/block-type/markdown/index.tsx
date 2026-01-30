'use client';

import { memo } from 'react';

import type { NodeProps } from '@xyflow/react';

import type { MarkdownBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { DataBlock } from '../../data-block';
import { CardView } from '../../data-block/components/card-view';
import { NoteView } from '../../data-block/components/note-view';

/**
 * Markdown Block Component
 *
 * Note View, Original View, Card View를 지원하는 블록
 * - Note View: NoteView 컴포넌트에서 처리 (편집 로직 포함)
 * - Original View: NoteView와 동일한 뷰 (새 블록 생성 시 기본값)
 * - Card View: MarkdownCardView 컴포넌트에서 처리
 */
export const MarkdownBlock = memo(function MarkdownBlock({
  data,
  selected,
  draggable,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  // TypeScript 타입 안전성을 위한 데이터 접근
  if (!data) {
    console.error('MarkdownBlock: data is required');
    return null;
  }

  const nodeData = data as MarkdownBlockNodeData;

  // Dimensions
  const width = typeof nodeW === 'number' ? nodeW : 400;
  const height = typeof nodeH === 'number' ? nodeH : 300;

  // Original View 렌더러 (NoteView와 동일)
  const renderOriginalView = () => {
    return <NoteView data={nodeData} selected={selected} />;
  };

  // Card View 렌더러
  const renderCardView = () => {
    return <CardView data={nodeData} selected={selected} />;
  };

  return (
    <DataBlock
      data={nodeData}
      selected={selected}
      draggable={draggable}
      width={width}
      height={height}
      renderOriginalView={renderOriginalView}
      renderCardView={renderCardView}
    />
  );
});
