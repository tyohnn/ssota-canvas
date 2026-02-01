import { ContentAreaSkeleton } from '../../components/skeletons';

/**
 * /r/[orgId] 세그먼트 로딩.
 * r/layout은 이미 렌더됨. SidebarInset 안에서 헤더+캔버스 스켈레톤만 표시.
 */
export default function OrgIdLoading() {
  return <ContentAreaSkeleton />;
}
