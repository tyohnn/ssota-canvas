'use client';

import { useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { ExternalLink } from 'lucide-react';

interface OpenLinkToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  url: string;
  disabled?: boolean;
}

export function OpenLinkToolbarItem({
  blockId,
  blockMountId,
  url,
  disabled = false,
}: OpenLinkToolbarItemProps) {
  const handleOpenLink = useCallback(() => {
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
          onClick={handleOpenLink}
          disabled={disabled || !url}
        >
          <ExternalLink className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" hasArrow={false} sideOffset={10}>
        <p>링크 열기</p>
      </TooltipContent>
    </Tooltip>
  );
}
