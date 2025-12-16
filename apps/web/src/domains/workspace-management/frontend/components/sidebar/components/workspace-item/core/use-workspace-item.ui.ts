'use client';

import { useState, useCallback, useEffect } from 'react';
import type {
  WorkspaceWithPagesDTO,
  PageTreeNodeDTO,
} from '@/domains/workspace-management/shared/dtos';

/**
 * WorkspaceItem UI State
 *
 * 로컬 UI 상태만 관리
 * - isExpanded: 펼침/접기 상태 (localStorage 저장)
 * - isHovered: 호버 상태
 * - isMenuOrDialogOpen: 메뉴/다이얼로그 열림 상태
 * - localWorkspace: 지역 workspace 상태 (페이지 업데이트용)
 */
export interface WorkspaceItemUIState {
  // UI 상태
  isExpanded: boolean;
  isHovered: boolean;
  isMenuOrDialogOpen: boolean;
  workspace: WorkspaceWithPagesDTO;

  // UI 액션
  setIsExpanded: (expanded: boolean) => void;
  setIsHovered: (hovered: boolean) => void;
  setIsMenuOrDialogOpen: (open: boolean) => void;
  toggleExpand: () => void;
  updateWorkspace: (updates: Partial<WorkspaceWithPagesDTO>) => void;
  updatePages: (pages: PageTreeNodeDTO[]) => void;
}

/**
 * useWorkspaceItemUI
 *
 * WorkspaceItem의 로컬 UI 상태 관리
 * - localStorage에 펼침 상태 저장
 * - 지역 workspace 상태 관리
 */
export function useWorkspaceItemUI(
  initialWorkspace: WorkspaceWithPagesDTO
): WorkspaceItemUIState {
  // Workspace 펼침/접기 상태 (localStorage로 관리)
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window === 'undefined') return true;
    const key = `ssota-workspace-collapsed-${initialWorkspace.workspaceId}`;
    return localStorage.getItem(key) !== 'true';
  });

  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOrDialogOpen, setIsMenuOrDialogOpen] = useState(false);

  const toggleExpand = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (typeof window !== 'undefined') {
      const key = `ssota-workspace-collapsed-${initialWorkspace.workspaceId}`;
      localStorage.setItem(key, String(!newExpanded));
    }
  }, [isExpanded, initialWorkspace.workspaceId]);

  // Workspace 업데이트 (지역 상태)
  const [localWorkspace, setLocalWorkspace] =
    useState<WorkspaceWithPagesDTO>(initialWorkspace);

  // initialWorkspace가 변경되면 로컬 상태도 업데이트
  // (전역 context에서 업데이트된 경우 사이드바에 반영하기 위함)
  useEffect(() => {
    setLocalWorkspace(initialWorkspace);
  }, [initialWorkspace]);

  const updateWorkspace = useCallback(
    (updates: Partial<WorkspaceWithPagesDTO>) => {
      setLocalWorkspace(prev => ({ ...prev, ...updates }));
    },
    []
  );

  const updatePages = useCallback((pages: PageTreeNodeDTO[]) => {
    setLocalWorkspace(prev => ({ ...prev, pageTree: pages }));
  }, []);

  return {
    isExpanded,
    isHovered,
    isMenuOrDialogOpen,
    workspace: localWorkspace,
    setIsExpanded,
    setIsHovered,
    setIsMenuOrDialogOpen,
    toggleExpand,
    updateWorkspace,
    updatePages,
  };
}
