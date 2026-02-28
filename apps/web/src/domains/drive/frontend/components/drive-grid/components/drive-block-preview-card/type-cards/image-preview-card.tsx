'use client';

import { Image as ImageIcon } from 'lucide-react';

import { Box } from '@workspace/ui/components/ui/box';

export interface ImagePreviewCardProps {
  title: string | null;
  properties: Record<string, unknown>;
}

export function ImagePreviewCard({
  title,
  properties,
}: ImagePreviewCardProps) {
  const imageUrl = properties.imageUrl as string | undefined;
  const caption = properties.caption as string | undefined;
  const alt = properties.alt as string | undefined;

  const displayTitle = title || caption || alt || 'Image';

  if (imageUrl) {
    return (
      <Box className="flex flex-col h-full min-h-0">
        <Box className="w-full flex-1 min-h-[80px] overflow-hidden bg-muted aspect-square relative flex items-center justify-center">
          <img
            src={imageUrl}
            alt={displayTitle}
            className="w-full h-full object-contain absolute inset-0"
            onError={e => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const parent = img.parentElement;
              const fallback = parent?.querySelector('[data-fallback]') as HTMLElement | null;
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
          <Box
            data-fallback
            className="hidden absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <ImageIcon className="w-12 h-12 text-muted-foreground shrink-0" />
          </Box>
        </Box>
        {(caption || title) && (
          <Box className="p-2 shrink-0 border-t bg-muted/30">
            <p className="text-xs text-muted-foreground line-clamp-1 truncate">
              {caption || title}
            </p>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box className="flex flex-col h-full min-h-0 p-4 justify-center items-center gap-2">
      <ImageIcon className="w-12 h-12 shrink-0 text-muted-foreground" />
      <h3 className="text-sm font-semibold text-foreground truncate w-full text-center">
        {displayTitle || 'Image'}
      </h3>
    </Box>
  );
}
