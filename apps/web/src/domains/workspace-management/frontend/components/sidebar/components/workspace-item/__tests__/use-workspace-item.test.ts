/**
 * useWorkspaceItem Unit Tests
 *
 * Hook의 로직을 격리하여 테스트합니다.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkspaceItem } from '../core/use-workspace-item';
import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';

describe('useWorkspaceItem', () => {
  const mockWorkspace: WorkspaceWithPagesDTO = {
    workspaceId: 'ws-1',
    name: 'Test Workspace',
    description: null,
    icon: null,
    isDefault: false,
    isPersonal: false,
    ownerId: null,
    pageTree: [
      {
        id: 'page-1',
        title: 'Page 1',
        icon: 'File',
        children: [],
        depth: 0,
        isFavorite: false,
        lastModified: new Date().toISOString(),
        parentId: null,
        order: 'a0',
      },
    ],
    pageCount: 1,
    workspaceName: 'Test Workspace',
    organizationName: 'Test Organization',
  };

  it('초기 상태에서 workspace는 펼쳐져 있어야 한다 (localStorage에 값이 없으면 기본값)', () => {
    // localStorage 초기화
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }

    const { result } = renderHook(() =>
      useWorkspaceItem({
        workspace: mockWorkspace,
        organizationId: 'org-1',
      })
    );

    // localStorage에 값이 없으면 기본적으로 펼쳐진 상태(true)
    expect(result.current.isExpanded).toBe(true);
    expect(result.current.workspace).toEqual(mockWorkspace);
  });

  it('toggleExpand를 호출하면 펼침 상태가 변경되어야 한다', () => {
    // localStorage 초기화
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }

    const { result } = renderHook(() =>
      useWorkspaceItem({
        workspace: mockWorkspace,
        organizationId: 'org-1',
      })
    );

    // 초기값은 true (펼쳐진 상태)
    expect(result.current.isExpanded).toBe(true);

    // toggleExpand 호출하면 false로 변경
    act(() => {
      result.current.toggleExpand();
    });

    expect(result.current.isExpanded).toBe(false);

    // 다시 toggleExpand 호출하면 true로 변경
    act(() => {
      result.current.toggleExpand();
    });

    expect(result.current.isExpanded).toBe(true);
  });

  it('updatePages를 호출하면 workspace의 pageTree가 업데이트되어야 한다', () => {
    const { result } = renderHook(() =>
      useWorkspaceItem({
        workspace: mockWorkspace,
        organizationId: 'org-1',
      })
    );

    const newPages = [
      {
        id: 'page-2',
        title: 'Page 2',
        icon: 'File',
        children: [],
        depth: 0,
        isFavorite: false,
        lastModified: new Date().toISOString(),
        parentId: null,
        order: 'a1',
      },
    ];

    act(() => {
      result.current.updatePages(newPages);
    });

    expect(result.current.workspace.pageTree).toEqual(newPages);
  });
});

