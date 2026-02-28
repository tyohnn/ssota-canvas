'use client';

import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Box } from '@workspace/ui/components/ui/box';
import { Button } from '@workspace/ui/components/ui/button';

import { DriveBlockPreviewCardView } from './drive-block-preview-card';
import { DriveGridSkeleton } from './drive-grid-skeleton';

export interface DriveBlockItem {
  id: string;
  title: string | null;
  blockType: string;
  workspaceId: string;
  properties?: Record<string, unknown>;
  content?: unknown;
}

interface DriveGridViewProps {
  blocks: DriveBlockItem[];
  hasNextPage: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  isLoading: boolean;
}

/**
 * Presentational Drive grid. Receives blocks and callbacks only.
 */
export function DriveGridView({
  blocks,
  hasNextPage,
  isLoadingMore,
  onLoadMore,
  isLoading,
}: DriveGridViewProps) {
  const params = useParams();
  const orgId = params?.orgId as string | undefined;

  if (isLoading) {
    return <DriveGridSkeleton />;
  }

  return (
    <Box className="flex flex-1 min-h-0 flex-col overflow-y-auto p-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Box className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {blocks.map(block => (
          <DriveBlockPreviewCardView
            key={block.id}
            block={block}
            orgId={orgId}
          />
        ))}
      </Box>
      {hasNextPage && (
        <Box className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onLoadMore()}
            disabled={isLoadingMore}
            className="gap-2"
          >
            {isLoadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Load more'
            )}
          </Button>
        </Box>
      )}
    </Box>
  );
}
