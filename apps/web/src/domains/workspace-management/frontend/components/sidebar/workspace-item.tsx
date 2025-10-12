'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
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
 * - 헤더: Chevron + 아이콘 + 이름 + 배지 + 컨텍스트 메뉴
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
      <div className="group flex items-center justify-between w-full hover:bg-accent rounded-md transition-colors">
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1.5 px-2 py-1.5 rounded-md text-sm flex-1 min-w-0'
            )}
          >
            {/* Chevron */}
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 transition-transform',
                !isExpanded && '-rotate-90'
              )}
            />

            {/* Workspace 아이콘 */}
            <WorkspaceIcon
              icon={workspace.icon}
              size={16}
              className="shrink-0"
            />

            {/* Workspace 이름 */}
            <span className="truncate flex-1 text-left font-medium">
              {workspace.name}
            </span>

            {/* 기본 배지 (Default Workspace) */}
            {workspace.isDefault && (
              <Badge variant="secondary" className="text-xs shrink-0">
                기본
              </Badge>
            )}
          </button>
        </CollapsibleTrigger>

        {/* 삼점 메뉴 (호버 시 표시) */}
        <div className="shrink-0 pr-2">
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
