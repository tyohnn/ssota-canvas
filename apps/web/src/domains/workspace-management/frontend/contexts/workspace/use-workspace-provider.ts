'use client';

import { useEffect, useMemo, useState } from 'react';

import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';

import type {
  UseWorkspaceProviderParams,
  WorkspaceContextValue,
} from './types';

/**
 * 쿠키에서 값을 읽는 헬퍼 함수
 *
 * @param name - 쿠키 이름
 * @returns 쿠키 값 또는 null
 */
function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie.split(';');
  const cookie = cookies.find(c => c.trim().startsWith(`${name}=`));

  return cookie ? cookie.split('=')[1] || null : null;
}

/**
 * 최근 페이지 쿠키 키 생성
 *
 * @param organizationId - 조직 ID
 * @returns 쿠키 키
 */
function getRecentPageKey(organizationId: string): string {
  return `ssota-recent-page-${organizationId}`;
}

/**
 * PageTree에서 특정 페이지를 찾는 헬퍼 함수 (재귀)
 *
 * @param tree - 페이지 트리
 * @param pageId - 찾을 페이지 ID
 * @returns 페이지가 존재하면 true, 없으면 false
 */
function findPageInTree(
  tree: WorkspaceWithPagesDTO['pageTree'],
  pageId: string
): boolean {
  for (const node of tree) {
    if (node.id === pageId) return true;

    if (node.children && node.children.length > 0) {
      if (findPageInTree(node.children, pageId)) return true;
    }
  }

  return false;
}

/**
 * 초기 페이지 선택 로직
 *
 * 우선순위:
 * 1. initialSelectedPageId (URL 파라미터)
 * 2. 쿠키에서 복원한 최근 페이지
 * 3. Default Workspace의 첫 번째 페이지
 *
 * @param params - 초기화 파라미터
 * @returns 선택할 페이지 ID와 Workspace ID
 */
function getInitialPageSelection(
  params: UseWorkspaceProviderParams
): { pageId: string; workspaceId: string } | null {
  const { initialSelectedPageId, organizationId, initialWorkspaces } = params;

  // 1. URL 파라미터에서 페이지 ID 확인
  if (initialSelectedPageId) {
    const workspace = initialWorkspaces.find(ws =>
      findPageInTree(ws.pageTree, initialSelectedPageId)
    );

    if (workspace) {
      return {
        pageId: initialSelectedPageId,
        workspaceId: workspace.workspaceId,
      };
    }
  }

  // 2. 쿠키에서 최근 페이지 복원
  const recentPageKey = getRecentPageKey(organizationId);
  const recentPageId = getCookieValue(recentPageKey);

  if (recentPageId) {
    const pageExists = initialWorkspaces.some(ws =>
      findPageInTree(ws.pageTree, recentPageId)
    );

    if (pageExists) {
      const workspace = initialWorkspaces.find(ws =>
        findPageInTree(ws.pageTree, recentPageId)
      );

      if (workspace) {
        return {
          pageId: recentPageId,
          workspaceId: workspace.workspaceId,
        };
      }
    }
  }

  // 3. Fallback: Default Workspace의 첫 번째 페이지
  const defaultWorkspace = initialWorkspaces.find(ws => ws.isDefault);

  if (defaultWorkspace && defaultWorkspace.pageTree.length > 0) {
    const firstPage = defaultWorkspace.pageTree[0];

    if (firstPage) {
      return {
        pageId: firstPage.id,
        workspaceId: defaultWorkspace.workspaceId,
      };
    }
  }

  return null;
}

/**
 * useWorkspaceProvider
 *
 * Workspace Provider 내부에서 사용하는 hook
 * - 상태 관리 (workspaces, selectedPageId, selectedWorkspaceId)
 * - 초기화 로직 (쿠키 복원, 페이지 선택)
 *
 * @param params - 초기화 파라미터
 * @returns WorkspaceContextValue
 */
export function useWorkspaceProvider(
  params: UseWorkspaceProviderParams
): WorkspaceContextValue {
  const { organizationId, initialWorkspaces, initialSelectedPageId } = params;

  // Workspace 상태 관리
  const [workspaces, setWorkspaces] =
    useState<WorkspaceWithPagesDTO[]>(initialWorkspaces);

  // 전역 Page 선택 상태 (앱 전체에서 하나의 페이지만 선택)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    initialSelectedPageId || null
  );
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );

  // 초기화: 선택된 페이지 복원
  // 초기 마운트 시에만 실행 (의존성 배열 비워서 한 번만 실행)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const selection = getInitialPageSelection({
      organizationId,
      initialWorkspaces: workspaces,
      initialSelectedPageId,
    });

    if (selection) {
      setSelectedPageId(selection.pageId);
      setSelectedWorkspaceId(selection.workspaceId);
    }
  }, []);

  // Context 값 메모이제이션
  const contextValue = useMemo<WorkspaceContextValue>(
    () => ({
      organizationId,
      workspaces,
      setWorkspaces,
      selectedPageId,
      selectedWorkspaceId,
      setSelectedPageId,
      setSelectedWorkspaceId,
    }),
    [organizationId, workspaces, selectedPageId, selectedWorkspaceId]
  );

  return contextValue;
}
