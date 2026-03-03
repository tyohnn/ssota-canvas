'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDriveBlock } from '@/domains/drive/frontend/hooks/use-drive-block';
import { DriveHeader } from '@/domains/drive/frontend/components/drive-header';

interface DriveBlockDetailClientProps {
  orgId: string;
  blockId: string;
}

/**
 * Drive block detail page container.
 * Left: block preview placeholder. Right: Editor Panel (standalone).
 */
export function DriveBlockDetailClient({
  orgId,
  blockId,
}: DriveBlockDetailClientProps) {
  const router = useRouter();
  const { data: blockData, isLoading, error } = useDriveBlock(orgId, blockId);

  const handleClose = () => {
    router.push(`/r/${orgId}/drive`);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <DriveHeader orgId={orgId} />
        <div className="flex flex-1 items-center justify-center p-8">
          <p className="text-muted-foreground">Loading block...</p>
        </div>
      </div>
    );
  }

  if (error || !blockData) {
    return (
      <div className="flex flex-col h-full">
        <DriveHeader orgId={orgId} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : 'Block not found'}
          </p>
          <Link
            href={`/r/${orgId}/drive`}
            className="text-sm text-primary hover:underline"
          >
            Back to Drive
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <DriveHeader orgId={orgId} />
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex items-center justify-center p-8 bg-muted/20">
          <div className="rounded-lg border bg-card p-4 shadow-sm max-w-md w-full">
            <p className="text-sm font-medium truncate">
              {blockData.title || 'Untitled'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {blockData.blockType}
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Drive standalone editor panel has been removed.
            </p>
            <Link
              href={`/r/${orgId}/drive`}
              className="mt-3 inline-block text-sm text-primary hover:underline"
            >
              Back to Drive
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
