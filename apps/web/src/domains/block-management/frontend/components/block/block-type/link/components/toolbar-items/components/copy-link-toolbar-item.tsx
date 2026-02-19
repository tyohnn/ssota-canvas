'use client';

import { useCallback, useState } from 'react';

import { Check, Copy } from 'lucide-react';

import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';

interface CopyLinkToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  url: string;
  disabled?: boolean;
}

export function CopyLinkToolbarItem({
  blockId,
  blockMountId,
  url,
  disabled = false,
}: CopyLinkToolbarItemProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = useCallback(async () => {
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  }, [url]);

  return (
    <ToolbarIconButton
      icon={isCopied ? <Check className="text-green-600" /> : <Copy />}
      tooltip={isCopied ? 'Copied!' : 'Copy Link'}
      tooltipSide="top"
      tooltipOffset={5}
      onClick={handleCopyLink}
      disabled={disabled || !url}
      onMouseDown={e => e.stopPropagation()}
      className="h-7 w-7 p-0"
      iconClassName="size-3.5"
    />
  );
}
