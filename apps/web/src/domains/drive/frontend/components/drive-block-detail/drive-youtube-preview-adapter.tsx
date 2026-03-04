'use client';

import { useCallback, useEffect, useRef } from 'react';

import { Box } from '@workspace/ui/components/ui/box';
import {
  YoutubePreviewCard,
  type YoutubeMetadata,
  type YouTubePlayer,
} from '@workspace/ssota-blocks/youtube';
import { YoutubeBlockInteractions } from '@/domains/block-management/frontend/components/block/block-type/youtube/config/youtube-block-interactions';
import { useDriveBlockInteraction } from '@/domains/drive/frontend/contexts/drive-block-interaction-context';

export interface DriveYoutubePreviewAdapterProps {
  title: string | null;
  properties: Record<string, unknown>;
  /** Drive block id. When set, player is shown and seekTo is registered for timeline tab clicks. */
  blockId?: string;
}

function getVideoIdFromUrl(url: string): string | undefined {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : undefined;
}

/** YouTube embed expects 11-char id; properties.youtubeId can be YouTube App Space UUID. */
function getEmbedVideoId(properties: Record<string, unknown>): string | undefined {
  const url = properties.url as string | undefined;
  const fromUrl = url ? getVideoIdFromUrl(url) : undefined;
  if (fromUrl) return fromUrl;
  const id = properties.youtubeId as string | undefined;
  if (id && id.length === 11 && /^[a-zA-Z0-9_-]+$/.test(id)) return id;
  return undefined;
}

function propertiesToMetadata(properties: Record<string, unknown>): YoutubeMetadata {
  const url = properties.url as string | undefined;
  const videoId = getEmbedVideoId(properties);

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
 * When blockId is set, shows player and registers seekTo so timeline tab can seek.
 */
export function DriveYoutubePreviewAdapter({
  title,
  properties,
  blockId,
}: DriveYoutubePreviewAdapterProps) {
  const metadata = propertiesToMetadata(properties);
  const videoId = getEmbedVideoId(properties) ?? null;
  const thumbnailUrl = getThumbnailUrl(properties, videoId ?? undefined);

  const driveInteraction = useDriveBlockInteraction();
  const playerRef = useRef<YouTubePlayer | null>(null);

  const showPlayer = Boolean(blockId && videoId);

  const onPlayerReady = useCallback(
    (event: { target: YouTubePlayer }) => {
      playerRef.current = event.target;
      if (!blockId || !driveInteraction) return;
      driveInteraction.registerBlockInteractions(blockId, {
        seekTo: (seconds: unknown) => {
          const s = typeof seconds === 'number' ? seconds : Number(seconds);
          if (!Number.isFinite(s)) return;
          YoutubeBlockInteractions.seekTo(
            { current: playerRef.current },
            s
          );
        },
      });
    },
    [blockId, driveInteraction]
  );

  useEffect(() => {
    if (!blockId || !driveInteraction) return;
    return () => {
      driveInteraction.unregisterBlockInteractions(blockId);
    };
  }, [blockId, driveInteraction]);

  const noop = useCallback(() => { }, []);
  const noopImageError = useCallback((_e: React.SyntheticEvent<HTMLImageElement, Event>) => { }, []);

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
        showPlayer={showPlayer}
        isIframeLoading={false}
        onPlayerReady={onPlayerReady}
        onImageLoad={noop}
        onImageError={noopImageError}
      />
    </Box>
  );
}
