'use client';

import Link from 'next/link';

import { Badge } from '@workspace/ui/components/ui/badge';
import { Box } from '@workspace/ui/components/ui/box';

import { LinkPreviewCard } from './type-cards/link-preview-card';
import { YoutubePreviewCard } from './type-cards/youtube-preview-card';
import { PdfPreviewCard } from './type-cards/pdf-preview-card';
import { ImagePreviewCard } from './type-cards/image-preview-card';
import { AudioPreviewCard } from './type-cards/audio-preview-card';
import { MarkdownPreviewCard } from './type-cards/markdown-preview-card';

export interface DriveBlockPreviewCardViewProps {
  block: {
    id: string;
    title: string | null;
    blockType: string;
    workspaceId?: string;
    properties?: Record<string, unknown>;
    content?: unknown;
  };
  orgId: string | undefined;
}

function getBlockTypeBadgeLabel(blockType: string): string {
  return blockType === 'markdown' ? 'note' : blockType;
}

export function DriveBlockPreviewCardView({
  block,
  orgId,
}: DriveBlockPreviewCardViewProps) {
  const href = orgId ? `/r/${orgId}/drive/${block.id}` : '#';

  const renderContent = () => {
    switch (block.blockType) {
      case 'link':
        return (
          <LinkPreviewCard
            title={block.title}
            properties={block.properties ?? {}}
          />
        );
      case 'youtube':
        return (
          <YoutubePreviewCard
            title={block.title}
            properties={block.properties ?? {}}
          />
        );
      case 'pdf':
        return (
          <PdfPreviewCard
            title={block.title}
            properties={block.properties ?? {}}
            blockId={block.id}
            workspaceId={block.workspaceId}
          />
        );
      case 'image':
        return (
          <ImagePreviewCard
            title={block.title}
            properties={block.properties ?? {}}
            blockId={block.id}
          />
        );
      case 'audio':
        return (
          <AudioPreviewCard
            title={block.title}
            properties={block.properties ?? {}}
          />
        );
      case 'markdown':
        return (
          <MarkdownPreviewCard
            title={block.title}
            properties={block.properties ?? {}}
            content={block.content}
          />
        );
      default:
        return (
          <MarkdownPreviewCard
            title={block.title}
            properties={block.properties ?? {}}
            content={block.content}
          />
        );
    }
  };

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-md border bg-card shadow-sm transition-colors hover:bg-muted overflow-hidden aspect-square min-h-[140px]"
    >
      <Box className="p-2 flex shrink-0 border-b items-center gap-2 min-w-0">
        <Badge variant="secondary" className="shrink-0">
          {getBlockTypeBadgeLabel(block.blockType)}
        </Badge>
        <span className="text-sm font-medium text-foreground truncate flex-1">
          {block.title || 'Untitled'}
        </span>
      </Box>
      <Box className="flex-1 min-h-0 overflow-hidden">{renderContent()}</Box>
    </Link>
  );
}
