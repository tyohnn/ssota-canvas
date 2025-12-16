/**
 * WorkspaceHeader (Presentational)
 *
 * Container/Presentational 패턴 (v4.0.0)
 * - Props only (Context 제거)
 * - Storybook 테스트 가능
 */

'use client';

import React from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { CollapsibleTrigger } from '@/components/ui/collapsible';
import { WorkspaceIcon } from '@/domains/workspace-management/frontend/components/shared/icon-picker';
import { WorkspaceContextMenu } from './workspace-context-menu';
import type { WorkspaceItemState } from '../core/use-workspace-item';
import { cn } from '@/lib/utils';
import { Box } from '@/components/ui/box';

interface WorkspaceHeaderProps {
  workspaceItemState: WorkspaceItemState;
  onCreatePage?: () => void | Promise<void>;
}

/**
 * WorkspaceHeader
 *
 * Workspace 아이템의 헤더 부분
 */
export function WorkspaceHeader({
  workspaceItemState,
  onCreatePage,
}: WorkspaceHeaderProps) {
  const {
    workspace,
    isExpanded,
    isHovered,
    isMenuOrDialogOpen,
    setIsHovered,
    setIsMenuOrDialogOpen,
  } = workspaceItemState;

  // 페이지 추가 핸들러
  const handleCreatePage = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await onCreatePage?.();
  };

  return (
    <Box
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
          <Box className="relative w-4 h-4 shrink-0">
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
          </Box>

          {/* Workspace 이름 (라벨 스타일) */}
          <span className="truncate flex-1 text-left font-medium tracking-wide">
            {workspace.name}
          </span>
        </button>
      </CollapsibleTrigger>

      {/* 오른쪽 액션 버튼들 (아이템 호버 시 표시) */}
      <Box className="shrink-0 pr-2 flex items-center gap-0.5">
        {/* 삼점 메뉴 */}
        <WorkspaceContextMenu
          workspace={workspace}
          onOpenChange={setIsMenuOrDialogOpen}
          isParentHovered={isHovered}
          disableInvite={workspace.isPersonal}
        />

        {/* + 버튼 (페이지 추가) */}
        <Box
          className={cn(
            'h-4 w-4 p-0 flex items-center justify-center rounded-sm transition-all hover:bg-accent cursor-pointer',
            isHovered || isMenuOrDialogOpen ? 'opacity-100' : 'opacity-0'
          )}
          onClick={handleCreatePage}
          role="button"
          aria-label="Add page"
          tabIndex={-1}
        >
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
        </Box>
      </Box>
    </Box>
  );
}
