'use client';

import { useWorkspaceContext } from '../contexts/workspace-context';
import { useMemo, useCallback } from 'react';
import type {
  WorkspaceWithPagesDTO,
  PageTreeNodeDTO,
} from '@/domains/workspace-management/shared/dtos';

/**
 * useWorkspace Hook
 *
 * WorkspaceContext를 사용하기 쉽게 추상화한 메인 Hook
 */
export function useWorkspace() {
  const context = useWorkspaceContext();

  // 페이지 찾기 유틸리티 (재귀)
  const findPageById = useCallback(
    (pageId: string): PageTreeNodeDTO | null => {
      const findInTree = (
        tree: PageTreeNodeDTO[],
        id: string
      ): PageTreeNodeDTO | null => {
        for (const node of tree) {
          if (node.id === id) return node;
          if (node.children && node.children.length > 0) {
            const found = findInTree(node.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      for (const workspace of context.workspaces) {
        const page = findInTree(workspace.pageTree, pageId);
        if (page) return page;
      }
      return null;
    },
    [context.workspaces]
  );

  // Workspace ID로 Workspace 찾기
  const getWorkspaceByPage = useCallback(
    (pageId: string): WorkspaceWithPagesDTO | null => {
      const findInTree = (tree: PageTreeNodeDTO[], id: string): boolean => {
        for (const node of tree) {
          if (node.id === id) return true;
          if (node.children && node.children.length > 0) {
            if (findInTree(node.children, id)) return true;
          }
        }
        return false;
      };

      for (const workspace of context.workspaces) {
        if (findInTree(workspace.pageTree, pageId)) {
          return workspace;
        }
      }
      return null;
    },
    [context.workspaces]
  );

  // Workspace 펼치기/접기 확인
  const isWorkspaceExpanded = useCallback(
    (workspaceId: string): boolean => {
      return context.expandedWorkspaces.has(workspaceId);
    },
    [context.expandedWorkspaces]
  );

  // Page 펼치기/접기 확인
  const isPageExpanded = useCallback(
    (pageId: string): boolean => {
      return context.expandedPages.has(pageId);
    },
    [context.expandedPages]
  );

  // 권한: Workspace 생성 가능 여부 (조직 소유자만)
  const canCreateWorkspace = useCallback((): boolean => {
    // TODO: userRole prop 추가 필요
    return true; // 임시로 true 반환
  }, []);

  // 권한: 멤버 초대 가능 여부
  const canInviteMembers = useCallback((workspaceId: string): boolean => {
    // TODO: 권한 검증 로직
    return true;
  }, []);

  // 권한: 페이지 편집 가능 여부
  const canEditPage = useCallback((pageId: string): boolean => {
    // TODO: 권한 검증 로직
    return true;
  }, []);

  // 즐겨찾기 페이지 목록 (Scenario 5)
  const favoritePages = useMemo(() => {
    const favorites: PageTreeNodeDTO[] = [];

    const collectFavorites = (tree: PageTreeNodeDTO[]) => {
      for (const node of tree) {
        if (node.isFavorite) {
          favorites.push(node);
        }
        if (node.children && node.children.length > 0) {
          collectFavorites(node.children);
        }
      }
    };

    context.workspaces.forEach(ws => {
      collectFavorites(ws.pageTree);
    });

    return favorites;
  }, [context.workspaces]);

  return {
    // 기본 상태
    organizationId: context.organizationId,
    workspaces: context.workspaces,
    selectedPageId: context.selectedPageId,
    selectedWorkspaceId: context.selectedWorkspaceId,
    expandedWorkspaces: context.expandedWorkspaces,
    expandedPages: context.expandedPages,
    isLoading: context.isLoading,
    error: context.error,

    // Actions (Scenario 1)
    selectPage: context.selectPage,
    toggleWorkspace: context.toggleWorkspace,
    togglePage: context.togglePage,

    // Actions (Scenario 2)
    createWorkspace: context.createWorkspace,
    updateWorkspaceInfo: context.updateWorkspaceInfo,

    // Actions (Scenario 3)
    inviteMembers: context.inviteMembers,
    searchOrganizationMembers: context.searchOrganizationMembers,
    acceptInvitation: context.acceptInvitation,
    rejectInvitation: context.rejectInvitation,
    getWorkspaceMembers: context.getWorkspaceMembers,

    // Actions (Scenario 4)
    createPage: context.createPage,
    movePage: context.movePage,
    updatePageInfo: context.updatePageInfo,
    reorderPages: context.reorderPages,

    // 계산된 속성
    selectedPage: context.selectedPage,
    selectedWorkspace: context.selectedWorkspace,
    defaultWorkspace: context.defaultWorkspace,
    favoritePages,

    // 유틸리티
    findPageById,
    getWorkspaceByPage,
    isWorkspaceExpanded,
    isPageExpanded,
    canCreateWorkspace,
    canInviteMembers,
    canEditPage,
  };
}
