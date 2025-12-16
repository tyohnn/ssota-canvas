/**
 * WorkspaceItem (v4.0.0)
 *
 * Container/Presentational 패턴 적용
 * - Context/Provider 제거
 * - Hook → Props 전달
 * - Storybook 테스트 가능
 */

'use client';

import React from 'react';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { AssistiveTreeDescription } from '@headless-tree/react';
import { Tree, TreeDragLine } from '@workspace/ui/components/ui/tree';
import type {
  WorkspaceWithPagesDTO,
  PageTreeNodeDTO,
} from '@/domains/workspace-management/shared/dtos';
import { useWorkspace } from '@/domains/workspace-management/frontend/hooks/use-workspace';
import { useWorkspaceItem } from './core/use-workspace-item';
import { WorkspaceHeader } from './components/workspace-header';
import { usePageTree } from './components/page-tree/core/use-page-tree';
import { PageTreeItemRenderer } from './components/page-tree/components/page-tree-item';

interface WorkspaceItemProps {
  workspace: WorkspaceWithPagesDTO;
}

/**
 * WorkspaceItem Component
 *
 * 개별 Workspace 렌더링 (Collapsible)
 * - 헤더: Chevron + 이름 (라벨 스타일) + 컨텍스트 메뉴 (호버 시)
 * - 콘텐츠: PageTree 컴포넌트 (Container/Presentational 패턴)
 */
export function WorkspaceItem({ workspace }: WorkspaceItemProps) {
  const {
    organizationId,
    selectedPageId,
    selectedWorkspaceId,
    selectPage,
    setWorkspaces,
  } = useWorkspace();

  // Container: Hook으로 모든 로직 통합
  const workspaceItemState = useWorkspaceItem({
    workspace,
    organizationId,
  });

  const {
    workspace: localWorkspace,
    isExpanded,
    toggleExpand,
    updatePages,
  } = workspaceItemState;

  // 로컬 + 전역 동시 업데이트 함수
  const handlePagesUpdate = React.useCallback(
    (updatedPages: PageTreeNodeDTO[]) => {
      // 1. 로컬 상태 업데이트
      updatePages(updatedPages);

      // 2. 전역 상태도 함께 업데이트
      setWorkspaces(prev =>
        prev.map(ws =>
          ws.workspaceId === localWorkspace.workspaceId
            ? { ...ws, pageTree: updatedPages }
            : ws
        )
      );
    },
    [localWorkspace.workspaceId, updatePages, setWorkspaces]
  );

  // PageTree Hook - createPage 함수를 얻기 위해 여기서 호출
  const pageTreeState = usePageTree({
    workspaceId: localWorkspace.workspaceId,
    pages: localWorkspace.pageTree,
    organizationId,
    initialSelectedPageId:
      selectedWorkspaceId === localWorkspace.workspaceId
        ? selectedPageId
        : null,
    onSelectPage: pageId => selectPage(pageId, localWorkspace.workspaceId),
    onPagesUpdate: handlePagesUpdate,
    enableDragDrop: true,
    indent: 8,
  });

  const {
    tree,
    rootPageIds,
    selectedPageId: treeSelectedPageId,
    togglePage,
    createPage,
  } = pageTreeState;

  // 페이지 생성 핸들러 (WorkspaceHeader에서 사용)
  const handleCreatePage = React.useCallback(async () => {
    await createPage(localWorkspace.workspaceId);
  }, [createPage, localWorkspace.workspaceId]);

  return (
    <Collapsible open={isExpanded} onOpenChange={toggleExpand}>
      <WorkspaceHeader
        workspaceItemState={workspaceItemState}
        onCreatePage={handleCreatePage}
      />
      <CollapsibleContent>
        {rootPageIds.length === 0 ? (
          <div className="px-8 py-2 text-sm text-muted-foreground">
            No pages yet
          </div>
        ) : (
          <Tree tree={tree} className="text-xs pl-2 relative" indent={8}>
            <AssistiveTreeDescription tree={tree} />
            <TreeDragLine />
            {tree.getItems().map(item => (
              <PageTreeItemRenderer
                key={item.getId()}
                item={item}
                onToggle={togglePage}
                selectedPageId={treeSelectedPageId}
                pageTreeState={pageTreeState}
              />
            ))}
          </Tree>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
