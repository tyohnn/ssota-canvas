import { DriveGridClient } from '@/domains/drive/frontend/components/drive-grid';
import { parseTypeFilterFromSearch } from '@/domains/drive/frontend/hooks/drive-blocks-query';
import { listDriveBlocksAction } from '@/domains/drive/actions/list-drive-blocks.action';

interface DrivePageProps {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ type?: string; onboarding?: string }>;
}

/**
 * Drive root: /r/[orgId]/drive
 * Server-fetches first page of blocks (with ?type= filter) and passes to client.
 */
export default async function DrivePage({
  params,
  searchParams,
}: DrivePageProps) {
  const { orgId } = await params;
  const resolvedSearchParams = await searchParams;
  const typeFilter = parseTypeFilterFromSearch(resolvedSearchParams?.type);

  const result = await listDriveBlocksAction({
    organizationId: orgId,
    limit: 24,
    typeFilter: typeFilter ?? undefined,
  });

  const initialBlocks = result.success ? result.data : null;

  return (
    <DriveGridClient
      orgId={orgId}
      initialBlocks={initialBlocks}
      initialTypeFilter={typeFilter}
    />
  );
}
