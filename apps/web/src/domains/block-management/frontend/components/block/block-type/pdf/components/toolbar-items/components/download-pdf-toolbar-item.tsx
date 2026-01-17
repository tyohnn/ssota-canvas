'use client';

import { useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Download } from 'lucide-react';

interface DownloadPdfToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  pdfUrl: string;
  filename?: string;
  disabled?: boolean;
}

export function DownloadPdfToolbarItem({
  blockId,
  blockMountId,
  pdfUrl,
  filename,
  disabled = false,
}: DownloadPdfToolbarItemProps) {
  const handleDownload = useCallback(() => {
    if (!pdfUrl) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = filename || 'document.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [pdfUrl, filename]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="flex items-center justify-center p-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onMouseDown={e => e.stopPropagation()}
          onClick={handleDownload}
          disabled={disabled || !pdfUrl}
        >
          <Download className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" hasArrow={false} sideOffset={10}>
        <p>PDF 다운로드</p>
      </TooltipContent>
    </Tooltip>
  );
}

