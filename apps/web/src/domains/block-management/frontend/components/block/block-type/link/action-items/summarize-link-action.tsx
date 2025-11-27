'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Button } from '@workspace/ui/components/ui/button';
import { Sparkles } from 'lucide-react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { LinkBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

interface SummarizeLinkActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function SummarizeLinkAction({
  blockId,
  blockData,
}: SummarizeLinkActionProps) {
  const properties = blockData.properties as LinkBlockProperties;
  const url = properties.url;

  // TODO: Implement link summarization functionality
  const handleSummarize = () => {
    console.log('[TODO] Summarize link:', { blockId, blockData, url });
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
        <p>AI 요약 (Firecrawl)</p>
      </TooltipContent>
    </Tooltip>
  );
}
