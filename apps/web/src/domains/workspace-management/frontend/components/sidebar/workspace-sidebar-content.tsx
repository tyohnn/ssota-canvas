'use client';

import React, { useState } from 'react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Plus } from 'lucide-react';
import { FavoritePageList } from './favorite-page-list';
import { WorkspacePageTree } from './workspace-page-tree';
import { useWorkspace } from '../../hooks/use-workspace';
import { CreateWorkspaceDialog } from '../workspace/create-workspace-dialog';

/**
 * Workspace Sidebar Content
 *
 * 조직 페이지 사이드바의 메인 콘텐츠
 * - 즐겨찾기 섹션 (최상단)
 * - Workspace 섹션 (Workspace-Page 트리)
 * - Suspense로 로딩 상태 처리
 */
export function WorkspaceSidebarContent() {
  const { favoritePages, workspaces } = useWorkspace();
  const [isWorkspaceGroupOpen, setIsWorkspaceGroupOpen] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <>
      {/* 즐겨찾기 섹션 */}
      {favoritePages.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Favorites</SidebarGroupLabel>
          <SidebarGroupContent>
            <FavoritePageList pages={favoritePages} />
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Workspace 섹션 */}
      <Collapsible
        open={isWorkspaceGroupOpen}
        onOpenChange={setIsWorkspaceGroupOpen}
      >
        <SidebarGroup>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <SidebarGroupLabel className="cursor-pointer">
                Workspaces
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <button
              onClick={e => {
                e.stopPropagation();
                setIsCreateDialogOpen(true);
              }}
              className="opacity-70 hover:opacity-100 transition-opacity p-1 -mr-1"
              title="새 워크스페이스"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <CollapsibleContent>
            <SidebarGroupContent>
              <WorkspacePageTree workspaces={workspaces} />
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      <CreateWorkspaceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </>
  );
}
