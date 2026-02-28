import { headers } from 'next/headers';

import { DashboardLoadingSkeleton } from './components/skeletons';

/**
 * (dashboard) 세그먼트 로딩.
 * x-pathname에 따라 Drive / Canvas 구분.
 * 자식 페이지/레이아웃(/r 등) 로딩 시 전체 대시보드 스켈레톤 표시.
 */
export default async function DashboardLoading() {
  const pathname = (await headers()).get('x-pathname') ?? '';
  const contentVariant = pathname.includes('/drive') ? 'drive' : 'canvas';

  return <DashboardLoadingSkeleton contentVariant={contentVariant} />;
}
