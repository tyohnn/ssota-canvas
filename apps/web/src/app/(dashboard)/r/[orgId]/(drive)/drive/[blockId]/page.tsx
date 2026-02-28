import { DriveBlockDetailClient } from '@/domains/drive/frontend/components/drive-block-detail';

interface DriveBlockDetailPageProps {
  params: Promise<{ orgId: string; blockId: string }>;
}

/**
 * Drive block detail: /r/[orgId]/drive/[blockId]
 * Left: single block preview. Right: Editor Panel.
 */
export default async function DriveBlockDetailPage({
  params,
}: DriveBlockDetailPageProps) {
  const { orgId, blockId } = await params;
  return <DriveBlockDetailClient orgId={orgId} blockId={blockId} />;
}
