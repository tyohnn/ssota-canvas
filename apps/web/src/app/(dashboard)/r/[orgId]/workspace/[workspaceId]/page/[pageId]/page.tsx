import { PageViewer } from '@/domains/workspace-management/frontend/components/page-viewer/page-viewer';
import { PageSyncClient } from './page-sync-client';

interface WorkspacePageProps {
  params: Promise<{
    orgId: string;
    workspaceId: string;
    pageId: string;
  }>;
}

/**
 * 페이지 렌더링
 *
 * - URL이 Single Source of Truth
 * - PageSyncClient: 사이드바 선택 상태 동기화
 * - PageViewer: props로 pageId, workspaceId 전달 (Context는 fallback)
 */
export default async function WorkspacePageRoute({
  params,
}: WorkspacePageProps) {
  const { workspaceId, pageId } = await params;

  return (
    <>
      {/* 사이드바 하이라이트 동기화 */}
      <PageSyncClient workspaceId={workspaceId} pageId={pageId} />

      {/* 페이지 콘텐츠 렌더링 (props 기반) */}
      <div className="flex h-full">
        <div className="flex-1 overflow-auto">
          <PageViewer pageId={pageId} workspaceId={workspaceId} />
        </div>
      </div>
    </>
  );
}
