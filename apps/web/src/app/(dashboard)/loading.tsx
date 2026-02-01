import { DashboardLoadingSkeleton } from './components/skeletons';

/**
 * (dashboard) 세그먼트 로딩.
 * 자식 페이지/레이아웃(/r 등) 로딩 시 전체 대시보드 스켈레톤 표시.
 */
export default function DashboardLoading() {
  return <DashboardLoadingSkeleton />;
}
