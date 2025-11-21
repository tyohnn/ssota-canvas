import React, { Suspense } from 'react';
import { PageSyncClient } from './page-sync-client';
import { WorkspacePageHeader } from '@/domains/workspace-management/frontend/components/page-viewer/workspace-page-header';
import { CanvasLoadingSkeleton } from '@/domains/workspace-management/frontend/components/page-viewer/canvas-loading-skeleton';

interface PageLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    orgId: string;
    workspaceId: string;
    pageId: string;
  }>;
}

/**
 * 페이지 레이아웃
 *
 * - PageSyncClient: 사이드바 선택 상태 동기화 + 최근 방문 페이지 쿠키 저장
 * - WorkspacePageHeader: Breadcrumb 헤더
 * - Suspense: 페이지 콘텐츠 로딩 관리 (3-4단계 통합)
 */
export default async function PageLayout({
  children,
  params,
}: PageLayoutProps) {
  const { orgId, workspaceId, pageId } = await params;

  return (
    <>
      {/* 사이드바 하이라이트 동기화 + 최근 방문 페이지 쿠키 저장 */}
      <PageSyncClient orgId={orgId} workspaceId={workspaceId} pageId={pageId} />

      <div className="flex flex-col h-full">
        {/* Workspace 헤더 (Breadcrumb) */}
        <WorkspacePageHeader workspaceId={workspaceId} pageId={pageId} />

        {/* 페이지 콘텐츠 with Suspense */}
        <div className="flex-1 overflow-hidden">
          <Suspense fallback={<CanvasLoadingSkeleton />}>{children}</Suspense>
        </div>
      </div>
    </>
  );
}
