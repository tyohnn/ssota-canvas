'use client';

import { Box } from '@workspace/ui/components/ui/box';

export interface YoutubePreviewCardProps {
  title: string | null;
  properties: Record<string, unknown>;
}

function getVideoId(url: string): string | undefined {
  const match = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  );
  return match ? match[1] : undefined;
}

function formatRelativeTime(dateIso?: string): string {
  if (!dateIso) return '';
  try {
    const date = new Date(dateIso);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  } catch {
    return '';
  }
}

export function YoutubePreviewCard({
  title,
  properties,
}: YoutubePreviewCardProps) {
  const url = properties.url as string | undefined;
  const videoId = properties.youtubeId
    ? String(properties.youtubeId)
    : url
      ? getVideoId(url)
      : undefined;
  const thumbnailUrl =
    (properties.youtubeThumbnail as string) ??
    (videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null);
  const youtubeTitle = (properties.youtubeTitle as string) ?? title ?? 'YouTube Video';
  const channelName = properties.channelName as string | undefined;
  const viewCount = properties.viewCount as number | undefined;
  const publishedAt = properties.publishedAt as string | undefined;
  const channelThumbnail = properties.channelThumbnail as string | undefined;

  return (
    <Box className="flex flex-col h-full min-h-0">
      {thumbnailUrl && (
        <Box className="w-full shrink-0 overflow-hidden aspect-video bg-black relative">
          <img
            src={thumbnailUrl}
            alt={youtubeTitle}
            className="w-full h-full object-cover"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </Box>
      )}

      <Box className="p-3 flex items-start gap-3 bg-background border-t border-border shrink-0">
        {channelThumbnail ? (
          <img
            src={channelThumbnail}
            alt=""
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <Box className="w-9 h-9 rounded-full bg-muted shrink-0" />
        )}
        <Box className="min-w-0 flex-1 overflow-hidden">
          <h3
            className="text-sm font-semibold text-foreground line-clamp-1 leading-snug"
            title={youtubeTitle}
          >
            {youtubeTitle}
          </h3>
          <Box className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            {channelName && (
              <span className="truncate max-w-[50%]">{channelName}</span>
            )}
            {channelName && (viewCount != null || publishedAt) && (
              <span>•</span>
            )}
            {viewCount != null && (
              <span>{viewCount.toLocaleString()} views</span>
            )}
            {viewCount != null && publishedAt && <span>•</span>}
            {publishedAt && (
              <span>{formatRelativeTime(publishedAt)}</span>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
