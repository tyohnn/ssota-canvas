import { ContentAreaSkeleton } from '../../../components/skeletons';

/**
 * /r/[orgId] (캔버스) 세그먼트 로딩.
 * page, [pageId] 경로에서 사용.
 */
export default function CanvasLoading() {
  return <ContentAreaSkeleton />;
}
