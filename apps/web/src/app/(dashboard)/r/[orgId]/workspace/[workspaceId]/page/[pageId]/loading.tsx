import { PageSkeleton } from '@/domains/workspace-management/frontend/components/page-viewer/page-skeleton';

/**
 * 페이지 로딩 상태
 *
 * Next.js가 자동으로 Suspense boundary를 생성하고
 * 페이지 전환 시 이 컴포넌트를 표시합니다.
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
