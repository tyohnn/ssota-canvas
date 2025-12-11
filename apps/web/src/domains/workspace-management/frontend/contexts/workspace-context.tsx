'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@workspace/ui/components/ui/sonner';
import {
  type WorkspaceWithPagesDTO,
  type PageTreeNodeDTO,
  type CreateWorkspaceRequest,
  type UpdateWorkspaceInfoRequest,
  type CreateWorkspaceResponse,
  type InviteWorkspaceMemberRequest,
  type InviteWorkspaceMemberResponse,
  type ProcessInvitationRequest,
  type SearchOrganizationMembersRequest,
  type OrganizationMemberSearchResultDTO,
  type GetWorkspaceMembersRequest,
  type WorkspaceMemberView,
  type CreatePageRequest,
  type MovePageRequest,
  type UpdatePageInfoRequest,
} from '@/domains/workspace-management/shared/dtos';
import {
  createWorkspaceAction,
  updateWorkspaceInfoAction,
} from '@/domains/workspace-management/actions/workspace.actions';
import {
  inviteWorkspaceMemberAction,
  searchOrganizationMembersAction,
  acceptWorkspaceInvitationAction,
  rejectWorkspaceInvitationAction,
  getWorkspaceMembersAction,
} from '@/domains/workspace-management/actions/workspace-member.actions';
import {
  createPageAction,
  movePageAction,
  updatePageInfoAction,
  reorderPagesAction,
  deletePageAction,
  duplicatePageAction,
} from '@/domains/workspace-management/actions/page.actions';
import { generateTempPageId } from '@/domains/workspace-management/shared/utils/temp-page-id.utils';

/**
 * WorkspaceContext 타입 정의
 */
interface WorkspaceContextValue {
  // 기본 상태
  organizationId: string;
  workspaces: WorkspaceWithPagesDTO[];
  selectedPageId: string | null;
  selectedWorkspaceId: string | null;
  expandedWorkspaces: Set<string>;
  expandedPages: Set<string>;
  isLoading: boolean;
  error: string | null;

  // Scenario 1: 페이지 선택 및 토글
  selectPage: (
    pageId: string,
    workspaceId: string,
    skipNavigation?: boolean
  ) => void;
  toggleWorkspace: (workspaceId: string) => void;
  togglePage: (pageId: string) => void;

  // Scenario 2: Workspace 생성 및 수정
  createWorkspace: (
    request: Omit<CreateWorkspaceRequest, 'organizationId'>
  ) => Promise<CreateWorkspaceResponse | null>;
  updateWorkspaceInfo: (
    request: UpdateWorkspaceInfoRequest
  ) => Promise<boolean>;

  // Scenario 3: Workspace 멤버 초대 및 수락/거절
  inviteMembers: (
    workspaceId: string,
    emails: string[]
  ) => Promise<number | null>;
  searchOrganizationMembers: (
    workspaceId: string,
    query: string
  ) => Promise<OrganizationMemberSearchResultDTO[]>;
  acceptInvitation: (invitationId: string) => Promise<boolean>;
  rejectInvitation: (invitationId: string) => Promise<boolean>;
  getWorkspaceMembers: (
    workspaceId: string
  ) => Promise<WorkspaceMemberView | null>;

  // Scenario 4: Page 생성, 이동, 수정
  createPage: (
    workspaceId: string,
    parentId?: string,
    title?: string,
    icon?: string
  ) => Promise<string | null>;
  movePage: (
    pageId: string,
    newParentId?: string,
    insertIndex?: number
  ) => Promise<boolean>;
  updatePageInfo: (
    pageId: string,
    title?: string,
    icon?: string
  ) => Promise<boolean>;
  reorderPages: (
    workspaceId: string,
    parentId: string | undefined,
    orderedPageIds: string[]
  ) => Promise<boolean>;

  // Scenario 7: Page 삭제 및 복제
  deletePage: (pageId: string) => Promise<boolean>;
  duplicatePage: (pageId: string) => Promise<string | null>;

  // 계산된 속성
  selectedPage: PageTreeNodeDTO | null;
  selectedWorkspace: WorkspaceWithPagesDTO | null;
  defaultWorkspace: WorkspaceWithPagesDTO | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined
);

/**
 * WorkspaceProvider Props
 */
interface WorkspaceProviderProps {
  children: React.ReactNode;
  initialWorkspaces: WorkspaceWithPagesDTO[];
  initialSelectedPageId?: string | null;
  organizationId: string;
}

// ============================================================================
// 헬퍼 함수: Page Tree 조작 (컴포넌트 외부, 메모리 최적화)
// ============================================================================

/**
 * PageTree에서 특정 페이지를 찾아서 제거
 *
 * @returns 제거된 트리와 제거된 페이지
 */
function findAndRemovePageFromTree(
  tree: PageTreeNodeDTO[],
  pageId: string
): { tree: PageTreeNodeDTO[]; page: PageTreeNodeDTO | null } {
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i] as PageTreeNodeDTO;

    if (node.id === pageId) {
      // 찾았음 - 제거하고 반환
      return {
        tree: [...tree.slice(0, i), ...tree.slice(i + 1)],
        page: node,
      };
    }

    // 자식에서 재귀 탐색
    if (node.children.length > 0) {
      const result = findAndRemovePageFromTree(node.children, pageId);
      if (result.page) {
        return {
          tree: [
            ...tree.slice(0, i),
            { ...node, children: result.tree },
            ...tree.slice(i + 1),
          ],
          page: result.page,
        };
      }
    }
  }

  return { tree, page: null };
}

/**
 * PageTree의 특정 부모에 페이지 추가
 *
 * @param tree - 페이지 트리
 * @param page - 추가할 페이지
 * @param parentId - 부모 페이지 ID (undefined면 루트)
 * @param insertIndex - 삽입 위치 (undefined면 맨 끝)
 */
function addPageToTree(
  tree: PageTreeNodeDTO[],
  page: PageTreeNodeDTO,
  parentId: string | undefined,
  insertIndex?: number
): PageTreeNodeDTO[] {
  // 루트로 추가
  if (parentId === undefined) {
    const pageWithParent = { ...page, parentId: null };

    // 인덱스 지정 시 해당 위치에 삽입
    if (insertIndex !== undefined && insertIndex >= 0) {
      const newTree = [...tree];
      newTree.splice(insertIndex, 0, pageWithParent);
      return newTree;
    }

    // 인덱스 없으면 맨 끝에 추가
    return [...tree, pageWithParent];
  }

  // 특정 부모에 추가
  return tree.map(node => {
    if (node.id === parentId) {
      const pageWithParent = { ...page, parentId };

      // 인덱스 지정 시 해당 위치에 삽입
      if (insertIndex !== undefined && insertIndex >= 0) {
        const newChildren = [...node.children];
        newChildren.splice(insertIndex, 0, pageWithParent);
        return {
          ...node,
          children: newChildren,
        };
      }

      // 인덱스 없으면 맨 끝에 추가
      return {
        ...node,
        children: [...node.children, pageWithParent],
      };
    }

    if (node.children.length > 0) {
      return {
        ...node,
        children: addPageToTree(node.children, page, parentId, insertIndex),
      };
    }

    return node;
  });
}

/**
 * PageTree에서 특정 ID의 페이지를 제거 (임시 페이지 제거용)
 */
function removePageFromTree(
  tree: PageTreeNodeDTO[],
  pageId: string
): PageTreeNodeDTO[] {
  return tree
    .filter(node => node.id !== pageId)
    .map(node => ({
      ...node,
      children: removePageFromTree(node.children, pageId),
    }));
}

/**
 * PageTree에서 임시 ID를 실제 ID로 교체
 */
function replacePageIdInTree(
  tree: PageTreeNodeDTO[],
  tempId: string,
  realId: string
): PageTreeNodeDTO[] {
  return tree.map(node => {
    if (node.id === tempId) {
      return { ...node, id: realId };
    }
    if (node.children.length > 0) {
      return {
        ...node,
        children: replacePageIdInTree(node.children, tempId, realId),
      };
    }
    return node;
  });
}

/**
 * PageTree에서 특정 parentId를 가진 페이지들의 order 업데이트
 */
function updatePageOrderInTree(
  tree: PageTreeNodeDTO[],
  parentId: string | undefined,
  orderedPageIds: string[]
): PageTreeNodeDTO[] {
  return tree.map(node => {
    // 해당 parentId의 children인 경우 order 업데이트
    if (node.parentId === parentId) {
      const newOrder = orderedPageIds.indexOf(node.id);
      if (newOrder !== -1) {
        return {
          ...node,
          order: newOrder,
          children: updatePageOrderInTree(
            node.children,
            parentId,
            orderedPageIds
          ),
        };
      }
    }
    // 재귀적으로 하위 노드도 처리
    return {
      ...node,
      children: updatePageOrderInTree(node.children, parentId, orderedPageIds),
    };
  });
}

/**
 * PageTree에서 특정 부모의 children 중 최대 order 값 찾기
 */
function findMaxOrderInTree(
  tree: PageTreeNodeDTO[],
  parentId: string | undefined
): number {
  let maxOrder = -1;

  for (const node of tree) {
    // 같은 부모의 children 확인
    if (node.parentId === parentId) {
      maxOrder = Math.max(maxOrder, node.order);
    }
    // 재귀적으로 하위 노드도 확인
    if (node.children.length > 0) {
      const childMax = findMaxOrderInTree(node.children, parentId);
      maxOrder = Math.max(maxOrder, childMax);
    }
  }

  return maxOrder;
}

/**
 * PageTree에서 특정 페이지의 정보(title, icon) 업데이트
 */
function updatePageInfoInTree(
  tree: PageTreeNodeDTO[],
  pageId: string,
  updates: { title?: string; icon?: string }
): PageTreeNodeDTO[] {
  return tree.map(node => {
    if (node.id === pageId) {
      return {
        ...node,
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.icon !== undefined && { icon: updates.icon }),
        lastModified: new Date().toISOString(),
      };
    }
    if (node.children.length > 0) {
      return {
        ...node,
        children: updatePageInfoInTree(node.children, pageId, updates),
      };
    }
    return node;
  });
}

// ============================================================================
// WorkspaceProvider 구현
// ============================================================================

/**
 * WorkspaceProvider 구현
 *
 * Workspace Management Domain의 전역 상태 관리
 */
export function WorkspaceProvider({
  children,
  initialWorkspaces,
  initialSelectedPageId,
  organizationId,
}: WorkspaceProviderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 기본 상태
  const [workspaces, setWorkspaces] =
    useState<WorkspaceWithPagesDTO[]>(initialWorkspaces);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    initialSelectedPageId || null
  );
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );

  // 쿠키/로컬스토리지 키 생성 (ssota 접두사 사용)
  const getWorkspaceCollapsedKey = (workspaceId: string) =>
    `ssota-workspace-collapsed-${workspaceId}`;
  const getPageCollapsedKey = (pageId: string) =>
    `ssota-page-collapsed-${pageId}`;
  const getRecentPageKey = () => `ssota-recent-page-${organizationId}`;

  // 초기값: 빈 Set으로 시작 (서버/클라이언트 모두 동일, Hydration 에러 방지)
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    () => new Set()
  );

  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 쿠키 헬퍼 함수 (최근 페이지 저장용)
  const getCookieValue = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split(';');
    const cookie = cookies.find(c => c.trim().startsWith(`${name}=`));
    return cookie ? cookie.split('=')[1] || null : null;
  };

  const setCookieValue = (name: string, value: string): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${name}=${value}; path=/; max-age=31536000`; // 1년
  };

  // 초기화: localStorage에서 펼침 상태 복원 + 선택된 페이지 복원
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Workspace 펼침 상태 복원
    const newExpandedWorkspaces = new Set<string>();
    workspaces.forEach(workspace => {
      const key = getWorkspaceCollapsedKey(workspace.workspaceId);
      const isCollapsed = localStorage.getItem(key) === 'true';
      if (!isCollapsed) {
        // 기본: 펼쳐짐
        newExpandedWorkspaces.add(workspace.workspaceId);
      }
    });

    // 2. 선택된 페이지 복원 (우선순위)
    let pageToSelect = initialSelectedPageId;

    if (!pageToSelect) {
      // URL 파라미터 없으면 쿠키에서 복원
      const recentPageKey = getRecentPageKey();
      const recentPageId = getCookieValue(recentPageKey);

      if (recentPageId) {
        // 쿠키의 페이지가 유효한지 확인
        const pageExists = workspaces.some(ws =>
          findPageInTree(ws.pageTree, recentPageId)
        );
        if (pageExists) {
          pageToSelect = recentPageId;
        }
      }
    }

    if (!pageToSelect) {
      // Fallback: Default Workspace의 첫 번째 페이지
      const defaultWs = workspaces.find(ws => ws.isDefault);
      if (defaultWs && defaultWs.pageTree.length > 0) {
        pageToSelect = defaultWs.pageTree[0]?.id;
      }
    }

    if (pageToSelect) {
      const workspace = workspaces.find(ws =>
        findPageInTree(ws.pageTree, pageToSelect as string)
      );
      if (workspace) {
        setSelectedPageId(pageToSelect);
        setSelectedWorkspaceId(workspace.workspaceId);
        // 선택된 페이지의 Workspace 자동 펼치기
        newExpandedWorkspaces.add(workspace.workspaceId);
      }
    }

    // 3. 펼침 상태 적용 (애니메이션과 함께 부드럽게 렌더링)
    setExpandedWorkspaces(newExpandedWorkspaces);
  }, []);

  // 페이지 찾기 (재귀)
  const findPageInTree = (
    tree: PageTreeNodeDTO[],
    pageId: string
  ): PageTreeNodeDTO | null => {
    for (const node of tree) {
      if (node.id === pageId) return node;
      if (node.children && node.children.length > 0) {
        const found = findPageInTree(node.children, pageId);
        if (found) return found;
      }
    }
    return null;
  };

  // 페이지의 모든 부모 페이지 ID 찾기 (재귀)
  const findPageAncestors = (
    tree: PageTreeNodeDTO[],
    pageId: string,
    ancestors: string[] = []
  ): string[] | null => {
    for (const node of tree) {
      if (node.id === pageId) {
        // 페이지를 찾았으면 ancestors 반환
        return ancestors;
      }
      if (node.children && node.children.length > 0) {
        // 현재 노드를 ancestors에 추가하고 재귀 탐색
        const found = findPageAncestors(node.children, pageId, [
          ...ancestors,
          node.id,
        ]);
        if (found !== null) return found;
      }
    }
    return null;
  };

  // Scenario 1: 페이지 선택
  const selectPage = useCallback(
    (pageId: string, workspaceId: string, skipNavigation = false) => {
      // 1. 페이지가 존재하는지 확인
      const workspace = workspaces.find(ws => ws.workspaceId === workspaceId);
      if (!workspace) return;

      const page = findPageInTree(workspace.pageTree, pageId);
      if (!page) return;

      // 2. 상태 업데이트
      setSelectedPageId(pageId);
      setSelectedWorkspaceId(workspaceId);

      // 3. 쿠키에 저장
      if (typeof window !== 'undefined') {
        const key = getRecentPageKey();
        setCookieValue(key, pageId);
      }

      // 4. 해당 Workspace 자동 펼치기
      setExpandedWorkspaces(prev => new Set(prev).add(workspaceId));

      // 5. 페이지의 모든 부모 페이지들 자동 펼치기
      const ancestors = findPageAncestors(workspace.pageTree, pageId);
      if (ancestors && ancestors.length > 0) {
        setExpandedPages(prev => {
          const newSet = new Set(prev);
          ancestors.forEach(ancestorId => newSet.add(ancestorId));
          return newSet;
        });
      }

      // 6. URL 변경 (skipNavigation이 true면 건너뜀)
      if (!skipNavigation && typeof window !== 'undefined') {
        const targetUrl = `/r/${organizationId}/workspace/${workspaceId}/page/${pageId}`;
        // 현재 URL과 다를 때만 변경
        if (window.location.pathname !== targetUrl) {
          router.push(targetUrl);
        }
      }
    },
    [workspaces, organizationId, router]
  );

  // Scenario 1: Workspace 토글
  const toggleWorkspace = useCallback((workspaceId: string) => {
    setExpandedWorkspaces(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workspaceId)) {
        newSet.delete(workspaceId);
        // 로컬스토리지에 저장
        if (typeof window !== 'undefined') {
          const key = getWorkspaceCollapsedKey(workspaceId);
          localStorage.setItem(key, 'true');
        }
      } else {
        newSet.add(workspaceId);
        // 로컬스토리지에 저장
        if (typeof window !== 'undefined') {
          const key = getWorkspaceCollapsedKey(workspaceId);
          localStorage.setItem(key, 'false');
        }
      }
      return newSet;
    });
  }, []);

  // Scenario 1: Page 토글
  const togglePage = useCallback((pageId: string) => {
    setExpandedPages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
        // 로컬스토리지에 저장
        if (typeof window !== 'undefined') {
          const key = getPageCollapsedKey(pageId);
          localStorage.setItem(key, 'true');
        }
      } else {
        newSet.add(pageId);
        // 로컬스토리지에 저장
        if (typeof window !== 'undefined') {
          const key = getPageCollapsedKey(pageId);
          localStorage.setItem(key, 'false');
        }
      }
      return newSet;
    });
  }, []);

  // Scenario 2: Workspace 생성
  const createWorkspace = useCallback(
    async (
      request: Omit<CreateWorkspaceRequest, 'organizationId'>
    ): Promise<CreateWorkspaceResponse | null> => {
      setIsLoading(true);
      try {
        // 1. Server Action 호출
        const result = await createWorkspaceAction({
          organizationId,
          ...request,
        });

        if (result.success && result.data) {
          // 2. 성공 시 State 업데이트
          // 기존 워크스페이스에서 organizationName 가져오기
          const organizationName =
            workspaces[0]?.organizationName || 'Organization';

          const newWorkspace: WorkspaceWithPagesDTO = {
            workspaceId: result.data.workspaceId,
            name: request.name,
            description: request.description || null,
            icon: request.icon || null,
            isDefault: false,
            isPersonal: false,
            ownerId: null,
            pageTree: [
              {
                id: result.data.firstPageId,
                title: 'Untitled',
                icon: 'FileText',
                children: [],
                depth: 0,
                isFavorite: false,
                lastModified: new Date().toISOString(),
                parentId: null,
                order: 0,
              },
            ],
            pageCount: 1,
            workspaceName: request.name,
            organizationName,
          };

          setWorkspaces(prev => [...prev, newWorkspace]);

          // 3. 자동으로 첫 페이지 선택
          selectPage(result.data.firstPageId, result.data.workspaceId);

          // 4. 성공 토스트
          toast.success('워크스페이스가 생성되었습니다');

          return result.data;
        } else {
          const errorMessage =
            'error' in result
              ? result.error
              : '워크스페이스 생성에 실패했습니다';
          toast.error(errorMessage);
          return null;
        }
      } catch (err) {
        toast.error('워크스페이스 생성 중 오류가 발생했습니다');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [organizationId, selectPage]
  );

  // Scenario 2: Workspace 정보 수정
  const updateWorkspaceInfo = useCallback(
    async (request: UpdateWorkspaceInfoRequest): Promise<boolean> => {
      setIsLoading(true);
      try {
        // 1. Server Action 호출
        const result = await updateWorkspaceInfoAction(request);

        if (result.success) {
          // 2. 성공 시 State 업데이트
          setWorkspaces(prev =>
            prev.map(ws =>
              ws.workspaceId === request.workspaceId
                ? {
                    ...ws,
                    name: request.name ?? ws.name,
                    description: request.description ?? ws.description,
                    icon: request.icon ?? ws.icon,
                  }
                : ws
            )
          );

          // 3. 성공 토스트
          toast.success('워크스페이스 정보가 업데이트되었습니다');
          return true;
        } else {
          // 사용자 친화적인 에러 메시지
          const errorMessages: Record<string, string> = {
            NOT_WORKSPACE_MEMBER: '워크스페이스 멤버만 수정할 수 있습니다',
            NOT_ORG_ADMIN: '조직 관리자 권한이 필요합니다',
            WORKSPACE_NOT_FOUND: '워크스페이스를 찾을 수 없습니다',
            UNAUTHORIZED: '로그인이 필요합니다',
          };
          const errorMessage =
            'error' in result
              ? errorMessages[result.error] || result.error
              : '워크스페이스 수정에 실패했습니다';
          toast.error('수정 실패', { description: errorMessage });
          return false;
        }
      } catch (err) {
        toast.error('워크스페이스 수정 중 오류가 발생했습니다');
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 계산된 속성: 선택된 페이지
  const selectedPage = useMemo(() => {
    if (!selectedPageId) return null;
    for (const workspace of workspaces) {
      const page = findPageInTree(workspace.pageTree, selectedPageId);
      if (page) return page;
    }
    return null;
  }, [workspaces, selectedPageId]);

  // 계산된 속성: 선택된 Workspace
  const selectedWorkspace = useMemo(() => {
    if (!selectedWorkspaceId) return null;
    return (
      workspaces.find(ws => ws.workspaceId === selectedWorkspaceId) || null
    );
  }, [workspaces, selectedWorkspaceId]);

  // 계산된 속성: Default Workspace
  const defaultWorkspace = useMemo(() => {
    return workspaces.find(ws => ws.isDefault) || null;
  }, [workspaces]);

  // Scenario 3: 멤버 초대
  const inviteMembers = useCallback(
    async (workspaceId: string, emails: string[]): Promise<number | null> => {
      try {
        const result = await inviteWorkspaceMemberAction({
          workspaceId,
          memberEmails: emails,
        });

        if (!result.success) {
          // 사용자 친화적인 에러 메시지
          const errorMessages: Record<string, string> = {
            NOT_ORG_ADMIN: '조직 관리자만 멤버를 초대할 수 있습니다',
            NOT_WORKSPACE_MEMBER: '워크스페이스 멤버만 초대할 수 있습니다',
            WORKSPACE_NOT_FOUND: '워크스페이스를 찾을 수 없습니다',
            UNAUTHORIZED: '로그인이 필요합니다',
            INVALID_INPUT: '초대할 멤버를 선택해주세요',
          };
          const errorMessage =
            errorMessages[result.error] || '멤버 초대에 실패했습니다';
          toast.error('초대 실패', { description: errorMessage });
          return null;
        }

        toast.success(`${result.data.invitedCount}명 초대 완료`);
        return result.data.invitedCount;
      } catch (error) {
        console.error('[inviteMembers] Error:', error);
        toast.error('초대 중 오류가 발생했습니다');
        return null;
      }
    },
    []
  );

  // Scenario 3: 조직 멤버 검색
  const searchOrganizationMembers = useCallback(
    async (
      workspaceId: string,
      query: string
    ): Promise<OrganizationMemberSearchResultDTO[]> => {
      try {
        const result = await searchOrganizationMembersAction({
          workspaceId,
          query,
        });

        if (!result.success) {
          console.error('[searchOrganizationMembers] Error:', result.error);
          return [];
        }

        return result.data;
      } catch (error) {
        console.error('[searchOrganizationMembers] Error:', error);
        return [];
      }
    },
    []
  );

  // Scenario 3: 초대 수락
  const acceptInvitation = useCallback(
    async (invitationId: string): Promise<boolean> => {
      try {
        const result = await acceptWorkspaceInvitationAction({ invitationId });

        if (!result.success) {
          toast.error(`초대 수락 실패: ${result.error}`);
          return false;
        }

        toast.success('Workspace 초대를 수락했습니다');

        // TODO: Optimistic Update로 워크스페이스 목록에 추가
        // 현재는 페이지 새로고침 필요 (향후 개선)

        return true;
      } catch (error) {
        console.error('[acceptInvitation] Error:', error);
        toast.error('초대 수락 중 오류가 발생했습니다');
        return false;
      }
    },
    []
  );

  // Scenario 3: 초대 거절
  const rejectInvitation = useCallback(
    async (invitationId: string): Promise<boolean> => {
      try {
        const result = await rejectWorkspaceInvitationAction({ invitationId });

        if (!result.success) {
          toast.error(`초대 거절 실패: ${result.error}`);
          return false;
        }

        toast.success('Workspace 초대를 거절했습니다');
        return true;
      } catch (error) {
        console.error('[rejectInvitation] Error:', error);
        toast.error('초대 거절 중 오류가 발생했습니다');
        return false;
      }
    },
    []
  );

  // Scenario 3: Workspace 멤버 목록 조회
  const getWorkspaceMembers = useCallback(
    async (workspaceId: string): Promise<WorkspaceMemberView | null> => {
      try {
        const result = await getWorkspaceMembersAction({ workspaceId });

        if (!result.success) {
          console.error('[getWorkspaceMembers] Error:', result.error);
          toast.error('멤버 목록을 불러오는데 실패했습니다');
          return null;
        }

        return result.data;
      } catch (error) {
        console.error('[getWorkspaceMembers] Error:', error);
        toast.error('멤버 목록 조회 중 오류가 발생했습니다');
        return null;
      }
    },
    []
  );

  // Scenario 4: Page 생성 (Optimistic Update)
  const createPage = useCallback(
    async (
      workspaceId: string,
      parentId?: string,
      title?: string,
      icon?: string
    ): Promise<string | null> => {
      const tempPageId = await generateTempPageId();
      const finalTitle = title || 'Untitled';
      const finalIcon = icon || 'File';

      try {
        // 1. Optimistic Update: 임시 페이지 추가
        setWorkspaces(prev => {
          return prev.map(ws => {
            if (ws.workspaceId !== workspaceId) return ws;

            // 같은 부모의 maxOrder 찾기
            const maxOrder = findMaxOrderInTree(ws.pageTree, parentId);
            const newOrder = maxOrder + 1;

            const newPage: PageTreeNodeDTO = {
              id: tempPageId,
              title: finalTitle,
              icon: finalIcon,
              children: [],
              depth: parentId ? 1 : 0,
              isFavorite: false,
              lastModified: new Date().toISOString(),
              parentId: parentId || null,
              order: newOrder,
            };

            return {
              ...ws,
              pageTree: addPageToTree(ws.pageTree, newPage, parentId),
              pageCount: ws.pageCount + 1,
            };
          });
        });

        // 2. 부모 페이지 자동 펼치기
        if (parentId) {
          setExpandedPages(prev => {
            const newSet = new Set(prev);
            newSet.add(parentId);

            // 로컬스토리지에 저장
            if (typeof window !== 'undefined') {
              const key = getPageCollapsedKey(parentId);
              localStorage.setItem(key, 'false');
            }

            return newSet;
          });
        }

        // 3. 새 페이지로 이동
        setSelectedPageId(tempPageId);
        setSelectedWorkspaceId(workspaceId);

        // 4. Server Action 호출
        const result = await createPageAction({
          workspaceId,
          parentId,
          title: finalTitle,
          icon: finalIcon,
        });

        if (!result.success) {
          // 실패 시 롤백
          setWorkspaces(prev => {
            return prev.map(ws => {
              if (ws.workspaceId !== workspaceId) return ws;

              return {
                ...ws,
                pageTree: removePageFromTree(ws.pageTree, tempPageId),
                pageCount: ws.pageCount - 1,
              };
            });
          });

          // 권한 에러만 토스트로 표시
          if (
            result.error === 'NOT_WORKSPACE_MEMBER' ||
            result.error === 'UNAUTHORIZED'
          ) {
            toast.error('페이지를 생성할 권한이 없습니다');
          }
          return null;
        }

        // 5. 성공 시 임시 ID를 실제 ID로 교체 (Optimistic Update 완성)
        setWorkspaces(prev => {
          return prev.map(ws => {
            if (ws.workspaceId !== workspaceId) return ws;

            return {
              ...ws,
              pageTree: replacePageIdInTree(
                ws.pageTree,
                tempPageId,
                result.data.pageId
              ),
            };
          });
        });

        // 실제 페이지 ID로 선택 상태 업데이트
        setSelectedPageId(result.data.pageId);
        return result.data.pageId;
      } catch (error) {
        // 에러 시 롤백
        setWorkspaces(prev => {
          return prev.map(ws => {
            if (ws.workspaceId !== workspaceId) return ws;

            return {
              ...ws,
              pageTree: removePageFromTree(ws.pageTree, tempPageId),
              pageCount: ws.pageCount - 1,
            };
          });
        });

        console.error('[createPage] Error:', error);
        toast.error('페이지 생성 중 오류가 발생했습니다');
        return null;
      }
    },
    []
  );

  // Scenario 4: Page 이동 (Optimistic Update)
  const movePage = useCallback(
    async (
      pageId: string,
      newParentId?: string,
      insertIndex?: number
    ): Promise<boolean> => {
      // 1. 이전 상태 백업 (롤백용)
      const previousWorkspaces = workspaces;

      try {
        // 2. Optimistic Update: 즉시 페이지 이동
        setWorkspaces(prev => {
          return prev.map(ws => {
            // 페이지 제거
            const { tree: treeAfterRemoval, page } = findAndRemovePageFromTree(
              ws.pageTree,
              pageId
            );

            if (!page) return ws;

            // 드롭 인덱스가 제공된 경우 해당 위치의 order 계산
            let updatedPage = page;
            if (insertIndex !== undefined) {
              updatedPage = {
                ...page,
                order: insertIndex,
              };
            }

            // 새 위치에 추가
            return {
              ...ws,
              pageTree: addPageToTree(
                treeAfterRemoval,
                updatedPage,
                newParentId,
                insertIndex
              ),
            };
          });
        });

        // 3. 새 부모 자동 펼치기
        if (newParentId) {
          setExpandedPages(prev => {
            const newSet = new Set(prev);
            newSet.add(newParentId);

            // 로컬스토리지에 저장
            if (typeof window !== 'undefined') {
              const key = getPageCollapsedKey(newParentId);
              localStorage.setItem(key, 'false');
            }

            return newSet;
          });
        }

        // 4. Server Action 호출
        const result = await movePageAction({
          pageId,
          newParentId,
        });

        if (!result.success) {
          // 실패 시 롤백
          setWorkspaces(previousWorkspaces);

          // 순환 참조와 권한 에러만 토스트로 표시
          if (result.error === 'CIRCULAR_REFERENCE_DETECTED') {
            toast.error('순환 참조가 발생할 수 없습니다');
          } else if (
            result.error === 'NOT_WORKSPACE_MEMBER' ||
            result.error === 'UNAUTHORIZED'
          ) {
            toast.error('페이지를 이동할 권한이 없습니다');
          }
          return false;
        }

        // 5. 성공 - 조용히 처리 (토스트 없음)
        return true;
      } catch (error) {
        // 에러 시 롤백
        console.error('[movePage] Error:', error);
        setWorkspaces(previousWorkspaces);
        return false;
      }
    },
    [workspaces]
  );

  // Scenario 4: Page 정보 수정 (Optimistic Update)
  const updatePageInfo = useCallback(
    async (pageId: string, title?: string, icon?: string): Promise<boolean> => {
      // 1. 이전 상태 백업 (롤백용)
      const previousWorkspaces = workspaces;

      try {
        // 2. Optimistic Update: 즉시 페이지 정보 업데이트
        setWorkspaces(prev => {
          return prev.map(ws => ({
            ...ws,
            pageTree: updatePageInfoInTree(ws.pageTree, pageId, {
              title,
              icon,
            }),
          }));
        });

        // 3. Server Action 호출
        const result = await updatePageInfoAction({
          pageId,
          title,
          icon,
        });

        if (!result.success) {
          // 실패 시 롤백
          setWorkspaces(previousWorkspaces);
          toast.error(`페이지 수정 실패: ${result.error}`);
          return false;
        }

        // 4. 성공 - Optimistic Update 상태 유지
        return true;
      } catch (error) {
        // 에러 시 롤백
        console.error('[updatePageInfo] Error:', error);
        setWorkspaces(previousWorkspaces);
        toast.error('페이지 수정 중 오류가 발생했습니다');
        return false;
      }
    },
    [workspaces]
  );

  // Scenario 4: Page 순서 재정렬 (Optimistic Update)
  const reorderPages = useCallback(
    async (
      workspaceId: string,
      parentId: string | undefined,
      orderedPageIds: string[]
    ): Promise<boolean> => {
      // 1. 이전 상태 백업 (롤백용)
      const previousWorkspaces = workspaces;

      try {
        // 2. Optimistic Update: 즉시 order 업데이트
        setWorkspaces(prev => {
          return prev.map(ws => {
            if (ws.workspaceId !== workspaceId) return ws;

            return {
              ...ws,
              pageTree: updatePageOrderInTree(
                ws.pageTree,
                parentId,
                orderedPageIds
              ),
            };
          });
        });

        // 3. Server Action 호출
        const result = await reorderPagesAction({
          workspaceId,
          parentId,
          orderedPageIds,
        });

        if (!result.success) {
          // 실패 시 롤백
          setWorkspaces(previousWorkspaces);

          // 권한 에러만 토스트로 표시
          if (
            result.error === 'NOT_WORKSPACE_MEMBER' ||
            result.error === 'UNAUTHORIZED'
          ) {
            toast.error('페이지 순서를 변경할 권한이 없습니다');
          }
          return false;
        }

        // 4. 성공 - Optimistic Update 상태 유지
        return true;
      } catch (error) {
        // 에러 시 롤백
        setWorkspaces(previousWorkspaces);
        return false;
      }
    },
    [workspaces]
  );

  // Scenario 7: Page 삭제 (Optimistic Update)
  const deletePage = useCallback(
    async (pageId: string): Promise<boolean> => {
      // 1. 이전 상태 백업 (롤백용)
      const previousWorkspaces = workspaces;

      try {
        // 2. Optimistic Update: 즉시 페이지 제거
        setWorkspaces(prev => {
          return prev.map(ws => {
            const { tree: updatedTree } = findAndRemovePageFromTree(
              ws.pageTree,
              pageId
            );

            return {
              ...ws,
              pageTree: updatedTree,
              pageCount: ws.pageCount - 1,
            };
          });
        });

        // 3. 현재 선택된 페이지를 삭제한 경우 다른 페이지로 이동
        if (selectedPageId === pageId) {
          const workspace = workspaces.find(ws =>
            findPageInTree(ws.pageTree, pageId)
          );

          if (workspace && workspace.pageTree.length > 0) {
            // 첫 번째 페이지로 이동
            const firstPage = workspace.pageTree[0];
            if (firstPage) {
              selectPage(firstPage.id, workspace.workspaceId);
            }
          }
        }

        // 4. Server Action 호출
        const result = await deletePageAction({
          pageId,
        });

        if (!result.success) {
          // 실패 시 롤백
          setWorkspaces(previousWorkspaces);

          // 에러 토스트 표시
          if (
            result.error === 'NOT_WORKSPACE_MEMBER' ||
            result.error === 'UNAUTHORIZED'
          ) {
            toast.error('페이지를 삭제할 권한이 없습니다');
          } else if (result.error === 'PAGE_NOT_FOUND') {
            toast.error('페이지를 찾을 수 없습니다');
          } else {
            toast.error('페이지 삭제에 실패했습니다');
          }
          return false;
        }

        // 5. 성공 토스트
        toast.success('페이지가 삭제되었습니다');
        return true;
      } catch (error) {
        // 에러 시 롤백
        console.error('[deletePage] Error:', error);
        setWorkspaces(previousWorkspaces);
        toast.error('페이지 삭제 중 오류가 발생했습니다');
        return false;
      }
    },
    [workspaces, selectedPageId, selectPage]
  );

  // Scenario 7: Page 복제 (Optimistic Update)
  const duplicatePage = useCallback(
    async (pageId: string): Promise<string | null> => {
      const tempPageId = await generateTempPageId();
      // 1. 이전 상태 백업 (롤백용)
      const previousWorkspaces = workspaces;

      try {
        // 2. 원본 페이지 찾기
        let originalPage: PageTreeNodeDTO | null = null;
        let targetWorkspaceId = '';

        for (const ws of workspaces) {
          const page = findPageInTree(ws.pageTree, pageId);
          if (page) {
            originalPage = page;
            targetWorkspaceId = ws.workspaceId;
            break;
          }
        }

        if (!originalPage) {
          toast.error('페이지를 찾을 수 없습니다');
          return null;
        }

        // 3. Optimistic Update: 임시 복제 페이지 추가
        setWorkspaces(prev => {
          return prev.map(ws => {
            if (ws.workspaceId !== targetWorkspaceId) return ws;

            const duplicatedPage: PageTreeNodeDTO = {
              id: tempPageId,
              title: `${originalPage!.title} (Copy)`,
              icon: originalPage!.icon,
              children: [],
              depth: originalPage!.depth,
              isFavorite: false,
              lastModified: new Date().toISOString(),
              parentId: originalPage!.parentId,
              order: originalPage!.order + 1,
            };

            return {
              ...ws,
              pageTree: addPageToTree(
                ws.pageTree,
                duplicatedPage,
                originalPage!.parentId || undefined,
                undefined // 맨 끝에 추가
              ),
              pageCount: ws.pageCount + 1,
            };
          });
        });

        // 4. Server Action 호출
        const result = await duplicatePageAction({
          pageId,
        });

        if (!result.success) {
          // 실패 시 롤백
          setWorkspaces(previousWorkspaces);

          // 에러 토스트 표시
          if (
            result.error === 'NOT_WORKSPACE_MEMBER' ||
            result.error === 'UNAUTHORIZED'
          ) {
            toast.error('페이지를 복제할 권한이 없습니다');
          } else if (result.error === 'PAGE_NOT_FOUND') {
            toast.error('페이지를 찾을 수 없습니다');
          } else {
            toast.error('페이지 복제에 실패했습니다');
          }
          return null;
        }

        // 5. 성공 시 임시 ID를 실제 ID로 교체
        setWorkspaces(prev => {
          return prev.map(ws => {
            if (ws.workspaceId !== targetWorkspaceId) return ws;

            return {
              ...ws,
              pageTree: replacePageIdInTree(
                ws.pageTree,
                tempPageId,
                result.data.pageId
              ),
            };
          });
        });

        // 6. 성공 토스트
        toast.success('페이지가 복제되었습니다');
        return result.data.pageId;
      } catch (error) {
        // 에러 시 롤백
        console.error('[duplicatePage] Error:', error);
        setWorkspaces(previousWorkspaces);
        toast.error('페이지 복제 중 오류가 발생했습니다');
        return null;
      }
    },
    [workspaces]
  );

  const value: WorkspaceContextValue = {
    // 기본 상태
    organizationId,
    workspaces,
    selectedPageId,
    selectedWorkspaceId,
    expandedWorkspaces,
    expandedPages,
    isLoading: isLoading || isPending,
    error,

    // Scenario 1
    selectPage,
    toggleWorkspace,
    togglePage,

    // Scenario 2
    createWorkspace,
    updateWorkspaceInfo,

    // Scenario 3
    inviteMembers,
    searchOrganizationMembers,
    acceptInvitation,
    rejectInvitation,
    getWorkspaceMembers,

    // Scenario 4
    createPage,
    movePage,
    updatePageInfo,
    reorderPages,

    // Scenario 7
    deletePage,
    duplicatePage,

    // 계산된 속성
    selectedPage,
    selectedWorkspace,
    defaultWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

/**
 * useWorkspaceContext Hook
 *
 * WorkspaceContext 접근을 위한 내부 Hook
 */
export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error(
      'useWorkspaceContext must be used within a WorkspaceProvider'
    );
  }
  return context;
}
