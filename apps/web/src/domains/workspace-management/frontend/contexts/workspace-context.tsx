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
} from '@/domains/workspace-management/shared/dtos';
import {
  createWorkspaceAction,
  updateWorkspaceInfoAction,
  inviteWorkspaceMemberAction,
  searchOrganizationMembersAction,
  acceptWorkspaceInvitationAction,
  rejectWorkspaceInvitationAction,
  getWorkspaceMembersAction,
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
  selectPage: (pageId: string, workspaceId: string) => void;
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
  const [expandedWorkspaces, setExpandedWorkspaces] = useState<Set<string>>(
    new Set()
  );
  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 로컬스토리지 키 생성
  const getWorkspaceCollapsedKey = (workspaceId: string) =>
    `workspace-collapsed-${workspaceId}`;
  const getPageCollapsedKey = (pageId: string) => `page-collapsed-${pageId}`;
  const getRecentPageKey = () => `recent-page-${organizationId}`;

  // 초기화: 로컬스토리지에서 펼치기/접기 상태 복원
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Workspace 펼치기/접기 상태 복원
    const newExpandedWorkspaces = new Set<string>();
    workspaces.forEach(workspace => {
      const key = getWorkspaceCollapsedKey(workspace.workspaceId);
      const isCollapsed = localStorage.getItem(key) === 'true';
      if (!isCollapsed) {
        // 기본: 펼쳐짐
        newExpandedWorkspaces.add(workspace.workspaceId);
      }
    });
    setExpandedWorkspaces(newExpandedWorkspaces);

    // 2. 선택된 페이지 복원 (우선순위)
    let pageToSelect = initialSelectedPageId;

    if (!pageToSelect) {
      // URL 파라미터 없으면 쿠키에서 복원
      const recentPageKey = getRecentPageKey();
      const recentPageId = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${recentPageKey}=`))
        ?.split('=')[1];

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
        setExpandedWorkspaces(new Set(newExpandedWorkspaces));
      }
    }
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
    (pageId: string, workspaceId: string) => {
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
        document.cookie = `${key}=${pageId}; path=/; max-age=31536000`; // 1년
      }

      // 4. 해당 Workspace 자동 펼치기
      setExpandedWorkspaces(prev => new Set(prev).add(workspaceId));

      // 5. URL 변경
      router.push(
        `/r/${organizationId}/workspace/${workspaceId}/page/${pageId}`
      );
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
        const result = await createWorkspaceAction({
          organizationId,
          ...request,
        });

        if (result.success && result.data) {
          toast.success('워크스페이스가 생성되었습니다');

          // Optimistic update
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

          // 자동으로 첫 페이지 선택
          selectPage(result.data.firstPageId, result.data.workspaceId);

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
        const result = await updateWorkspaceInfoAction(request);

        if (result.success) {
          toast.success('워크스페이스 정보가 업데이트되었습니다');

          // Optimistic update
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
