'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Button } from '@workspace/ui/components/ui/button';
import { Sparkles } from 'lucide-react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { PdfBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

interface SummarizePdfActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function SummarizePdfAction({
  blockId,
  blockData,
}: SummarizePdfActionProps) {
  const properties = blockData.properties as PdfBlockProperties;
  const url = properties.accessUrl ?? (properties as { url?: string }).url;

  // TODO: Implement PDF summarization functionality
  const handleSummarize = () => {
    console.log('[TODO] Summarize PDF:', { blockId, blockData, url });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleSummarize}
          disabled={!url}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" hasArrow={false} sideOffset={10}>
        <p>AI Summary (LLM)</p>
      </TooltipContent>
    </Tooltip>
  );
}
