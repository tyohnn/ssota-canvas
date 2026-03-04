import { notFound } from 'next/navigation';
import { getDriveBlockAction } from '@/domains/drive/actions/get-drive-block.action';
import { DriveBlockDetailClient } from '@/domains/drive/frontend/components/drive-block-detail';
import { mapDriveBlockResultToData } from '@/domains/drive/shared/map-drive-block-result';

interface DriveBlockDetailPageProps {
  params: Promise<{ orgId: string; blockId: string }>;
}

/**
 * Drive block detail: /r/[orgId]/drive/[blockId]
 * Left: single block preview. Right: Editor Panel.
 * Block data is fetched on the server; loading.tsx shows skeleton during navigation.
 */
export default async function DriveBlockDetailPage({
  params,
}: DriveBlockDetailPageProps) {
  const { orgId, blockId } = await params;

  const result = await getDriveBlockAction({
    organizationId: orgId,
    blockId,
  });

  if (!result.success) {
    notFound();
  }

  const blockData = mapDriveBlockResultToData(result.data);

  return (
    <DriveBlockDetailClient
      orgId={orgId}
      blockId={blockId}
      initialBlockData={blockData}
    />
  );
}
