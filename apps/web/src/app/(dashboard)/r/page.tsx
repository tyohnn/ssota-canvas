import { ContentAreaSkeleton } from '../components/skeletons';

import { RedirectToDefaultPageClient } from '../components/redirect-client/redirect-client';

/**
 * /r Root Page
 *
 * 선택 조직의 첫 페이지(/r/[orgId]/[pageId])로 리다이렉트.
 * 리다이렉트 전에는 헤더+캔버스 스켈레톤 표시 (r/loading과 동일 위계).
 */
export const dynamic = 'force-dynamic';

export default function DashboardRootPage() {
  return (
    <RedirectToDefaultPageClient>
      <ContentAreaSkeleton />
    </RedirectToDefaultPageClient>
  );
}
