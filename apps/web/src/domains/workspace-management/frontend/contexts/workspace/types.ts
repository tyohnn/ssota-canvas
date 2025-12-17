import type { ReactNode } from 'react';
import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';

/**
 * WorkspaceContextValue
 *
 * Workspace Context가 제공하는 전역 상태
 * - 전역 상태만 관리 (비즈니스 로직은 각 컴포넌트에서 직접 action 호출)
 */
export interface WorkspaceContextValue {
  // 기본 상태
  organizationId: string;
  workspaces: WorkspaceWithPagesDTO[];
  setWorkspaces: React.Dispatch<React.SetStateAction<WorkspaceWithPagesDTO[]>>;

  // 전역 Page 선택 상태 (앱 전체에서 하나만 선택)
  selectedPageId: string | null;
  selectedWorkspaceId: string | null;
  setSelectedPageId: React.Dispatch<React.SetStateAction<string | null>>;
  setSelectedWorkspaceId: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * WorkspaceProviderProps
 *
 * WorkspaceProvider 컴포넌트의 Props
 */
export interface WorkspaceProviderProps {
  children: ReactNode;
  organizationId: string;
  initialWorkspaces: WorkspaceWithPagesDTO[];
  initialSelectedPageId?: string | null;
}

/**
 * UseWorkspaceProviderParams
 *
 * useWorkspaceProvider hook의 파라미터
 */
export interface UseWorkspaceProviderParams {
  organizationId: string;
  initialWorkspaces: WorkspaceWithPagesDTO[];
  initialSelectedPageId?: string | null;
}
