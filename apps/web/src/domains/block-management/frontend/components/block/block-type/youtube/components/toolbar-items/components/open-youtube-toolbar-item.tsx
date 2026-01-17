'use client';

import { useCallback } from 'react';

import { ExternalLink } from 'lucide-react';

import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';

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
    <ToolbarIconButton
      icon={<ExternalLink />}
      tooltip="Open in YouTube"
      tooltipSide="top"
      tooltipOffset={5}
      onClick={handleOpenYouTube}
      disabled={disabled || !url}
      onMouseDown={e => e.stopPropagation()}
      className="h-7 w-7 p-0"
      iconClassName="size-3.5"
    />
  );
}
