import { DriveContentSkeleton } from '@/domains/drive/frontend/components/drive-content-skeleton';

/**
 * /r/[orgId]/drive 세그먼트 로딩.
 * Drive 레이아웃(Header + Filter bar + Grid) 스켈레톤 표시.
 */
export default function DriveLoading() {
  return <DriveContentSkeleton />;
}
