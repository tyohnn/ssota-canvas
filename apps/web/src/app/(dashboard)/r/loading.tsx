import { ContentAreaSkeleton } from '../components/skeletons';

/**
 * /r 세그먼트 로딩.
 * r/layout은 이미 렌더됨. SidebarInset 안에서 헤더+캔버스 스켈레톤만 표시.
 * (r/page 또는 [orgId] 세그먼트 로딩 중)
 */
export default function RLoading() {
  return <ContentAreaSkeleton />;
}
