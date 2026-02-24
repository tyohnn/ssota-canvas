/**
 * Note View Title Component
 *
 * 블록 제목을 문서 h1 스타일로 표시·편집
 * - useBlockHeader 로직 재사용
 * - Editor panel TitleInput과 동일한 시각적 느낌
 * - 타이핑 중 즉시 React Flow 노드 갱신 (BlockHeader 툴바와 동기화)
 */

'use client';

import { memo, useCallback } from 'react';

import { useReactFlow } from '@xyflow/react';

import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

import { useBlockHeader } from '@/domains/block-management/frontend/components/block/data-block/components/block-header/core/use-block-header';
import { NoteViewTitleView } from './note-view-title.view';

export interface NoteViewTitleProps {
  data: BlockNodeData;
  selected: boolean;
  readonly?: boolean;
}

export const NoteViewTitle = memo(function NoteViewTitle({
  data,
  selected,
  readonly = false,
}: NoteViewTitleProps) {
  const { getNode, updateNode } = useReactFlow();
  const {
    title,
    setTitle,
    inputRef,
    handleKeyDown,
    handleBlur,
    isUpdating,
  } = useBlockHeader({ data, selected });
  const { readonly: canvasReadOnly } = useCanvasReadOnly();

  const isReadOnly = readonly || canvasReadOnly || !selected;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      // Optimistic update: 툴바 BlockHeader에 즉시 반영
      const nodeId = data.blockMountId;
      const node = getNode(nodeId);
      const currentData = (node?.data as BlockNodeData) || data;
      updateNode(nodeId, { data: { ...currentData, title: newTitle } });
    },
    [data, getNode, setTitle, updateNode]
  );

  return (
    <NoteViewTitleView
      value={title}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      readOnly={isReadOnly || isUpdating}
      inputRef={inputRef}
      interactive={selected}
    />
  );
});
