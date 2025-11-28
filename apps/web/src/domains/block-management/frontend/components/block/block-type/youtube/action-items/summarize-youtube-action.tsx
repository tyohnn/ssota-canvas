'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Button } from '@workspace/ui/components/ui/button';
import { Sparkles } from 'lucide-react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { YoutubeBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

interface SummarizeYoutubeActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function SummarizeYoutubeAction({
  blockId,
  blockData,
}: SummarizeYoutubeActionProps) {
  const properties = blockData.properties as YoutubeBlockProperties;
  const url = properties.url;

  // TODO: Implement YouTube summarization functionality
  const handleSummarize = () => {
    console.log('[TODO] Summarize YouTube:', { blockId, blockData, url });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <Sparkles className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" hasArrow={false} sideOffset={10}>
        <div className="flex flex-col gap-1">
          <p>AI Summary</p>
          <p className="text-xs">Coming soon</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
