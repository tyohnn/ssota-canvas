'use client';

import React from 'react';
import { ChevronDown, Folder } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { WorkspaceWithPagesDTO } from '../../../shared/dtos';
import { useWorkspace } from '../../contexts/workspace-context';
import { PageTree } from '../page-tree/page-tree';
import { cn } from '@/lib/utils';

interface WorkspaceItemProps {
  workspace: WorkspaceWithPagesDTO;
}

/**
 * Workspace Item
 *
 * 개별 Workspace 렌더링 (Collapsible)
 * - 헤더: Workspace 이름 + 아이콘 + Chevron
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
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
            'hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              !isExpanded && '-rotate-90'
            )}
          />
          {workspace.icon ? (
            <span className="text-base">{workspace.icon}</span>
          ) : (
            <Folder className="h-4 w-4" />
          )}
          <span className="truncate flex-1 text-left">{workspace.name}</span>
          <span className="text-xs text-muted-foreground">
            {workspace.pageCount}
          </span>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {workspace.pageTree.length === 0 ? (
          <div className="px-8 py-2 text-xs text-muted-foreground">
            No pages yet
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
