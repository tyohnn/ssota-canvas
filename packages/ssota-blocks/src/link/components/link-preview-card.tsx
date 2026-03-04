'use client';

import React from 'react';

import { ExternalLink } from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';
import { cn } from '@workspace/ui/lib/utils';

import type { LinkMetadata } from '../logic/types';

export interface LinkPreviewCardProps {
  metadata: LinkMetadata;
  isActive: boolean;
  normalizedDomain: string;
  currentFaviconUrl: string | null;
  onDoubleClick: (e: React.MouseEvent) => void;
}

/**
 * Link Preview Card Component
 *
 * Presentational: Open Graph card (image, title, description, domain, favicon).
 * Double-click when selected opens the URL. No hooks.
 */
export function LinkPreviewCard({
  metadata,
  isActive,
  normalizedDomain,
  currentFaviconUrl,
  onDoubleClick,
}: LinkPreviewCardProps) {
  const displayDomain = metadata.domain || normalizedDomain;

  return (
    <Box
      className={cn(
        'w-full h-full flex flex-col overflow-hidden',
        isActive && 'cursor-pointer'
      )}
      onDoubleClick={onDoubleClick}
      role={isActive ? 'button' : undefined}
      aria-label={isActive ? 'Double-click to open link' : undefined}
    >
      {metadata.imageUrl && (
        <Box
          className="relative w-full aspect-2/1 shrink-0 overflow-hidden bg-muted"
        >
          <img
            src={metadata.imageUrl}
            alt={metadata.title}
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: '50% 33%' }}
            // referrerPolicy="no-referrer"
            onError={e => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </Box>
      )}

      <Box className="flex-1 p-3 pb-2 flex flex-col gap-1.5 min-h-0 overflow-hidden">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
          {metadata.title}
        </h3>

        {metadata.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {metadata.description}
          </p>
        )}

        {metadata.type === 'article' &&
          (metadata.author || metadata.publishedAt) && (
            <Box className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              {metadata.author && (
                <span className="truncate">{metadata.author}</span>
              )}
              {metadata.author && metadata.publishedAt && <span>•</span>}
              {metadata.publishedAt && (
                <span>
                  {new Date(metadata.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </Box>
          )}
      </Box>

      <Box className="p-3 pt-0 mt-auto">
        <Box className="flex items-center gap-1.5">
          {currentFaviconUrl && (
            <img
              src={currentFaviconUrl}
              alt=""
              className="w-3 h-3 shrink-0 md:w-4 md:h-4"
            />
          )}
          <span className="text-xs text-muted-foreground truncate">
            {displayDomain}
          </span>
          <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto shrink-0" />
        </Box>
      </Box>
    </Box>
  );
}
