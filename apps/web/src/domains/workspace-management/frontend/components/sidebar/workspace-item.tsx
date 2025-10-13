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
  const [isMenuOrDialogOpen, setIsMenuOrDialogOpen] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={() => toggleWorkspace(workspace.workspaceId)}
    >
      {/* Workspace 헤더 */}
      <div
        className={cn(
          'group flex items-center justify-between w-full rounded-sm transition-colors',
          isMenuOrDialogOpen ? 'bg-accent/70' : 'hover:bg-accent/70'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CollapsibleTrigger asChild>
          <button
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-sm text-sm flex-1 min-w-0 text-muted-foreground transition-colors'
            )}
          >
            {/* 아이콘/Chevron 컨테이너 (고정 너비로 레이아웃 틀어짐 방지) */}
            <div className="relative w-4 h-4 shrink-0">
              {/* Workspace 아이콘 (기본 표시, 아이템 호버 또는 메뉴 열림 시 숨김) */}
              <WorkspaceIcon
                icon={workspace.icon}
                size={16}
                className={cn(
                  'absolute inset-0 transition-opacity',
                  isHovered || isMenuOrDialogOpen ? 'opacity-0' : 'opacity-100'
                )}
              />

              {/* Chevron (기본 숨김, 아이템 호버 또는 메뉴 열림 시 표시) */}
              <ChevronDown
                className={cn(
                  'absolute inset-0 w-full h-full transition-all',
                  isHovered || isMenuOrDialogOpen ? 'opacity-100' : 'opacity-0',
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

        {/* 삼점 메뉴 (아이템 호버 시 표시) */}
        <div className="shrink-0 pr-2">
          <WorkspaceContextMenu
            workspace={workspace}
            onOpenChange={setIsMenuOrDialogOpen}
            isParentHovered={isHovered}
          />
        </div>
      </div>

      {/* Workspace 콘텐츠 (페이지 트리) */}
      <CollapsibleContent>
        {workspace.pageTree.length === 0 ? (
          <div className="px-8 py-2 text-sm text-muted-foreground">
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
            enableDragDrop={true} // Scenario 4: 드래그앤드롭 활성화
            indent={8}
          />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
