/**
 * Metadata tab view
 *
 * Presentational component for Metadata tab.
 * Shared layout/design used by both YouTube and Link metadata tabs.
 */

'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/ui/avatar';

import { Box } from '@/components/ui/box';

export interface MetadataTabViewProps {
  metadata: {
    youtubeTitle?: string;
    youtubeDescription?: string;
    viewCount?: number;
    likeCount?: number;
    channelName?: string;
    youtubeChannelId?: string;
    channelThumbnail?: string;
    subscriberCount?: number;
    commentCount?: number;
    publishedAt?: string;
  };
}

export function MetadataTabView({ metadata }: MetadataTabViewProps) {
  return (
    <Box className="pl-6 pr-4 py-3 min-h-[200px]">
      <Box className="space-y-6">
        {metadata.youtubeTitle && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Video Title
            </h3>
            <p className="text-sm font-medium">{metadata.youtubeTitle}</p>
          </Box>
        )}

        <Box className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Statistics
          </h3>
          <Box className="grid grid-cols-2 gap-4">
            {metadata.viewCount !== undefined && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">View Count</p>
                <p className="text-sm font-medium">
                  {formatNumber(metadata.viewCount)}
                </p>
              </Box>
            )}
            {metadata.likeCount !== undefined && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">Like Count</p>
                <p className="text-sm font-medium">
                  {formatNumber(metadata.likeCount)}
                </p>
              </Box>
            )}
            {metadata.commentCount !== undefined && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">Comment Count</p>
                <p className="text-sm font-medium">
                  {formatNumber(metadata.commentCount)}
                </p>
              </Box>
            )}
            {metadata.subscriberCount !== undefined && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  Subscriber Count
                </p>
                <p className="text-sm font-medium">
                  {formatNumber(metadata.subscriberCount)}
                </p>
              </Box>
            )}
          </Box>
        </Box>

        {metadata.channelName && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Channel
            </h3>
            {metadata.youtubeChannelId ? (
              <a
                href={`https://www.youtube.com/channel/${metadata.youtubeChannelId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-sm text-foreground hover:opacity-80 transition-opacity"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage
                    src={metadata.channelThumbnail}
                    alt={metadata.channelName}
                  />
                  <AvatarFallback>
                    {metadata.channelName?.charAt(0).toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{metadata.channelName}</span>
              </a>
            ) : (
              <Box className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage
                    src={metadata.channelThumbnail}
                    alt={metadata.channelName}
                  />
                  <AvatarFallback>
                    {metadata.channelName?.charAt(0).toUpperCase() || 'C'}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium">{metadata.channelName}</p>
              </Box>
            )}
          </Box>
        )}

        {metadata.publishedAt && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Published At
            </h3>
            <p className="text-sm">{formatDate(metadata.publishedAt)}</p>
          </Box>
        )}

        {metadata.youtubeDescription && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Description
            </h3>
            <p className="text-sm whitespace-pre-wrap">
              {metadata.youtubeDescription}
            </p>
          </Box>
        )}

        {!metadata.youtubeTitle &&
          !metadata.viewCount &&
          !metadata.likeCount &&
          !metadata.channelName &&
          !metadata.subscriberCount &&
          !metadata.commentCount &&
          !metadata.publishedAt && (
            <Box className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No metadata available. Metadata will be loaded when the YouTube
                video URL is set.
              </p>
            </Box>
          )}
      </Box>
    </Box>
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
