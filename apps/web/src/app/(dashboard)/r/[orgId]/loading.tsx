import { DashboardShellSkeleton } from '../../components/dashboard-shell-skeleton';

/**
 * /r/orgId 레이아웃 로딩: org/workspace 데이터 로드 중.
 * 실제 [orgId]/layout과 동일한 셸(사이드바 + Inset)로 표시해 전환 시 레이아웃 시프트 없음.
 */
export default function OrgIdLoading() {
  return <DashboardShellSkeleton />;
}
