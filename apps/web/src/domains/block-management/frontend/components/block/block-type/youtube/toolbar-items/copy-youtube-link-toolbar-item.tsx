'use client';

import { useCallback, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Copy, Check } from 'lucide-react';

interface CopyYoutubeLinkToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  url: string;
  disabled?: boolean;
}

export function CopyYoutubeLinkToolbarItem({
  blockId,
  blockMountId,
  url,
  disabled = false,
}: CopyYoutubeLinkToolbarItemProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = useCallback(async () => {
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy YouTube link:', error);
    }
  }, [url]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="flex items-center justify-center p-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onMouseDown={e => e.stopPropagation()}
          onClick={handleCopyLink}
          disabled={disabled || !url}
        >
          {isCopied ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" hasArrow={false} sideOffset={10}>
        <p>{isCopied ? 'Copied!' : 'Copy Link'}</p>
      </TooltipContent>
    </Tooltip>
  );
}
