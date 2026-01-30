import { DashboardShellSkeleton } from '../components/dashboard-shell-skeleton';

/**
 * /r 루트 로딩: org 데이터 + 리다이렉트 준비.
 * 실제 레이아웃(사이드바 + Inset)과 동일한 셸로 표시해 전환 시 레이아웃 시프트 없음.
 */
export default function DashboardRootLoading() {
  return <DashboardShellSkeleton />;
}
