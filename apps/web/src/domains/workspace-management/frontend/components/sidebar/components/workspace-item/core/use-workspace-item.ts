'use client';

import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';
import { useWorkspaceItemUI } from './use-workspace-item.ui';

/**
 * useWorkspaceItem: 통합 Hook
 *
 * Container/Presentational 패턴 적용
 * - UI State만 관리 (비즈니스 로직 없음)
 * - Context 없이 props로 데이터 전달
 */
export function useWorkspaceItem({
  workspace,
  organizationId,
}: {
  workspace: WorkspaceWithPagesDTO;
  organizationId: string;
}) {
  // UI State
  const uiState = useWorkspaceItemUI(workspace);

  return {
    ...uiState,
    organizationId,
  };
}

export type WorkspaceItemState = ReturnType<typeof useWorkspaceItem>;
