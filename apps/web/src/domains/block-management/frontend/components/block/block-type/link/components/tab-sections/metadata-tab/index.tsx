/**
 * Metadata tab for link block editor.
 * Shows Open Graph metadata (url, title, description, site, etc.).
 * Uses same layout/design as YouTube metadata tab.
 */

'use client';

import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { LinkBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

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
  const props = blockData?.properties as LinkBlockProperties | undefined;

  const url = props?.url ?? '';
  const ogTitle = props?.ogTitle;
  const ogDescription = props?.ogDescription;
  const ogImage = props?.ogImage;
  const siteName = props?.siteName;
  const domain = props?.domain;
  const faviconUrl = props?.faviconUrl;
  const author = props?.author;
  const publishedAt = props?.publishedAt;
  const pageType = props?.pageType;

  const hasData =
    !!url ||
    !!ogTitle ||
    !!ogDescription ||
    !!siteName ||
    !!domain ||
    !!author ||
    !!publishedAt ||
    !!pageType;

  if (!hasData) {
    return (
      <Box className="pl-6 pr-4 py-3 min-h-[200px]">
        <Box className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No metadata available. Metadata will be loaded when you enter a URL
            and load the page.
          </p>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="pl-6 pr-4 py-3 min-h-[200px]">
      <Box className="space-y-6">
        {ogTitle && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Title
            </h3>
            <p className="text-sm font-medium">{ogTitle}</p>
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

        <Box className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Info</h3>
          <Box className="grid grid-cols-2 gap-4">
            {siteName && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">Site Name</p>
                <p className="text-sm font-medium">{siteName}</p>
              </Box>
            )}
            {domain && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">Domain</p>
                <p className="text-sm font-medium">{domain}</p>
              </Box>
            )}
            {pageType && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">Page Type</p>
                <p className="text-sm font-medium">{pageType}</p>
              </Box>
            )}
            {author && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">Author</p>
                <p className="text-sm font-medium">{author}</p>
              </Box>
            )}
            {publishedAt && (
              <Box className="space-y-1">
                <p className="text-xs text-muted-foreground">Published At</p>
                <p className="text-sm">{formatDate(publishedAt)}</p>
              </Box>
            )}
          </Box>
        </Box>

        {(siteName || domain) && (faviconUrl || ogImage) && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">Site</h3>
            <Box className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={faviconUrl ?? ogImage}
                  alt={siteName ?? domain ?? 'Site'}
                />
                <AvatarFallback>
                  {(siteName ?? domain ?? 'S').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{siteName ?? domain}</span>
            </Box>
          </Box>
        )}

        {ogImage && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Image
            </h3>
            <Box className="rounded-lg border overflow-hidden bg-muted max-w-xs">
              <img
                src={ogImage}
                alt={ogTitle ?? 'OG Image'}
                className="w-full h-auto object-contain"
              />
            </Box>
          </Box>
        )}

        {ogDescription && (
          <Box className="space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">
              Description
            </h3>
            <p className="text-sm whitespace-pre-wrap">{ogDescription}</p>
          </Box>
        )}
      </Box>
    </Box>
  );
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
