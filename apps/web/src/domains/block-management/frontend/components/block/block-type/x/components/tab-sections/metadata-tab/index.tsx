/**
 * Metadata tab for X block editor.
 * Shows X post metadata (author, URL, metrics, posted at). Text content is shown in the block preview only.
 */
'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { XBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/ui/avatar';

import { Box } from '@/components/ui/box';

export interface MetadataTabProps {
  blockId: string;
  blockData: BlockNodeData | undefined;
}

export default function MetadataTab({ blockId, blockData }: MetadataTabProps) {
  const props = blockData?.properties as XBlockProperties | undefined;

  const url = props?.url ?? '';
  const xAuthorUsername = props?.xAuthorUsername;
  const xAuthorName = props?.xAuthorName;
  const xAuthorProfileImageUrl = props?.xAuthorProfileImageUrl;
  const xPostedAt = props?.xPostedAt;
  const xLikeCount = props?.xLikeCount;
  const xRetweetCount = props?.xRetweetCount;
  const xReplyCount = props?.xReplyCount;

  const hasData =
    !!url ||
    !!xAuthorUsername ||
    !!xAuthorName ||
    !!xPostedAt ||
    xLikeCount != null ||
    xRetweetCount != null ||
    xReplyCount != null;

  if (!hasData) {
    return (
      <Box className="pl-6 pr-4 py-3 min-h-[200px]">
        <Box className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No metadata available. Metadata will be loaded when you enter an X
            post URL.
          </p>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="pl-6 pr-4 py-3 min-h-[200px]">
      <Box className="space-y-6">
        {(xAuthorName || xAuthorUsername) && (
          <Box className="flex items-center gap-3">
            {xAuthorProfileImageUrl && (
              <Avatar className="h-10 w-10">
                <AvatarImage src={xAuthorProfileImageUrl} alt="" />
                <AvatarFallback>
                  {(xAuthorName?.[0] ?? xAuthorUsername?.[0] ?? '?').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <Box>
              {xAuthorName && (
                <p className="text-sm font-medium">{xAuthorName}</p>
              )}
              {xAuthorUsername && (
                <p className="text-xs text-muted-foreground">
                  @{xAuthorUsername}
                </p>
              )}
            </Box>
          </Box>
        )}

        {url && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">URL</h3>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline break-all"
            >
              {url}
            </a>
          </Box>
        )}

        {(xLikeCount != null ||
          xRetweetCount != null ||
          xReplyCount != null) && (
          <Box className="flex gap-4 text-sm text-muted-foreground">
            {xLikeCount != null && <span>❤️ {xLikeCount}</span>}
            {xRetweetCount != null && <span>🔁 {xRetweetCount}</span>}
            {xReplyCount != null && <span>💬 {xReplyCount}</span>}
          </Box>
        )}

        {xPostedAt && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Posted
            </h3>
            <p className="text-sm">
              {new Date(xPostedAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          </Box>
        )}
      </Box>
    </Box>
  );
}
