'use client';

import { useCallback } from 'react';

import { Box } from '@workspace/ui/components/ui/box';
import {
  LinkPreviewCard,
  type LinkMetadata,
} from '@workspace/ssota-blocks/link';

export interface DriveLinkPreviewAdapterProps {
  title: string | null;
  properties: Record<string, unknown>;
}

function getDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function propertiesToMetadata(properties: Record<string, unknown>): LinkMetadata | null {
  const ogTitle = properties.ogTitle as string | undefined;
  const ogDescription = properties.ogDescription as string | undefined;
  const ogImage = properties.ogImage as string | undefined;

  if (!ogTitle && !ogDescription && !ogImage) return null;

  const url = properties.url as string | undefined;
  const domain = (properties.domain as string) ?? (url ? getDomain(url) : '');
  const normalizedDomain = domain
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();

  return {
    title: ogTitle ?? '',
    description: ogDescription ?? '',
    imageUrl: ogImage ?? '',
    siteName: (properties.siteName as string) ?? '',
    domain: normalizedDomain,
    faviconUrl: (properties.faviconUrl as string) ?? '',
    type: (properties.pageType as string) ?? 'website',
    author: properties.author as string | undefined,
    publishedAt: properties.publishedAt as string | undefined,
  };
}

function getCurrentFaviconUrl(
  metadata: LinkMetadata | null,
  properties: Record<string, unknown>
): string | null {
  if (metadata?.faviconUrl?.trim()) return metadata.faviconUrl.trim();
  const domain = (metadata?.domain ?? properties.domain) as string | undefined;
  if (domain)
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  return null;
}

/**
 * Adapter for Drive detail left preview: renders ssota-blocks LinkPreviewCard.
 * Converts drive block properties to LinkMetadata. Does not modify existing LinkPreviewCard.
 */
export function DriveLinkPreviewAdapter({
  title,
  properties,
}: DriveLinkPreviewAdapterProps) {
  const metadata = propertiesToMetadata(properties);
  const url = properties.url as string | undefined;

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    },
    [url]
  );

  if (!metadata) {
    return (
      <Box className="flex flex-col h-full min-h-0 p-4">
        <p className="text-sm font-medium truncate">{title || 'Link'}</p>
        <p className="text-xs text-muted-foreground mt-1">No metadata</p>
      </Box>
    );
  }

  const normalizedDomain = metadata.domain;
  const currentFaviconUrl = getCurrentFaviconUrl(metadata, properties);

  return (
    <Box className="flex flex-col h-full min-h-0">
      <LinkPreviewCard
        metadata={metadata}
        isActive={!!url}
        normalizedDomain={normalizedDomain}
        currentFaviconUrl={currentFaviconUrl}
        onDoubleClick={handleDoubleClick}
      />
    </Box>
  );
}
