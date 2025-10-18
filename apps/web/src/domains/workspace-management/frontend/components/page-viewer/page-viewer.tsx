'use client';

import React from 'react';
import { useWorkspace } from '../../hooks/use-workspace';
import { PageHeader } from './page-header';
import { WorkspacePageHeader } from './workspace-page-header';
import { AccessDeniedPage } from './access-denied-page';
import { PageSkeleton } from './page-skeleton';

interface PageViewerProps {
  pageId?: string;
  workspaceId?: string;
}

/**
 * Page Viewer
 *
 * 선택된 페이지의 상세 정보를 표시하는 메인 영역
 * - Props 우선, Context는 fallback (URL = Single Source of Truth)
 * - Workspace 헤더 (Breadcrumb)
 * - 페이지 헤더 (제목, 아이콘, 메타 정보)
 * - 페이지 콘텐츠 (향후 Block Editor)
 * - 로딩 상태 (Skeleton)
 * - 에러 상태 (Access Denied)
 */
export function PageViewer({ pageId, workspaceId }: PageViewerProps) {
  const context = useWorkspace();

  // Props 우선, 없으면 Context fallback
  const actualPageId = pageId ?? context.selectedPageId;
  const actualWorkspaceId = workspaceId ?? context.selectedWorkspaceId;

  // Context에서 페이지 데이터 찾기
  const findPageData = React.useMemo(() => {
    if (!actualPageId || !actualWorkspaceId) return null;

    const workspace = context.workspaces.find(
      ws => ws.workspaceId === actualWorkspaceId
    );

    if (!workspace) return null;

    // 재귀적으로 페이지 찾기
    const findPageInTree = (
      pages: typeof workspace.pageTree
    ): (typeof workspace.pageTree)[0] | null => {
      for (const page of pages) {
        if (page.id === actualPageId) return page;
        if (page.children && page.children.length > 0) {
          const found = findPageInTree(page.children);
          if (found) return found;
        }
      }
      return null;
    };

    const page = findPageInTree(workspace.pageTree);

    return page
      ? {
          page,
          workspace,
          workspaceId: actualWorkspaceId,
          pageId: actualPageId,
        }
      : null;
  }, [actualPageId, actualWorkspaceId, context.workspaces]);

  const { isLoading, error } = context;

  // 로딩 상태
  if (isLoading) {
    return <PageSkeleton />;
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col h-full">
        {actualWorkspaceId && (
          <WorkspacePageHeader
            workspaceId={actualWorkspaceId}
            pageId={actualPageId}
          />
        )}
        <AccessDeniedPage
          message={error}
          workspaceName={findPageData?.workspace.name || 'Unknown Workspace'}
        />
      </div>
    );
  }

  // 페이지 없음
  if (!findPageData) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">페이지를 찾을 수 없습니다</p>
            <p className="text-sm text-muted-foreground">
              사이드바에서 페이지를 선택하세요
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 페이지 렌더링
  return (
    <div className="flex flex-col h-full">
      {/* Workspace 헤더 (Breadcrumb) */}
      <WorkspacePageHeader
        workspaceId={findPageData.workspaceId}
        pageId={findPageData.pageId}
      />

      {/* 페이지 헤더 (제목, 아이콘, 메타 정보) */}
      <PageHeader page={findPageData.page} workspace={findPageData.workspace} />

      {/* 페이지 콘텐츠 (향후 Block Editor) */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-muted-foreground">
            페이지 콘텐츠 영역 (Block Editor 구현 예정)
          </p>
        </div>
      </div>
    </div>
  );
}
