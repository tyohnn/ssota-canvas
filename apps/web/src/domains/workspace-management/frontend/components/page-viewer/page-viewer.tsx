'use client';

import React from 'react';
import { useWorkspace } from '../../hooks/use-workspace';
import { PageHeader } from './page-header';
import { WorkspacePageHeader } from './workspace-page-header';
import { AccessDeniedPage } from './access-denied-page';
import { PageSkeleton } from './page-skeleton';

/**
 * Page Viewer
 *
 * 선택된 페이지의 상세 정보를 표시하는 메인 영역
 * - Workspace 헤더 (Breadcrumb)
 * - 페이지 헤더 (제목, 아이콘, 메타 정보)
 * - 페이지 콘텐츠 (향후 Block Editor)
 * - 로딩 상태 (Skeleton)
 * - 에러 상태 (Access Denied)
 */
export function PageViewer() {
  const {
    selectedPage,
    selectedWorkspace,
    selectedPageId,
    selectedWorkspaceId,
    isLoading,
    error,
  } = useWorkspace();

  // 로딩 상태
  if (isLoading) {
    return <PageSkeleton />;
  }

  // 에러 상태
  if (error) {
    return (
      <div className="flex flex-col h-full">
        {selectedWorkspaceId && (
          <WorkspacePageHeader
            workspaceId={selectedWorkspaceId}
            pageId={selectedPageId}
          />
        )}
        <AccessDeniedPage
          message={error}
          workspaceName={selectedWorkspace?.name || 'Unknown Workspace'}
        />
      </div>
    );
  }

  // 페이지 없음
  if (!selectedPage || !selectedWorkspaceId) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">No page selected</p>
            <p className="text-sm text-muted-foreground">
              Select a page from the sidebar
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
        workspaceId={selectedWorkspaceId}
        pageId={selectedPageId}
      />

      {/* 페이지 헤더 (제목, 아이콘, 메타 정보) */}
      <PageHeader page={selectedPage} workspace={selectedWorkspace} />

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
