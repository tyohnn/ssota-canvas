import { PageSkeleton } from '@/domains/workspace-management/frontend/components/page-viewer/page-skeleton';

/**
 * Workspace 로딩 상태
 *
 * Workspace 페이지 전환 시 표시되는 로딩 화면
 */
export default function Loading() {
  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-auto">
        <PageSkeleton />
      </div>
    </div>
  );
}
