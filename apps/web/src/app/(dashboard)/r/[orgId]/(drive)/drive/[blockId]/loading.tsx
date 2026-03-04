'use client';

import { useParams } from 'next/navigation';
import { DriveBlockDetailSkeleton } from '@/domains/drive/frontend/components/drive-block-detail/drive-block-detail-skeleton';

/**
 * Drive block detail segment loading.
 * Shown during navigation to /r/[orgId]/drive/[blockId] while page fetches block data.
 */
export default function DriveBlockDetailLoading() {
  const params = useParams<{ orgId: string }>();
  const orgId = params?.orgId ?? '';

  return <DriveBlockDetailSkeleton orgId={orgId} />;
}
