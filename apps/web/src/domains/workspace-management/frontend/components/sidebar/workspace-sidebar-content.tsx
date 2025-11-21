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
import { Plus, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { FavoritePageList } from './favorite-page-list';
import { WorkspacePageTree } from './workspace-page-tree';
import { PersonalWorkspacePageTree } from './personal-workspace-page-tree';
import { useWorkspace } from '../../hooks/use-workspace';
import { CreateWorkspaceDialog } from '../workspace/create-workspace-dialog';

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
              <WorkspacePageTree workspaces={generalWorkspaces} />
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
              <PersonalWorkspacePageTree workspaces={personalWorkspaces} />
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
