import { ContentAreaSkeleton } from '../../components/skeletons';

import { RedirectToDefaultPageClient } from '../../components/redirect-client/redirect-client';

/**
 * /r/[orgId] 루트
 *
 * 해당 조직의 첫 페이지(/r/[orgId]/[pageId])로 리다이렉트.
 * 리다이렉트 전에는 헤더+캔버스 스켈레톤 표시 (r/loading과 동일 위계).
 */
export const dynamic = 'force-dynamic';

interface OrgIdPageProps {
  params: Promise<{ orgId: string }>;
}

export default async function OrgIdPage({ params }: OrgIdPageProps) {
  const { orgId } = await params;

  return (
    <RedirectToDefaultPageClient orgIdFromUrl={orgId}>
      <ContentAreaSkeleton />
    </RedirectToDefaultPageClient>
  );
}
