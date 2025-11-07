'use client';

import { useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { ExternalLink } from 'lucide-react';

interface OpenYoutubeToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  url: string;
  disabled?: boolean;
}

export function OpenYoutubeToolbarItem({
  blockId,
  blockMountId,
  url,
  disabled = false,
}: OpenYoutubeToolbarItemProps) {
  const handleOpenYouTube = useCallback(() => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [url]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="flex items-center justify-center p-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onMouseDown={e => e.stopPropagation()}
          onClick={handleOpenYouTube}
          disabled={disabled || !url}
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" hasArrow={false} sideOffset={10}>
        <p>YouTube에서 열기</p>
      </TooltipContent>
    </Tooltip>
  );
}
