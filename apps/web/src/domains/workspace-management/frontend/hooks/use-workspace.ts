'use client';

import { useWorkspaceContext } from '../contexts/workspace/context';
import { useMemo, useCallback, useEffect } from 'react';
import type {
  WorkspaceWithPagesDTO,
  PageTreeNodeDTO,
} from '@/domains/workspace-management/shared/dtos';

/**
 * PageTree에서 특정 페이지 찾기 (헬퍼 함수)
 */
function findPageInTreeHelper(
  tree: PageTreeNodeDTO[],
  pageId: string
): PageTreeNodeDTO | null {
  for (const node of tree) {
    if (node.id === pageId) return node;
    if (node.children && node.children.length > 0) {
      const found = findPageInTreeHelper(node.children, pageId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * useWorkspace Hook
 *
 * WorkspaceContext를 래핑한 메인 Hook
 *
 * 전역 상태만 제공합니다.
 * 비즈니스 로직(생성/수정/삭제)은 각 다이얼로그 컴포넌트에서 직접 action을 호출합니다.
 */
export function useWorkspace() {
  const workspaceContext = useWorkspaceContext();

  // selectedWorkspaceId 초기화 로직
  useEffect(() => {
    // selectedPageId가 변경되면 해당 페이지가 속한 workspace 찾기
    if (
      workspaceContext.selectedPageId &&
      !workspaceContext.selectedWorkspaceId
    ) {
      for (const workspace of workspaceContext.workspaces) {
        const findInTree = (pages: any[]): boolean => {
          for (const page of pages) {
            if (page.id === workspaceContext.selectedPageId) return true;
            if (page.children && findInTree(page.children)) return true;
          }
          return false;
        };

        if (findInTree(workspace.pageTree)) {
          workspaceContext.setSelectedWorkspaceId(workspace.workspaceId);
          break;
        }
      }
    }
  }, [
    workspaceContext.selectedPageId,
    workspaceContext.selectedWorkspaceId,
    workspaceContext.workspaces,
    workspaceContext.setSelectedWorkspaceId,
  ]);

  // Page 선택 함수
  const selectPage = useCallback(
    (pageId: string, workspaceId: string) => {
      workspaceContext.setSelectedPageId(pageId);
      workspaceContext.setSelectedWorkspaceId(workspaceId);
    },
    [
      workspaceContext.setSelectedPageId,
      workspaceContext.setSelectedWorkspaceId,
    ]
  );

  // 계산된 속성: Default Workspace
  const defaultWorkspace = useMemo(() => {
    return workspaceContext.workspaces.find(ws => ws.isDefault) || null;
  }, [workspaceContext.workspaces]);

  // 페이지 찾기 유틸리티 (재귀)
  const findPageById = useCallback(
    (pageId: string): PageTreeNodeDTO | null => {
      for (const workspace of workspaceContext.workspaces) {
        const page = findPageInTreeHelper(workspace.pageTree, pageId);
        if (page) return page;
      }
      return null;
    },
    [workspaceContext.workspaces]
  );

  // Workspace ID로 Workspace 찾기
  const getWorkspaceByPage = useCallback(
    (pageId: string): WorkspaceWithPagesDTO | null => {
      for (const workspace of workspaceContext.workspaces) {
        const page = findPageInTreeHelper(workspace.pageTree, pageId);
        if (page) return workspace;
      }
      return null;
    },
    [workspaceContext.workspaces]
  );

  // 즐겨찾기 페이지 목록
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

    workspaceContext.workspaces.forEach(ws => {
      collectFavorites(ws.pageTree);
    });

    return favorites;
  }, [workspaceContext.workspaces]);

  // 계산된 속성: 선택된 Workspace
  const selectedWorkspace = useMemo(() => {
    if (!workspaceContext.selectedWorkspaceId) return null;
    return (
      workspaceContext.workspaces.find(
        ws => ws.workspaceId === workspaceContext.selectedWorkspaceId
      ) || null
    );
  }, [workspaceContext.workspaces, workspaceContext.selectedWorkspaceId]);

  // 계산된 속성: 선택된 Page
  const selectedPage = useMemo(() => {
    if (!workspaceContext.selectedPageId) return null;
    return findPageById(workspaceContext.selectedPageId);
  }, [workspaceContext.selectedPageId, findPageById]);

  return {
    // 기본 상태 (WorkspaceContext에서)
    organizationId: workspaceContext.organizationId,
    workspaces: workspaceContext.workspaces,
    setWorkspaces: workspaceContext.setWorkspaces,

    // 전역 Page 선택 상태 (WorkspaceContext에서)
    selectedPageId: workspaceContext.selectedPageId,
    selectedWorkspaceId: workspaceContext.selectedWorkspaceId,
    selectPage,

    // 계산된 속성
    selectedPage,
    selectedWorkspace,
    defaultWorkspace,
    favoritePages,

    // 유틸리티
    findPageById,
    getWorkspaceByPage,
  };
}
