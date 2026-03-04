'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@workspace/ui/components/ui/resizable';
import { Button } from '@workspace/ui/components/ui/button';
import { Box } from '@workspace/ui/components/ui/box';
import { useIsMobile } from '@workspace/ui/hooks/use-mobile';
import { useDriveBlock } from '@/domains/drive/frontend/hooks/use-drive-block';
import type { DriveBlockData } from '@/domains/drive/frontend/hooks/use-drive-block';
import { DriveHeader } from '@/domains/drive/frontend/components/drive-header';

import { DriveBlockDetailContent } from './drive-block-detail-content';
import { DriveBlockPreviewPanel } from './drive-block-preview-panel';
import { DriveEditorPanelDrawer } from './drive-editor-panel-drawer';

interface DriveBlockDetailClientProps {
  orgId: string;
  blockId: string;
  /** Server-fetched block data; loading state is handled by loading.tsx */
  initialBlockData: DriveBlockData;
}

/**
 * Drive block detail page container.
 * Resizable layout: Left = block preview. Right = Editor Panel (no animation, no radius).
 * Expects initialBlockData from server; loading.tsx shows skeleton during navigation.
 */
export function DriveBlockDetailClient({
  orgId,
  blockId,
  initialBlockData,
}: DriveBlockDetailClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { data: blockData, error } = useDriveBlock(orgId, blockId, {
    initialData: initialBlockData,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  /** Mobile: drawer open by default on page entry. */
  const [drawerOpen, setDrawerOpen] = useState(true);

  const handleClose = () => {
    router.push(`/r/${orgId}/drive`);
  };

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

  const blockTitle = (blockData.title as string) ?? 'Untitled';

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        <DriveHeader orgId={orgId} blockTitle={blockTitle} />
        <Box className="flex flex-1 min-h-0 flex-col overflow-auto">
          <DriveBlockPreviewPanel block={blockData} />
          <Box className="shrink-0 p-3">
            <Button
              variant="outline"
              className="w-full rounded-md py-3"
              onClick={() => setDrawerOpen(true)}
            >
              View Summary / Notes
            </Button>
          </Box>
        </Box>
        <DriveEditorPanelDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          blockData={blockData}
          orgId={orgId}
          onClose={() => setDrawerOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <DriveHeader orgId={orgId} blockTitle={blockTitle} />
      <div className="flex flex-1 min-h-0">
        {isExpanded ? (
          <div className="flex-1 min-w-0 w-full">
            <DriveBlockDetailContent
              orgId={orgId}
              blockData={blockData}
              slot="right"
              onClose={handleClose}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(false)}
            />
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="w-full">
            <ResizablePanel
              defaultSize={40}
              minSize={30}
              maxSize={50}
              className="flex flex-col min-h-0"
            >
              <DriveBlockDetailContent
                orgId={orgId}
                blockData={blockData}
                slot="left"
                onClose={handleClose}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={60} minSize={50}>
              <DriveBlockDetailContent
                orgId={orgId}
                blockData={blockData}
                slot="right"
                onClose={handleClose}
                isExpanded={isExpanded}
                onToggleExpand={() => setIsExpanded(true)}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
