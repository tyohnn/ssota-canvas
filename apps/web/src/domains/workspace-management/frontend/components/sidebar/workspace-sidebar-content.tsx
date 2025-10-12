'use client';

import React from 'react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import { FavoritePageList } from './favorite-page-list';
import { WorkspacePageTree } from './workspace-page-tree';
import { useWorkspace } from '../../hooks/use-workspace';

/**
 * Workspace Sidebar Content
 *
 * 조직 페이지 사이드바의 메인 콘텐츠
 * - 즐겨찾기 섹션 (최상단)
 * - Workspace 섹션 (Workspace-Page 트리)
 */
export function WorkspaceSidebarContent() {
  const { favoritePages, workspaces } = useWorkspace();

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
      <SidebarGroup>
        <SidebarGroupLabel>Workspaces</SidebarGroupLabel>
        <SidebarGroupContent>
          <WorkspacePageTree workspaces={workspaces} />
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
