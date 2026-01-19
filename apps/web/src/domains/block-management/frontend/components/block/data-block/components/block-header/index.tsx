/**
 * Block Header Component
 *
 * 블록 상단 좌측에 표시되는 제목 편집 영역
 * - 처음부터 인풋으로 렌더링 (테두리/링 없이)
 * - 블로그 작성기처럼 작성 가능
 */

'use client';

import React, { memo } from 'react';

import { BlockHeaderView } from './components/block-header-view';
import type { BlockHeaderBusinessLogic } from './core/types';
import type { BlockHeaderProps } from './core/types';
import { useBlockHeader } from './core/use-block-header';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

/**
 * Block Header Container Component
 *
 * This is a pure Container component that:
 * - Uses the hook to get all state and handlers
 * - Passes them as props to Presentational components
 */
export const BlockHeader = memo(function BlockHeader({
  data,
  selected,
  width,
  className,
  businessLogic,
}: BlockHeaderProps & {
  businessLogic?: BlockHeaderBusinessLogic;
}) {
  const {
    title,
    setTitle,
    inputRef,
    handleKeyDown,
    handleBlur,
    isUpdating,
    isVisible,
  } = useBlockHeader({ data, selected }, businessLogic);
  const { readonly } = useCanvasReadOnly();

  if (!isVisible) {
    return null;
  }

  return (
    <BlockHeaderView
      title={title}
      blockType={data.blockType}
      width={width}
      onTitleChange={setTitle}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      inputRef={inputRef}
      isUpdating={isUpdating}
      className={className}
      readonly={readonly}
    />
  );
});
