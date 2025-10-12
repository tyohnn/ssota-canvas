import { PageViewer } from '@/domains/workspace-management/frontend/components/page-viewer/page-viewer';

/**
 * Workspace Page (조직 메인 페이지)
 *
 * Layout에서 이미 WorkspaceProvider가 설정되어 있음
 * - Sidebar: WorkspaceSidebarContent (Favorites + Workspace-Page 트리)
 * - Main: PageViewer (선택된 페이지 렌더링)
 */
export default function WorkspacePage() {
  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto">
        <PageViewer />
      </div>
    </div>
  );
}
