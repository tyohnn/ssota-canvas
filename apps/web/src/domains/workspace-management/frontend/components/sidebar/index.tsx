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
import { FavoritePageList } from './components/favorite-page-list';
import { WorkspaceItem } from './components/workspace-item';
import { useWorkspace } from '../../hooks/use-workspace';
import { CreateWorkspaceDialog } from './components/create-workspace-dialog';

/**
 * Workspace Sidebar Content
 *
 * 조직 페이지 사이드바의 메인 콘텐츠
 * - 섹션 1: 즐겨찾기 (최상단)
 * - 섹션 2: Workspaces (Default + 일반 워크스페이스)
 * - 섹션 3: Personal Workspaces (개인 워크스페이스)
 */
export function WorkspaceSidebarContent() {
  const { favoritePages, workspaces } = useWorkspace();
  const [isWorkspaceGroupOpen, setIsWorkspaceGroupOpen] = useState(true);
  const [isPersonalGroupOpen, setIsPersonalGroupOpen] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // 워크스페이스 필터링
  const generalWorkspaces = workspaces.filter(ws => !ws.isPersonal);
  const personalWorkspaces = workspaces.filter(ws => ws.isPersonal);

  return (
    <>
      {/* 섹션 1: 즐겨찾기 */}
      {favoritePages.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Favorites</SidebarGroupLabel>
          <SidebarGroupContent>
            <FavoritePageList pages={favoritePages} />
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* 섹션 2: Workspaces (Default + 일반) */}
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
              title="New Workspace"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <CollapsibleContent>
            <SidebarGroupContent>
              {generalWorkspaces.length === 0 ? (
                <div className="px-2 text-xs text-muted-foreground">
                  No workspaces found
                </div>
              ) : (
                generalWorkspaces.map(workspace => (
                  <WorkspaceItem
                    key={workspace.workspaceId}
                    workspace={workspace}
                  />
                ))
              )}
            </SidebarGroupContent>
          </CollapsibleContent>
        </SidebarGroup>
      </Collapsible>

      {/* 섹션 3: Personal Workspaces (개인 워크스페이스) */}
      <Collapsible
        open={isPersonalGroupOpen}
        onOpenChange={setIsPersonalGroupOpen}
      >
        <SidebarGroup>
          <CollapsibleTrigger asChild>
            <SidebarGroupLabel className="cursor-pointer">
              Personal Workspace
            </SidebarGroupLabel>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarGroupContent>
              {personalWorkspaces.length === 0 ? (
                <div className="px-2 text-xs text-muted-foreground">
                  No personal workspaces found
                </div>
              ) : (
                personalWorkspaces.map(workspace => (
                  <WorkspaceItem
                    key={workspace.workspaceId}
                    workspace={workspace}
                  />
                ))
              )}
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
