'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { DriveAddDialog } from '@/domains/drive/frontend/components/drive-add-dialog';
import { DriveFilterBar } from '@/domains/drive/frontend/components/drive-grid/components/drive-filter-bar';
import { DriveGridView } from '@/domains/drive/frontend/components/drive-grid/components/drive-grid-view';
import { useDriveGrid } from '@/domains/drive/frontend/components/drive-grid/core/use-drive-grid';
import { useDriveTypeFilterFromUrl } from '@/domains/drive/frontend/components/drive-grid/core/use-drive-type-filter-from-url';
import { DriveHeader } from '@/domains/drive/frontend/components/drive-header';
import { DriveSourceJobStatusProvider } from '@/domains/drive/frontend/contexts/drive-source-job-status-context';
import { DriveStatusWindowPanel } from '@/domains/drive/frontend/components/drive-status-window';
import { Box } from '@workspace/ui/components/ui/box';

import type { DriveTypeFilter } from '@/domains/drive/frontend/hooks/drive-blocks-query';

interface DriveGridClientProps {
  orgId: string;
  /** First page from server (Next.js RSC). */
  initialBlocks?: {
    items: Array<{
      id: string;
      title: string | null;
      blockType: string;
      workspaceId: string;
      properties?: Record<string, unknown>;
      content?: unknown;
    }>;
    nextCursor: string | null;
  } | null;
  /** Type filter used when fetching initialBlocks. Used to avoid showing stale data on filter change. */
  initialTypeFilter?: DriveTypeFilter;
}

/**
 * Drive root grid container.
 * Orchestrates drive block list (infinite query), header, filter, and grid view.
 * Type filter is synced with URL ?type= for server fetch.
 */
export function DriveGridClient({
  orgId,
  initialBlocks,
  initialTypeFilter,
}: DriveGridClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { typeFilter, setTypeFilter } = useDriveTypeFilterFromUrl();
  const driveGrid = useDriveGrid({
    orgId,
    typeFilter,
    initialPage: initialBlocks,
    initialTypeFilter,
  });

  // ?onboarding: from onboarding completion → open add dialog and clean URL
  useEffect(() => {
    if (searchParams.get('onboarding') == null) return;
    setIsAddDialogOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('onboarding');
    const search = params.toString();
    const url = pathname + (search ? `?${search}` : '');
    router.replace(url, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <DriveSourceJobStatusProvider orgId={orgId}>
      <Box className="flex min-h-0 flex-1 flex-col h-full overflow-hidden relative">
        <DriveHeader orgId={orgId} />
        <DriveFilterBar
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          onAddClick={() => setIsAddDialogOpen(true)}
        />
        <DriveAddDialog
          orgId={orgId}
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
        />
        <DriveGridView
          blocks={driveGrid.blocks}
          hasNextPage={driveGrid.hasNextPage}
          isLoadingMore={driveGrid.isFetchingNextPage}
          onLoadMore={driveGrid.fetchNextPage}
          isLoading={driveGrid.isLoading}
        />
        {/* 우측 상단 Status Window */}
        <Box className="absolute top-4 right-4 z-50 pointer-events-auto">
          <DriveStatusWindowPanel />
        </Box>
      </Box>
    </DriveSourceJobStatusProvider>
  );
}
