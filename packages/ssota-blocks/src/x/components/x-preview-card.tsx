'use client';

import React from 'react';

import { Heart, MessageCircle, Repeat2 } from 'lucide-react';
import { DATA_CANVAS_SCROLL_CHAIN } from '@workspace/ui/lib/canvas-scroll-chain';
import { Box } from '@workspace/ui/components/ui/box';
import { XIcon } from '@workspace/ui/components/ssota-ui/x-icon';
import { cn } from '@workspace/ui/lib/utils';

import type { XMetadata } from '../logic/types';
import {
  buildAuthorProfileUrl,
  buildPostPermalink,
  renderTextWithEntities,
} from '../logic/utils';

export interface XPreviewCardProps {
  metadata: XMetadata;
  isActive: boolean;
  onDoubleClick: (e: React.MouseEvent) => void;
}

export function XPreviewCard({
  metadata,
  isActive,
  onDoubleClick,
}: XPreviewCardProps) {
  const displayName = metadata.authorName ?? metadata.authorUsername ?? 'X User';
  const postPermalink = buildPostPermalink(metadata.postId);
  const authorProfileUrl =
    metadata.authorUsername && buildAuthorProfileUrl(metadata.authorUsername);

  const AuthorLink = ({ children }: { children: React.ReactNode }) =>
    authorProfileUrl ? (
      <a
        href={authorProfileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </a>
    ) : (
      <Box className="flex items-center gap-3 min-w-0 flex-1">{children}</Box>
    );

  return (
    <Box
      className={cn(
        'w-full h-full flex flex-col overflow-hidden',
        isActive && 'cursor-pointer'
      )}
      onDoubleClick={onDoubleClick}
      role={isActive ? 'button' : undefined}
      aria-label={isActive ? 'Double-click to open post' : undefined}
    >
      {/* Header: fixed; no scroll */}
      <Box className="shrink-0 p-4 pb-0">
        <Box className="flex items-center gap-3">
          <AuthorLink>
            {metadata.authorProfileImageUrl && (
              <img
                src={metadata.authorProfileImageUrl}
                alt=""
                className="w-10 h-10 rounded-full shrink-0"
              />
            )}
            <Box className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate">
                {displayName}
              </p>
              {metadata.authorUsername && (
                <p className="text-xs text-muted-foreground truncate">
                  @{metadata.authorUsername}
                </p>
              )}
            </Box>
          </AuthorLink>
          <XIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        </Box>
      </Box>

      {/* Content area: fixed height so only this part scrolls; footer stays visible */}
      <Box className="flex-1 flex flex-col min-h-0 p-4 pt-3">
        {/* Scrollable body only when selected */}
        <Box
          className={cn(
            'flex-1 min-h-0',
            isActive ? 'overflow-auto' : 'overflow-hidden'
          )}
          {...(isActive ? { [DATA_CANVAS_SCROLL_CHAIN]: '' } : {})}
        >
          <p
            className={cn(
              'text-sm text-foreground whitespace-pre-wrap wrap-break-word',
              !isActive && 'line-clamp-6'
            )}
          >
            {renderTextWithEntities(metadata.text, metadata.entities)}
          </p>
        </Box>

        {/* Footer: always visible (likes, retweets, reply, date) */}
        <Box className="shrink-0 flex flex-col gap-2 pt-3 mt-auto">
          {(metadata.likeCount != null ||
            metadata.retweetCount != null ||
            metadata.replyCount != null) && (
            <Box className="flex items-center gap-4 text-xs text-muted-foreground">
              {metadata.likeCount != null && (
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  {metadata.likeCount}
                </span>
              )}
              {metadata.retweetCount != null && (
                <span className="flex items-center gap-1">
                  <Repeat2 className="w-3.5 h-3.5" />
                  {metadata.retweetCount}
                </span>
              )}
              {metadata.replyCount != null && (
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {metadata.replyCount}
                </span>
              )}
            </Box>
          )}

          {metadata.postedAt && (
            <a
              href={postPermalink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
              onClick={e => e.stopPropagation()}
            >
              {new Date(metadata.postedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </a>
          )}
        </Box>
      </Box>
    </Box>
  );
}
