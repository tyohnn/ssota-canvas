'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { WorkspaceWithPagesDTO, PageTreeNodeDTO } from '../../shared/dtos';

// ────────────────────────────────────────────────────────────
// Context 타입 정의
// ────────────────────────────────────────────────────────────

interface WorkspaceContextValue {
  // State
  workspaces: WorkspaceWithPagesDTO[];
  selectedPageId: string | null;
  selectedWorkspaceId: string | null;
  expandedWorkspaces: Set<string>;
  expandedPages: Set<string>;
  isLoading: boolean;
  error: string | null;

  // Actions
  selectPage: (pageId: string, workspaceId: string) => void;
  toggleWorkspace: (workspaceId: string) => void;
  togglePage: (pageId: string) => void;
  setError: (error: string | null) => void;

  // Computed Values
  favoritePages: PageTreeNodeDTO[];
  selectedPage: PageTreeNodeDTO | null;
  selectedWorkspace: WorkspaceWithPagesDTO | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(
  undefined
);

// ────────────────────────────────────────────────────────────
// Provider Props
// ────────────────────────────────────────────────────────────

interface WorkspaceProviderProps {
  children: React.ReactNode;
  initialWorkspaces: WorkspaceWithPagesDTO[];
  initialSelectedPageId: string | null;
  organizationId: string;
}

// ────────────────────────────────────────────────────────────
// LocalStorage Keys
// ────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  expandedWorkspaces: (orgId: string) => `xbowl:expanded-workspaces:${orgId}`,
  expandedPages: (orgId: string) => `xbowl:expanded-pages:${orgId}`,
  recentPage: (orgId: string) => `recent-page-${orgId}`,
};

// ────────────────────────────────────────────────────────────
// Provider 구현
// ────────────────────────────────────────────────────────────

export function WorkspaceProvider({
  children,
  initialWorkspaces,
  initialSelectedPageId,
  organizationId,
}: WorkspaceProviderProps) {
  // ──────────────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────────────

  const [workspaces, setWorkspaces] =
    useState<WorkspaceWithPagesDTO[]>(initialWorkspaces);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(
    initialSelectedPageId
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

  // ──────────────────────────────────────────────────────
  // LocalStorage 초기화 (클라이언트에서만)
  // ──────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // expandedWorkspaces 로드
    const storedExpandedWorkspaces = localStorage.getItem(
      STORAGE_KEYS.expandedWorkspaces(organizationId)
    );
    if (storedExpandedWorkspaces) {
      try {
        const parsedWorkspaces = JSON.parse(
          storedExpandedWorkspaces
        ) as string[];
        setExpandedWorkspaces(new Set(parsedWorkspaces));
      } catch (e) {
        console.error(
          '[WorkspaceContext] Failed to parse expandedWorkspaces',
          e
        );
      }
    } else {
      // 기본: Default Workspace만 펼치기
      const defaultWorkspace = initialWorkspaces.find(ws => ws.isDefault);
      if (defaultWorkspace) {
        setExpandedWorkspaces(new Set([defaultWorkspace.workspaceId]));
      }
    }

    // expandedPages 로드
    const storedExpandedPages = localStorage.getItem(
      STORAGE_KEYS.expandedPages(organizationId)
    );
    if (storedExpandedPages) {
      try {
        const parsedPages = JSON.parse(storedExpandedPages) as string[];
        setExpandedPages(new Set(parsedPages));
      } catch (e) {
        console.error('[WorkspaceContext] Failed to parse expandedPages', e);
      }
    }
  }, [organizationId, initialWorkspaces]);

  // ──────────────────────────────────────────────────────
  // selectedWorkspaceId 자동 추론
  // ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedPageId) {
      setSelectedWorkspaceId(null);
      return;
    }

    // selectedPageId가 속한 Workspace 찾기
    for (const workspace of workspaces) {
      const findPage = (pages: PageTreeNodeDTO[]): boolean => {
        for (const page of pages) {
          if (page.id === selectedPageId) {
            return true;
          }
          if (page.children && findPage(page.children)) {
            return true;
          }
        }
        return false;
      };

      if (findPage(workspace.pageTree)) {
        setSelectedWorkspaceId(workspace.workspaceId);
        return;
      }
    }

    setSelectedWorkspaceId(null);
  }, [selectedPageId, workspaces]);

  // ──────────────────────────────────────────────────────
  // Actions
  // ──────────────────────────────────────────────────────

  const selectPage = useCallback(
    (pageId: string, workspaceId: string) => {
      setSelectedPageId(pageId);
      setSelectedWorkspaceId(workspaceId);

      // 쿠키에 저장 (recent-page-${orgId})
      if (typeof document !== 'undefined') {
        document.cookie = `${STORAGE_KEYS.recentPage(organizationId)}=${pageId}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7일
      }
    },
    [organizationId]
  );

  const toggleWorkspace = useCallback(
    (workspaceId: string) => {
      setExpandedWorkspaces(prev => {
        const newSet = new Set(prev);
        if (newSet.has(workspaceId)) {
          newSet.delete(workspaceId);
        } else {
          newSet.add(workspaceId);
        }

        // LocalStorage 저장
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            STORAGE_KEYS.expandedWorkspaces(organizationId),
            JSON.stringify(Array.from(newSet))
          );
        }

        return newSet;
      });
    },
    [organizationId]
  );

  const togglePage = useCallback(
    (pageId: string) => {
      setExpandedPages(prev => {
        const newSet = new Set(prev);
        if (newSet.has(pageId)) {
          newSet.delete(pageId);
        } else {
          newSet.add(pageId);
        }

        // LocalStorage 저장
        if (typeof window !== 'undefined') {
          localStorage.setItem(
            STORAGE_KEYS.expandedPages(organizationId),
            JSON.stringify(Array.from(newSet))
          );
        }

        return newSet;
      });
    },
    [organizationId]
  );

  // ──────────────────────────────────────────────────────
  // Computed Values
  // ──────────────────────────────────────────────────────

  const favoritePages = useMemo(() => {
    const favorites: PageTreeNodeDTO[] = [];

    const collectFavorites = (pages: PageTreeNodeDTO[]) => {
      for (const page of pages) {
        if (page.isFavorite) {
          favorites.push(page);
        }
        if (page.children) {
          collectFavorites(page.children);
        }
      }
    };

    for (const workspace of workspaces) {
      collectFavorites(workspace.pageTree);
    }

    return favorites;
  }, [workspaces]);

  const selectedPage = useMemo(() => {
    if (!selectedPageId) return null;

    const findPage = (pages: PageTreeNodeDTO[]): PageTreeNodeDTO | null => {
      for (const page of pages) {
        if (page.id === selectedPageId) {
          return page;
        }
        if (page.children) {
          const found = findPage(page.children);
          if (found) return found;
        }
      }
      return null;
    };

    for (const workspace of workspaces) {
      const found = findPage(workspace.pageTree);
      if (found) return found;
    }

    return null;
  }, [selectedPageId, workspaces]);

  const selectedWorkspace = useMemo(() => {
    if (!selectedWorkspaceId) return null;
    return (
      workspaces.find(ws => ws.workspaceId === selectedWorkspaceId) || null
    );
  }, [selectedWorkspaceId, workspaces]);

  // ──────────────────────────────────────────────────────
  // Context Value
  // ──────────────────────────────────────────────────────

  const value: WorkspaceContextValue = {
    // State
    workspaces,
    selectedPageId,
    selectedWorkspaceId,
    expandedWorkspaces,
    expandedPages,
    isLoading,
    error,

    // Actions
    selectPage,
    toggleWorkspace,
    togglePage,
    setError,

    // Computed
    favoritePages,
    selectedPage,
    selectedWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

// ────────────────────────────────────────────────────────────
// useWorkspace Hook
// ────────────────────────────────────────────────────────────

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}
