'use client';

import type { PropsWithChildren } from 'react';
import { WorkspaceContext } from './context';
import { useWorkspaceProvider } from './use-workspace-provider';
import type { WorkspaceProviderProps } from './types';

/**
 * WorkspaceProvider
 *
 * Workspace 전역 상태를 제공하는 Provider 컴포넌트
 *
 * 전역 상태만 관리합니다.
 * 비즈니스 로직(생성/수정/삭제)은 각 다이얼로그 컴포넌트에서 직접 action을 호출합니다.
 *
 * @example
 * ```tsx
 * <WorkspaceProvider
 *   organizationId="org-123"
 *   initialWorkspaces={workspaces}
 *   initialSelectedPageId="page-456"
 * >
 *   <App />
 * </WorkspaceProvider>
 * ```
 */
export function WorkspaceProvider({
  children,
  organizationId,
  initialWorkspaces,
  initialSelectedPageId,
}: PropsWithChildren<WorkspaceProviderProps>) {
  const value = useWorkspaceProvider({
    organizationId,
    initialWorkspaces,
    initialSelectedPageId,
  });

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}
