'use client';

import { Badge } from '@workspace/ui/components/ui/badge';
import { Box } from '@workspace/ui/components/ui/box';
import { cn } from '@workspace/ui/lib/utils';

import { DriveLinkPreviewAdapter } from '@/domains/drive/frontend/components/drive-block-detail/drive-link-preview-adapter';
import { DrivePdfPreviewAdapter } from '@/domains/drive/frontend/components/drive-block-detail/drive-pdf-preview-adapter';
import { DriveYoutubePreviewAdapter } from '@/domains/drive/frontend/components/drive-block-detail/drive-youtube-preview-adapter';
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
        return <DriveYoutubePreviewAdapter title={title} properties={properties} />;
      case 'link':
        return <DriveLinkPreviewAdapter title={title} properties={properties} />;
      case 'x':
        return <XPreviewCardAdapter title={title} properties={properties} />;
      case 'pdf':
        return (
          <DrivePdfPreviewAdapter
            title={title}
            properties={properties}
            blockId={block.blockId}
            workspaceId={block.workspaceId}
          />
        );
      default:
        return (
          <Box className="flex flex-col justify-center p-4">
            <p className="text-sm font-medium truncate">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {block.blockType}
            </p>
          </Box>
        );
    }
  };

  const isYoutube = block.blockType === 'youtube';
  const cardAspect = isYoutube ? 'aspect-[410/288]' : 'aspect-[310/280]';

  return (
    <div className="h-full overflow-auto bg-muted/20 p-2">
      <Box className="flex flex-col max-w-lg w-full">
        <Box
          className={cn(
            'relative flex flex-col min-h-0 w-full rounded-md border border-border overflow-hidden bg-background shadow-md',
            cardAspect,
            '[-webkit-mask:linear-gradient(#000_0_0)] [mask:linear-gradient(#000_0_0)]'
          )}
        >
          <Box className="p-2 flex shrink-0 border-b border-border items-center gap-2 min-w-0">
            <Badge variant="secondary" className="shrink-0">
              {getBlockTypeBadgeLabel(block.blockType)}
            </Badge>
            <span className="text-sm font-medium text-foreground truncate flex-1">
              {title}
            </span>
          </Box>
          <Box className="flex-1 min-h-0 overflow-hidden">{renderContent()}</Box>
        </Box>
      </Box>
    </div>
  );
}
