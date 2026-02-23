'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Button } from '@workspace/ui/components/ui/button';
import { FileText } from 'lucide-react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { PdfBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

interface ExtractPdfContentActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function ExtractPdfContentAction({
  blockId,
  blockData,
}: ExtractPdfContentActionProps) {
  const properties = blockData.properties as PdfBlockProperties;
  const url = properties.url;

  // TODO: Implement PDF content extraction functionality
  const handleExtractContent = () => {
    console.log('[TODO] Extract PDF content:', { blockId, blockData, url });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleExtractContent}
          disabled={!url}
        >
          <FileText className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" hasArrow={false} sideOffset={10}>
        <p>Extract content</p>
      </TooltipContent>
    </Tooltip>
  );
}
