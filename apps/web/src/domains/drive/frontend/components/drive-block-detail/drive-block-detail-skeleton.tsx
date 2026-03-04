'use client';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@workspace/ui/components/ui/resizable';
import { Box } from '@workspace/ui/components/ui/box';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { DriveHeader } from '@/domains/drive/frontend/components/drive-header';

/**
 * Drive block detail loading skeleton.
 * Matches the actual layout: Header + Left preview panel + Right editor panel.
 */
export function DriveBlockDetailSkeleton({ orgId }: { orgId: string }) {
  return (
    <Box className="flex flex-col h-full">
      <DriveHeader orgId={orgId} />
      <Box className="flex flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal" className="w-full">
          <ResizablePanel defaultSize={40} minSize={30}>
            {/* Left: Preview panel skeleton */}
            <Box className="h-full overflow-auto bg-muted/20 p-2">
              <Box className="flex flex-col max-w-lg w-full">
                <Box className="relative flex flex-col min-h-0 w-full rounded-lg border border-border overflow-hidden bg-background shadow-sm aspect-310/280">
                  <Box className="p-2 flex shrink-0 border-b border-border items-center gap-2 min-w-0">
                    <Skeleton className="h-5 w-12 rounded-md shrink-0" />
                    <Skeleton className="h-4 flex-1 max-w-[180px] rounded-md" />
                  </Box>
                  <Box className="flex-1 min-h-0 p-4 space-y-3">
                    <Skeleton className="h-4 w-3/4 rounded-md" />
                    <Skeleton className="h-3 w-1/2 rounded-md" />
                    <Skeleton className="h-3 w-full rounded-md" />
                  </Box>
                </Box>
              </Box>
            </Box>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={60} minSize={30}>
            {/* Right: Editor panel skeleton */}
            <Box className="h-full flex flex-col border-l bg-background overflow-hidden">
              <Box className="shrink-0 flex items-center justify-between p-4">
                <Box className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                </Box>
                <Box className="flex items-center gap-2">
                  <Skeleton className="h-6 w-6 rounded-md" />
                  <Skeleton className="h-6 w-6 rounded-md" />
                </Box>
              </Box>
              <Box className="flex-1 min-h-0 overflow-y-auto space-y-0">
                <Box className="p-4">
                  <Skeleton className="h-10 w-3/4 rounded-md" />
                </Box>
                <Box className="border-t border-border/40 px-4 py-4 space-y-4">
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-9 w-full rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </Box>
                <Box className="border-t border-border/40 px-4 py-4">
                  <Skeleton className="h-8 w-full rounded-md" />
                </Box>
              </Box>
            </Box>
          </ResizablePanel>
        </ResizablePanelGroup>
      </Box>
    </Box>
  );
}
