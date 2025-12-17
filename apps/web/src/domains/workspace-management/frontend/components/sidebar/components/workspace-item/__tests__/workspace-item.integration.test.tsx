/**
 * WorkspaceItem Integration Tests
 *
 * 컴포넌트와 Hook의 통합 동작을 검증합니다.
 * - 실제 사용자 상호작용 시뮬레이션
 * - Props와 State 흐름 검증
 * - Mock을 통한 외부 의존성 제어
 *
 * NOTE: 현재는 컴포넌트 렌더링에 필요한 의존성이 많아서
 * Hook 통합 테스트로 대체합니다.
 * 실제 컴포넌트 테스트는 E2E 테스트에서 수행합니다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWorkspaceItem } from '../core/use-workspace-item';
import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';

describe('WorkspaceItem Integration (Hook Level)', () => {
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
      {
        id: 'page-2',
        title: 'Page 2',
        icon: 'File',
        children: [
          {
            id: 'page-2-1',
            title: 'Page 2-1',
            icon: 'File',
            children: [],
            depth: 1,
            isFavorite: false,
            lastModified: new Date().toISOString(),
            parentId: 'page-2',
            order: 'a1',
          },
        ],
        depth: 0,
        isFavorite: false,
        lastModified: new Date().toISOString(),
        parentId: null,
        order: 'a1',
      },
    ],
    pageCount: 2,
    workspaceName: 'Test Workspace',
    organizationName: 'Test Organization',
  };

  beforeEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('workspace 상태가 초기화되어야 한다', () => {
    const { result } = renderHook(() =>
      useWorkspaceItem({
        workspace: mockWorkspace,
        organizationId: 'org-1',
      })
    );

    expect(result.current.workspace).toEqual(mockWorkspace);
    expect(result.current.organizationId).toBe('org-1');
  });

  it('workspace의 pages를 업데이트할 수 있어야 한다', () => {
    const { result } = renderHook(() =>
      useWorkspaceItem({
        workspace: mockWorkspace,
        organizationId: 'org-1',
      })
    );

    const newPages = [
      {
        id: 'page-3',
        title: 'Page 3',
        icon: 'File',
        children: [],
        depth: 0,
        isFavorite: false,
        lastModified: new Date().toISOString(),
        parentId: null,
        order: 'a2',
      },
    ];

    act(() => {
      result.current.updatePages(newPages);
    });

    expect(result.current.workspace.pageTree).toEqual(newPages);
  });

  it('workspace를 펼치고 접을 수 있어야 한다', () => {
    const { result } = renderHook(() =>
      useWorkspaceItem({
        workspace: mockWorkspace,
        organizationId: 'org-1',
      })
    );

    // 초기값은 true (펼쳐진 상태)
    expect(result.current.isExpanded).toBe(true);

    // 접기
    act(() => {
      result.current.toggleExpand();
    });

    expect(result.current.isExpanded).toBe(false);

    // 다시 펼치기
    act(() => {
      result.current.toggleExpand();
    });

    expect(result.current.isExpanded).toBe(true);
  });
});

