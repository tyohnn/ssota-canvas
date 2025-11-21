'use client';

import { useState, useCallback } from 'react';
import { Button } from '@workspace/ui/components/ui/button';
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

interface ExpandImageToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  imageUrl: string;
  alt?: string;
  disabled?: boolean;
}

export function ExpandImageToolbarItem({
  blockId,
  blockMountId,
  imageUrl,
  alt,
  disabled = false,
}: ExpandImageToolbarItemProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleExpand = useCallback(() => {
    if (imageUrl) {
      setIsDialogOpen(true);
    }
  }, [imageUrl]);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={handleExpand}
            variant="ghost"
            size="sm"
            disabled={disabled || !imageUrl}
          >
            <Expand className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top" hasArrow={false} sideOffset={10}>
          <p>Expand image</p>
        </TooltipContent>
      </Tooltip>

      {/* 이미지 확대 보기 Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">Expand image</DialogTitle>
          <div className="relative w-full h-full flex items-center justify-center bg-background">
            <img
              src={imageUrl}
              alt={alt || 'Image'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
