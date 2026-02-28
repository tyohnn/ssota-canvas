'use client';

import { useCallback, useRef, useState } from 'react';

import { Image as ImageIcon } from 'lucide-react';

import { refreshImageUrlAction } from '@/domains/storage/actions/storage.actions';

import { Box } from '@workspace/ui/components/ui/box';

export interface ImagePreviewCardProps {
  title: string | null;
  properties: Record<string, unknown>;
  blockId?: string;
}

export function ImagePreviewCard({
  title,
  properties,
  blockId,
}: ImagePreviewCardProps) {
  const imageUrl = properties.imageUrl as string | undefined;
  const caption = properties.caption as string | undefined;
  const alt = properties.alt as string | undefined;
  const displayTitle = title || caption || alt || 'Image';

  const [refreshedUrl, setRefreshedUrl] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const hasTriedRefreshRef = useRef(false);

  const displayUrl = refreshedUrl ?? imageUrl;

  const handleError = useCallback(async () => {
    if (hasTriedRefreshRef.current || !blockId) {
      setHasError(true);
      return;
    }
    hasTriedRefreshRef.current = true;
    try {
      const result = await refreshImageUrlAction(blockId);
      if (result.success && result.url) {
        setRefreshedUrl(result.url);
        setHasError(false);
      } else {
        setHasError(true);
      }
    } catch {
      setHasError(true);
    }
  }, [blockId]);

  if (!displayUrl || hasError) {
    return (
      <Box className="flex flex-col h-full min-h-0 p-4 justify-center items-center gap-2">
        <ImageIcon className="w-12 h-12 shrink-0 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground truncate w-full text-center">
          {displayTitle || 'Image'}
        </h3>
      </Box>
    );
  }

  return (
    <Box className="flex flex-col h-full min-h-0">
      <Box className="relative flex-1 min-h-[80px] overflow-hidden bg-muted flex items-center justify-center">
        <img
          src={displayUrl}
          alt={displayTitle}
          className="w-full h-full object-cover absolute inset-0"
          onError={handleError}
        />
        <Box
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-linear-to-t from-card to-transparent"
          aria-hidden
        />
      </Box>
      {(caption || title) && (
          <Box className="p-2 shrink-0 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground truncate">
              {caption || title}
            </p>
          </Box>
        )}
    </Box>
  );
}
