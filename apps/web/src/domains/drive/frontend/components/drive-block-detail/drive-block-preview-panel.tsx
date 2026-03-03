'use client';

import { Badge } from '@workspace/ui/components/ui/badge';
import { Box } from '@workspace/ui/components/ui/box';

import { LinkPreviewCard } from '@/domains/drive/frontend/components/drive-grid/components/drive-block-preview-card/type-cards/link-preview-card';
import { YoutubePreviewCard } from '@/domains/drive/frontend/components/drive-grid/components/drive-block-preview-card/type-cards/youtube-preview-card';
import { XPreviewCardAdapter } from '@/domains/drive/frontend/components/drive-grid/components/drive-block-preview-card/type-cards/x-preview-card';

import type { DriveBlockData } from '@/domains/drive/frontend/hooks/use-drive-block';

function getBlockTypeBadgeLabel(blockType: string): string {
  if (blockType === 'markdown') return 'note';
  if (blockType === 'x') return 'X';
  return blockType;
}

export interface DriveBlockPreviewPanelProps {
  block: DriveBlockData;
}

export function DriveBlockPreviewPanel({ block }: DriveBlockPreviewPanelProps) {
  const title = (block.title as string) ?? 'Untitled';
  const properties = (block.properties ?? {}) as Record<string, unknown>;

  const renderContent = () => {
    switch (block.blockType) {
      case 'youtube':
        return <YoutubePreviewCard title={title} properties={properties} />;
      case 'link':
        return <LinkPreviewCard title={title} properties={properties} />;
      case 'x':
        return <XPreviewCardAdapter title={title} properties={properties} />;
      default:
        return (
          <Box className="rounded-lg border bg-card p-4 shadow-sm max-w-md w-full">
            <p className="text-sm font-medium truncate">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {block.blockType}
            </p>
          </Box>
        );
    }
  };

  return (
    <div className="h-full overflow-auto bg-muted/20 p-6">
      <Box className="flex flex-col gap-3 max-w-lg">
        <Box className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary">{getBlockTypeBadgeLabel(block.blockType)}</Badge>
          <span className="text-sm font-medium text-foreground truncate">
            {title}
          </span>
        </Box>
        <Box className="min-h-0 flex-1">{renderContent()}</Box>
      </Box>
    </div>
  );
}
