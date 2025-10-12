'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { WorkspaceWithPagesDTO } from '../../../shared/dtos';
import { useWorkspace } from '../../hooks/use-workspace';
import { PageTree } from '../page-tree/page-tree';
import { WorkspaceIcon } from '../shared/icon-picker';
import { WorkspaceContextMenu } from '../workspace/workspace-context-menu';
import { cn } from '@/lib/utils';

interface WorkspaceItemProps {
  workspace: WorkspaceWithPagesDTO;
}

/**
 * Workspace Item
 *
 * 개별 Workspace 렌더링 (Collapsible)
 * - 헤더: Chevron + 이름 (라벨 스타일) + 컨텍스트 메뉴 (호버 시)
 * - 콘텐츠: PageTree 컴포넌트
 */
export function WorkspaceItem({ workspace }: WorkspaceItemProps) {
  const {
    expandedWorkspaces,
    expandedPages,
    selectedPageId,
    toggleWorkspace,
    togglePage,
    selectPage,
  } = useWorkspace();

  const isExpanded = expandedWorkspaces.has(workspace.workspaceId);

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={() => toggleWorkspace(workspace.workspaceId)}
    >
      {/* Workspace 헤더 */}
      <div className="group flex items-center justify-between w-full hover:bg-accent/50 rounded-md transition-colors">
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'group/button flex items-center gap-1.5 px-2 py-1 rounded-md text-xs flex-1 min-w-0 text-muted-foreground hover:text-foreground transition-colors'
            )}
          >
            {/* 아이콘/Chevron 컨테이너 (고정 너비로 레이아웃 틀어짐 방지) */}
            <div className="relative w-[14px] h-[14px] shrink-0">
              {/* Workspace 아이콘 (기본 표시, 버튼 호버 시 숨김) */}
              <WorkspaceIcon
                icon={workspace.icon}
                size={14}
                className="absolute inset-0 transition-opacity group-hover/button:opacity-0"
              />

              {/* Chevron (기본 숨김, 버튼 호버 시 표시) */}
              <ChevronDown
                className={cn(
                  'absolute inset-0 w-full h-full transition-all opacity-0 group-hover/button:opacity-100',
                  !isExpanded && '-rotate-90'
                )}
              />
            </div>

            {/* Workspace 이름 (라벨 스타일) */}
            <span className="truncate flex-1 text-left font-medium tracking-wide">
              {workspace.name}
            </span>
          </button>
        </CollapsibleTrigger>

        {/* 삼점 메뉴 (호버 시 표시) */}
        <div className="shrink-0 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <WorkspaceContextMenu workspace={workspace} />
        </div>
      </div>

      {/* Workspace 콘텐츠 (페이지 트리) */}
      <CollapsibleContent>
        {workspace.pageTree.length === 0 ? (
          <div className="px-8 py-2 text-xs text-muted-foreground">
            페이지를 생성하세요
          </div>
        ) : (
          <PageTree
            workspaceId={workspace.workspaceId}
            pages={workspace.pageTree}
            selectedPageId={selectedPageId}
            expandedPageIds={Array.from(expandedPages)}
            onSelectPage={pageId => selectPage(pageId, workspace.workspaceId)}
            onTogglePage={togglePage}
            enableDragDrop={false} // Scenario 1에서는 false
            indent={16}
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
