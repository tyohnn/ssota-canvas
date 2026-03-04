'use client';

import { useCallback } from 'react';

import { Box } from '@workspace/ui/components/ui/box';
import {
  YoutubePreviewCard,
  type YoutubeMetadata,
} from '@workspace/ssota-blocks/youtube';

export interface DriveYoutubePreviewAdapterProps {
  title: string | null;
  properties: Record<string, unknown>;
}

function getVideoIdFromUrl(url: string): string | undefined {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : undefined;
}

function propertiesToMetadata(properties: Record<string, unknown>): YoutubeMetadata {
  const url = properties.url as string | undefined;
  const videoId = (properties.youtubeId as string) ?? (url ? getVideoIdFromUrl(url) : undefined);

  return {
    url,
    youtubeId: videoId,
    youtubeTitle: (properties.youtubeTitle as string) ?? (properties.title as string) ?? undefined,
    youtubeDescription: properties.youtubeDescription as string | undefined,
    youtubeThumbnail: properties.youtubeThumbnail as string | undefined,
    channelThumbnail: properties.channelThumbnail as string | undefined,
    channelName: properties.channelName as string | undefined,
    youtubeChannelId: properties.youtubeChannelId as string | undefined,
    viewCount: properties.viewCount as number | undefined,
    commentCount: properties.commentCount as number | undefined,
    likeCount: properties.likeCount as number | undefined,
    subscriberCount: properties.subscriberCount as number | undefined,
    publishedAt: properties.publishedAt as string | undefined,
  };
}

function getThumbnailUrl(properties: Record<string, unknown>, videoId: string | undefined): string | null {
  const thumb = properties.youtubeThumbnail as string | undefined;
  if (thumb) return thumb;
  if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  return null;
}

/**
 * Adapter for Drive detail left preview: renders ssota-blocks YoutubePreviewCard.
 * Converts drive block properties to YoutubeMetadata. Read-only (showPlayer=false).
 * Does not modify existing YoutubePreviewCard.
 */
export function DriveYoutubePreviewAdapter({
  title,
  properties,
}: DriveYoutubePreviewAdapterProps) {
  const metadata = propertiesToMetadata(properties);
  const url = properties.url as string | undefined;
  const videoId = metadata.youtubeId ?? (url ? getVideoIdFromUrl(url) : undefined) ?? null;
  const thumbnailUrl = getThumbnailUrl(properties, videoId ?? undefined);

  const noop = useCallback(() => {}, []);
  const noopImageError = useCallback((_e: React.SyntheticEvent<HTMLImageElement, Event>) => {}, []);

  if (!videoId && !thumbnailUrl) {
    return (
      <Box className="flex flex-col h-full min-h-0 p-4">
        <p className="text-sm font-medium truncate">{title || 'YouTube Video'}</p>
        <p className="text-xs text-muted-foreground mt-1">No metadata</p>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col h-full min-h-0">
      <YoutubePreviewCard
        properties={metadata}
        thumbnailUrl={thumbnailUrl}
        videoId={videoId}
        isActive={false}
        isLoading={false}
        hasError={false}
        showPlayer={false}
        isIframeLoading={false}
        onPlayerReady={noop}
        onImageLoad={noop}
        onImageError={noopImageError}
      />
    </Box>
  );
}
