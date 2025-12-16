/**
 * WorkspaceItem 테스트 유틸리티
 *
 * 테스트에서 자주 사용하는 헬퍼 함수들
 */

import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';
import { WorkspaceItem } from '../index';
import { useWorkspace } from '@/domains/workspace-management/frontend/hooks/use-workspace';
import type { WorkspaceWithPagesDTO } from '@/domains/workspace-management/shared/dtos';

// Mock useWorkspace
vi.mock('@/domains/workspace-management/frontend/hooks/use-workspace');

/**
 * WorkspaceItem을 렌더링하는 헬퍼 함수
 */
export function renderWorkspaceItem(
  workspace: WorkspaceWithPagesDTO,
  options?: {
    organizationId?: string;
    selectedPageId?: string | null;
    selectedWorkspaceId?: string | null;
    selectPage?: (pageId: string, workspaceId: string) => void;
    setWorkspaces?: (updater: any) => void;
  },
  renderOptions?: RenderOptions
): ReturnType<typeof render> {
  const mockUseWorkspace = vi.mocked(useWorkspace);
  mockUseWorkspace.mockReturnValue({
    organizationId: options?.organizationId || 'org-1',
    workspaces: [workspace],
    setWorkspaces: options?.setWorkspaces || vi.fn(),
    selectedPageId: options?.selectedPageId || null,
    selectedWorkspaceId: options?.selectedWorkspaceId || null,
    selectPage: options?.selectPage || vi.fn(),
    selectedPage: null,
    selectedWorkspace: null,
    defaultWorkspace: null,
    favoritePages: [],
    findPageById: vi.fn(() => null),
    getWorkspaceByPage: vi.fn(() => null),
  });

  return render(<WorkspaceItem workspace={workspace} />, renderOptions);
}

/**
 * Mock Workspace 데이터 생성
 */
export function createMockWorkspace(
  overrides?: Partial<WorkspaceWithPagesDTO>
): WorkspaceWithPagesDTO {
  return {
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
    ...overrides,
  };
}

/**
 * Mock Page 데이터 생성
 */
export function createMockPage(overrides?: Partial<WorkspaceWithPagesDTO['pageTree'][0]>) {
  return {
    id: `page-${Date.now()}`,
    title: 'Test Page',
    icon: 'File',
    children: [],
    depth: 0,
    isFavorite: false,
    lastModified: new Date().toISOString(),
    parentId: null,
    order: 'a0',
    ...overrides,
  };
}

