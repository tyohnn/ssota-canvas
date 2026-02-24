'use client';

import { useCallback } from 'react';

import { Download } from 'lucide-react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { cn } from '@workspace/ui/lib/utils';

interface AudioDownloadToolbarItemProps {
  audioUrl: string;
  filename?: string;
  disabled?: boolean;
}

export function AudioDownloadToolbarItem({
  audioUrl,
  filename,
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
      a.download = filename || 'audio-file.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download audio:', error);
    }
  }, [audioUrl, filename]);

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
          aria-label="Download"
        >
          <Download className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>Download</p>
      </TooltipContent>
    </Tooltip>
  );
}
