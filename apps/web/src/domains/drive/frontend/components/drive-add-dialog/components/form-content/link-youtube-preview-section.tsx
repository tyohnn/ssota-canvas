'use client';

import React from 'react';

import {
  LinkPreviewCard,
  LinkLoadingState,
} from '@workspace/ssota-blocks/link';
import {
  YoutubeLoadingState,
  YoutubePreviewCard,
} from '@workspace/ssota-blocks/youtube';
import { Box } from '@/components/ui/box';
import { Button } from '@/components/ui/button';

import type { LinkYoutubeMetadata, LinkYoutubePhase } from '../../core/use-drive-add-dialog.ui';

interface LinkYoutubePreviewSectionProps {
  blockType: 'link' | 'youtube';
  phase: LinkYoutubePhase;
  metadata: LinkYoutubeMetadata | null;
  url: string;
  onPreviewDone: () => void;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return '';
  }
}

export function LinkYoutubePreviewSection({
  blockType,
  phase,
  metadata,
  url,
  onPreviewDone,
}: LinkYoutubePreviewSectionProps) {
  if (phase === 'form') return null;

  return (
    <Box className="flex flex-col gap-4">
      <Box className="rounded-lg border border-border overflow-hidden bg-background flex flex-col min-h-[200px]">
        {phase === 'loading' && (
          <>
            {blockType === 'link' ? <LinkLoadingState /> : <YoutubeLoadingState />}
          </>
        )}
        {phase === 'preview' && metadata && (
          <>
            {metadata.type === 'link' && (
              <Box className="h-[240px]">
                <LinkPreviewCard
                  metadata={metadata.metadata}
                  isActive={false}
                  normalizedDomain={metadata.metadata.domain || getDomain(url)}
                  currentFaviconUrl={metadata.metadata.faviconUrl || null}
                  onDoubleClick={() => {
                    if (url) window.open(url, '_blank');
                  }}
                />
              </Box>
            )}
            {metadata.type === 'youtube' && (
              <Box className="flex flex-col flex-1 min-h-0">
                <YoutubePreviewCard
                  properties={{
                    url,
                    youtubeTitle: metadata.metadata.video?.title ?? '',
                    youtubeThumbnail:
                      metadata.metadata.video?.thumbnailHighUrl ??
                      metadata.metadata.video?.thumbnailUrl,
                    channelName: metadata.metadata.channelName,
                    channelThumbnail: metadata.metadata.channelThumbnail,
                    viewCount: metadata.metadata.video?.viewCount ?? 0,
                    publishedAt: metadata.metadata.video?.publishedAt,
                  }}
                  thumbnailUrl={
                    metadata.metadata.video?.thumbnailHighUrl ??
                    metadata.metadata.video?.thumbnailUrl ??
                    null
                  }
                  videoId={metadata.metadata.video?.slug ?? null}
                  isActive={false}
                  isLoading={false}
                  hasError={false}
                  showPlayer={false}
                  isIframeLoading={false}
                  onPlayerReady={() => {}}
                  onImageLoad={() => {}}
                  onImageError={() => {}}
                />
              </Box>
            )}
          </>
        )}
      </Box>
      {phase === 'preview' && (
        <Box className="flex justify-end">
          <Button onClick={onPreviewDone}>Done</Button>
        </Box>
      )}
    </Box>
  );
}
