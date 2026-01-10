/**
 * Block Original Toolbar - Entry Point
 *
 * Container Component: Hook → Props 변환
 */

'use client';

import { BlockOriginalToolbarView } from './components/block-original-toolbar-view';
import type { BlockOriginalToolbarProps } from './core/types';
import { useBlockOriginalToolbar } from './core/use-block-original-toolbar';

/**
 * BlockOriginalToolbar Component
 *
 * 선택된 블럭에 대한 편집 도구를 제공하는 툴바 컴포넌트
 * viewMode가 original일 때만 표시됩니다.
 *
 * Features:
 * - 선택된 블럭 위에 표시되는 컨텍스트 툴바
 * - Details 버튼: 에디터 패널 열기/닫기
 * - 더보기 메뉴: Edit, Duplicate, Create Component, Delete
 * - 블럭 타입별 추가 옵션들
 *
 * 렌더링 조건: isSingleSelectionMode() === true && isSelected(blockId) && viewMode === 'original'
 */
export function BlockOriginalToolbar(props: BlockOriginalToolbarProps) {
  const { uiState, business } = useBlockOriginalToolbar(props);

  return (
    <BlockOriginalToolbarView
      {...props}
      viewMode={business.viewMode}
      zoom={business.zoom}
      pageId={business.pageId}
      toolbarRef={uiState.toolbarRef}
      onViewModeChange={business.handleViewModeChange}
      onDetails={business.handleDetails}
    />
  );
}

// Export types
export type { BlockOriginalToolbarProps } from './core/types';
