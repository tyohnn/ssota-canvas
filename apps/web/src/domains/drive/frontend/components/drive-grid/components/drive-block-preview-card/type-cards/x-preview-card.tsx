'use client';

import { useCallback } from 'react';

import { Box } from '@workspace/ui/components/ui/box';
import {
  XPreviewCard,
  hasXMetadata,
  type XMetadata,
} from '@workspace/ssota-blocks/x';

export interface XPreviewCardProps {
  title: string | null;
  properties: Record<string, unknown>;
}

function propertiesToMetadata(properties: Record<string, unknown>): XMetadata | null {
  if (!hasXMetadata(properties)) return null;
  const postId = properties.xPostId as string | undefined;
  if (!postId) return null;
  return {
    postId,
    text: (properties.xText as string) ?? '',
    authorUsername: properties.xAuthorUsername as string | undefined,
    authorName: properties.xAuthorName as string | undefined,
    authorProfileImageUrl: properties.xAuthorProfileImageUrl as string | undefined,
    postedAt: properties.xPostedAt as string | undefined,
    likeCount: properties.xLikeCount as number | undefined,
    retweetCount: properties.xRetweetCount as number | undefined,
    replyCount: properties.xReplyCount as number | undefined,
  };
}

export function XPreviewCardAdapter({
  title,
  properties,
}: XPreviewCardProps) {
  const metadata = propertiesToMetadata(properties);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = properties.url as string | undefined;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [properties.url]);

  if (!metadata) {
    return (
      <Box className="flex flex-col h-full min-h-0 p-4">
        <p className="text-sm font-medium truncate">{title || 'X Post'}</p>
        <p className="text-xs text-muted-foreground mt-1">No metadata</p>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col h-full min-h-0">
      <XPreviewCard
        metadata={metadata}
        isActive={false}
        onDoubleClick={handleDoubleClick}
      />
    </Box>
  );
}
