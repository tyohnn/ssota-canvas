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
import { useYoutubeSummarize } from '../use-youtube-actions';

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

  // 훅에서 로직을 가져옴
  const handleSummarize = useYoutubeSummarize(blockId, blockData);

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
        <p>AI 요약 (LLM)</p>
      </TooltipContent>
    </Tooltip>
  );
}
