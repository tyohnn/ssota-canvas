'use client';

import { createContext, useContext } from 'react';
import type { WorkspaceContextValue } from './types';

/**
 * WorkspaceContext
 *
 * Workspace 전역 상태를 제공하는 Context
 */
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(
  null
);

/**
 * useWorkspaceContext
 *
 * WorkspaceContext에 접근하기 위한 hook
 *
 * @throws {Error} WorkspaceProvider 외부에서 사용 시 에러 발생
 * @returns {WorkspaceContextValue} Workspace 전역 상태
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { workspaces, selectedPageId } = useWorkspaceContext();
 *   // ...
 * }
 * ```
 */
export function useWorkspaceContext(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error(
      'useWorkspaceContext must be used within a WorkspaceProvider'
    );
  }

  return context;
}
