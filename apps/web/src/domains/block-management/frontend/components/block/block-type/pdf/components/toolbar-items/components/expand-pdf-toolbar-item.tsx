'use client';

import { useState, useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';
import { Expand } from 'lucide-react';

interface ExpandPdfToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  pdfUrl: string;
  filename?: string;
  disabled?: boolean;
}

export function ExpandPdfToolbarItem({
  blockId,
  blockMountId,
  pdfUrl,
  filename,
  disabled = false,
}: ExpandPdfToolbarItemProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleExpand = useCallback(() => {
    if (pdfUrl) {
      setIsDialogOpen(true);
    }
  }, [pdfUrl]);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="flex items-center justify-center p-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onMouseDown={e => e.stopPropagation()}
            onClick={handleExpand}
            disabled={disabled || !pdfUrl}
          >
            <Expand className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" hasArrow={false} sideOffset={10}>
          <p>PDF 확대</p>
        </TooltipContent>
      </Tooltip>

      {/* PDF 확대 보기 Dialog - 브라우저 네이티브 뷰어 사용 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {filename || 'PDF 확대 보기'}
          </DialogTitle>
          <div className="relative w-full h-[85vh] bg-background">
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title={filename || 'PDF 문서'}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
