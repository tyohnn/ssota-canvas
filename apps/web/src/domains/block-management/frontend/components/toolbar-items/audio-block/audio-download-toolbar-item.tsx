'use client';

import { Download } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';
import { useCallback } from 'react';

interface AudioDownloadToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  audioUrl: string;
  title?: string;
  disabled?: boolean;
}

export function AudioDownloadToolbarItem({
  blockId,
  blockMountId,
  audioUrl,
  title,
  disabled = false,
}: AudioDownloadToolbarItemProps) {
  const handleDownload = useCallback(async () => {
    if (!audioUrl) return;

    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = title || 'audio-file.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download audio:', error);
    }
  }, [audioUrl, title]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className={cn(
            'flex items-center justify-center p-1 rounded-md',
            'hover:bg-black/5 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          onMouseDown={e => e.stopPropagation()}
          onClick={e => {
            e.stopPropagation();
            handleDownload();
          }}
          disabled={disabled || !audioUrl}
          aria-label="다운로드"
        >
          <Download className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>다운로드</p>
      </TooltipContent>
    </Tooltip>
  );
}
