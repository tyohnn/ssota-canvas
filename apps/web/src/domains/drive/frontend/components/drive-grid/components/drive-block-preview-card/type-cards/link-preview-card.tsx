'use client';

import { ExternalLink } from 'lucide-react';

import { Box } from '@workspace/ui/components/ui/box';

export interface LinkPreviewCardProps {
  title: string | null;
  properties: Record<string, unknown>;
}

function getDomain(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function LinkPreviewCard({ title, properties }: LinkPreviewCardProps) {
  const ogImage = properties.ogImage as string | undefined;
  const ogTitle = properties.ogTitle as string | undefined;
  const ogDescription = properties.ogDescription as string | undefined;
  const domain = (properties.domain as string) ?? (properties.url ? getDomain(properties.url as string) : '');
  const faviconUrl = properties.faviconUrl as string | undefined;

  const displayTitle = ogTitle || title || 'Link';

  return (
    <Box className="flex flex-col h-full min-h-0 bg-card hover:bg-muted">
      {ogImage && (
        <Box className="w-full shrink-0 overflow-hidden aspect-[2/1] bg-muted">
          <img
            src={ogImage}
            alt={displayTitle}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </Box>
      )}

      <Box className="flex-1 p-3 flex flex-col gap-1.5 min-h-0 overflow-hidden">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
          {displayTitle}
        </h3>

        {ogDescription && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {ogDescription}
          </p>
        )}
      </Box>

      {domain && (
        <Box className="p-3 pt-0 mt-auto shrink-0">
          <Box className="flex items-center gap-1.5">
            {faviconUrl && (
              <img
                src={faviconUrl}
                alt=""
                className="w-3 h-3 shrink-0"
                onError={e => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <span className="text-xs text-muted-foreground truncate">
              {domain}
            </span>
            <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
          </Box>
        </Box>
      )}
    </Box>
  );
}
