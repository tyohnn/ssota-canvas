/**
 * PageTree (v4.0.0)
 *
 * Container/Presentational 패턴 적용
 * - Context/Provider 제거
 * - Hook → Props 전달
 * - Storybook 테스트 가능
 * - 전역 상태와 독립적으로 동작
 */

'use client';

import React from 'react';
import { AssistiveTreeDescription } from '@headless-tree/react';
import { Tree, TreeDragLine } from '@workspace/ui/components/ui/tree';
import type { PageTreeProps } from './core/types';
import { usePageTree } from './core/use-page-tree';
import { PageTreeItemRenderer } from './components/page-tree-item';

/**
 * PageTree Component
 *
 * Props 기반 독립 컴포넌트
 * - 내부: selectedPageId, expandedPageIds 로컬 상태 관리
 * - 외부: onSelectPage, onPagesUpdate 콜백으로 알림
 * - 초기값: initialSelectedPageId props로 받기
 */
export function PageTree({
  workspaceId,
  pages,
  organizationId,
  initialSelectedPageId,
  onSelectPage,
  onPagesUpdate,
  enableDragDrop = false,
  indent = 20,
}: PageTreeProps) {
  // Container: Hook으로 모든 로직 통합
  const pageTreeState = usePageTree({
    workspaceId,
    pages,
    organizationId,
    initialSelectedPageId,
    onSelectPage,
    onPagesUpdate,
    enableDragDrop,
    indent,
  });

  const { tree, rootPageIds, selectedPageId, togglePage } = pageTreeState;

  // 빈 페이지 트리 처리
  if (rootPageIds.length === 0) {
    return null;
  }

  // Tree 렌더링
  const treeItems = tree.getItems();

  return (
    <Tree tree={tree} className="text-xs pl-2 relative" indent={indent}>
      <AssistiveTreeDescription tree={tree} />
      <TreeDragLine />
      {treeItems.map(item => (
        <PageTreeItemRenderer
          key={item.getId()}
          item={item}
          onToggle={togglePage}
          selectedPageId={selectedPageId}
          pageTreeState={pageTreeState}
        />
      ))}
    </Tree>
  );
}
