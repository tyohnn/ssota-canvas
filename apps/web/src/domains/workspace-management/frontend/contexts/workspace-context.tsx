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
  inviteWorkspaceMemberAction,
  searchOrganizationMembersAction,
  acceptWorkspaceInvitationAction,
  rejectWorkspaceInvitationAction,
  getWorkspaceMembersAction,
  createPageAction,
  movePageAction,
  updatePageInfoAction,
  reorderPagesAction,
} from '@/domains/workspace-management/actions/workspace-management.actions';

/**
 * WorkspaceContext 타입 정의
 */
interface WorkspaceContextValue {
  // 기본 상태
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
  refreshWorkspacePages: () => Promise<void>;

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
  movePage: (pageId: string, newParentId?: string) => Promise<boolean>;
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

      // 5. URL 변경 (skipNavigation이 true면 건너뜀)
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

  // Scenario 1: 데이터 갱신
  const refreshWorkspacePages = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: getWorkspacePagesAction 호출
      // const result = await getWorkspacePagesAction(organizationId);
      // if (result.success) {
      //   setWorkspaces(result.data.workspaces);
      // }
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

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
          const newWorkspace: WorkspaceWithPagesDTO = {
            workspaceId: result.data.workspaceId,
            name: request.name,
            description: request.description || null,
            icon: request.icon || null,
            isDefault: false,
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
        await refreshWorkspacePages();
        return true;
      } catch (error) {
        console.error('[acceptInvitation] Error:', error);
        toast.error('초대 수락 중 오류가 발생했습니다');
        return false;
      }
    },
    [refreshWorkspacePages]
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
      const tempPageId = `temp-${Date.now()}`;
      const finalTitle = title || 'Untitled';
      const finalIcon = icon || 'FileText';

      try {
        // 1. Optimistic Update: 임시 페이지 추가
        setWorkspaces(prev => {
          return prev.map(ws => {
            if (ws.workspaceId !== workspaceId) return ws;

            const newPage: PageTreeNodeDTO = {
              id: tempPageId,
              title: finalTitle,
              icon: finalIcon,
              children: [],
              depth: parentId ? 1 : 0, // 부모 있으면 1, 없으면 0 (실제는 계산됨)
              isFavorite: false,
              lastModified: new Date().toISOString(),
              parentId: parentId || null,
              order: 999, // 임시 순서
            };

            // 부모 페이지 찾기 및 추가
            const addToParent = (
              nodes: PageTreeNodeDTO[]
            ): PageTreeNodeDTO[] => {
              return nodes.map(node => {
                if (node.id === parentId) {
                  return {
                    ...node,
                    children: [...node.children, newPage],
                  };
                }
                if (node.children.length > 0) {
                  return {
                    ...node,
                    children: addToParent(node.children),
                  };
                }
                return node;
              });
            };

            const updatedPageTree = parentId
              ? addToParent(ws.pageTree)
              : [...ws.pageTree, newPage];

            return {
              ...ws,
              pageTree: updatedPageTree,
              pageCount: ws.pageCount + 1,
            };
          });
        });

        // 2. 부모 페이지 자동 펼치기
        if (parentId) {
          setExpandedPages(prev => new Set(prev).add(parentId));
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

              const removeTemp = (
                nodes: PageTreeNodeDTO[]
              ): PageTreeNodeDTO[] => {
                return nodes
                  .filter(node => node.id !== tempPageId)
                  .map(node => ({
                    ...node,
                    children: removeTemp(node.children),
                  }));
              };

              return {
                ...ws,
                pageTree: removeTemp(ws.pageTree),
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

            // 임시 페이지를 실제 페이지 데이터로 교체
            const replaceTempId = (
              nodes: PageTreeNodeDTO[]
            ): PageTreeNodeDTO[] => {
              return nodes.map(node => {
                if (node.id === tempPageId) {
                  // 임시 페이지를 실제 페이지 ID로 교체
                  return {
                    ...node,
                    id: result.data.pageId,
                    // title, icon 등은 임시 값 유지 (서버에서 반환 안함)
                  };
                }
                if (node.children.length > 0) {
                  return {
                    ...node,
                    children: replaceTempId(node.children),
                  };
                }
                return node;
              });
            };

            return {
              ...ws,
              pageTree: replaceTempId(ws.pageTree),
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

            const removeTemp = (
              nodes: PageTreeNodeDTO[]
            ): PageTreeNodeDTO[] => {
              return nodes
                .filter(node => node.id !== tempPageId)
                .map(node => ({
                  ...node,
                  children: removeTemp(node.children),
                }));
            };

            return {
              ...ws,
              pageTree: removeTemp(ws.pageTree),
              pageCount: ws.pageCount - 1,
            };
          });
        });

        console.error('[createPage] Error:', error);
        toast.error('페이지 생성 중 오류가 발생했습니다');
        return null;
      }
    },
    [refreshWorkspacePages]
  );

  // Scenario 4: Page 이동 (Optimistic Update)
  const movePage = useCallback(
    async (pageId: string, newParentId?: string): Promise<boolean> => {
      // 1. 이전 상태 백업 (롤백용)
      const previousWorkspaces = workspaces;

      try {
        // 2. Optimistic Update: 즉시 페이지 이동
        setWorkspaces(prev => {
          return prev.map(ws => {
            // 페이지를 찾아서 제거
            const removePage = (
              nodes: PageTreeNodeDTO[]
            ): {
              newTree: PageTreeNodeDTO[];
              removedPage: PageTreeNodeDTO | null;
            } => {
              let removedPage: PageTreeNodeDTO | null = null;
              const newTree = nodes
                .filter(node => {
                  if (node.id === pageId) {
                    removedPage = node;
                    return false;
                  }
                  return true;
                })
                .map(node => {
                  if (node.children.length > 0) {
                    const result = removePage(node.children);
                    if (result.removedPage) {
                      removedPage = result.removedPage;
                    }
                    return {
                      ...node,
                      children: result.newTree,
                    };
                  }
                  return node;
                });
              return { newTree, removedPage };
            };

            // 페이지 제거
            const { newTree: treeAfterRemoval, removedPage } = removePage(
              ws.pageTree
            );

            if (!removedPage) {
              return ws; // 페이지를 찾지 못함
            }

            // 새 부모에 페이지 추가
            const addToNewParent = (
              nodes: PageTreeNodeDTO[]
            ): PageTreeNodeDTO[] => {
              if (newParentId === undefined) {
                // 루트로 이동
                return [...nodes, { ...removedPage, parentId: null }];
              }

              return nodes.map(node => {
                if (node.id === newParentId) {
                  return {
                    ...node,
                    children: [
                      ...node.children,
                      { ...removedPage, parentId: newParentId },
                    ],
                  };
                }
                if (node.children.length > 0) {
                  return {
                    ...node,
                    children: addToNewParent(node.children),
                  };
                }
                return node;
              });
            };

            return {
              ...ws,
              pageTree: addToNewParent(treeAfterRemoval),
            };
          });
        });

        // 3. 새 부모 자동 펼치기
        if (newParentId) {
          setExpandedPages(prev => new Set(prev).add(newParentId));
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

  // Scenario 4: Page 정보 수정
  const updatePageInfo = useCallback(
    async (pageId: string, title?: string, icon?: string): Promise<boolean> => {
      try {
        const result = await updatePageInfoAction({
          pageId,
          title,
          icon,
        });

        if (!result.success) {
          toast.error(`페이지 수정 실패: ${result.error}`);
          return false;
        }

        // 제목/아이콘만 수정하는 경우 조용히 처리
        await refreshWorkspacePages();
        return true;
      } catch (error) {
        console.error('[updatePageInfo] Error:', error);
        toast.error('페이지 수정 중 오류가 발생했습니다');
        return false;
      }
    },
    [refreshWorkspacePages]
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

            // 재귀적으로 pageTree를 순회하며 order 업데이트
            const updateOrder = (
              nodes: PageTreeNodeDTO[]
            ): PageTreeNodeDTO[] => {
              return nodes.map(node => {
                // 해당 parentId의 children인 경우 order 업데이트
                if (node.parentId === parentId) {
                  const newOrder = orderedPageIds.indexOf(node.id);
                  if (newOrder !== -1) {
                    return {
                      ...node,
                      order: newOrder,
                      children: updateOrder(node.children),
                    };
                  }
                }
                // 재귀적으로 하위 노드도 처리
                return {
                  ...node,
                  children: updateOrder(node.children),
                };
              });
            };

            return {
              ...ws,
              pageTree: updateOrder(ws.pageTree),
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

        // 4. 성공 시 서버 데이터로 최종 동기화
        await refreshWorkspacePages();
        return true;
      } catch (error) {
        // 에러 시 롤백
        setWorkspaces(previousWorkspaces);
        return false;
      }
    },
    [workspaces, refreshWorkspacePages]
  );

  const value: WorkspaceContextValue = {
    // 기본 상태
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
    refreshWorkspacePages,

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
