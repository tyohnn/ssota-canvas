'use client';

import { useCallback } from 'react';
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

  const handleSummarize = useCallback(() => {
    console.log('[TODO] YouTube 영상 요약:', { blockId, url });
    // TODO: YouTube 영상 요약 로직 구현
    // 1. 스크립트 추출
    // 2. LLM으로 요약 생성
    // 3. 새로운 텍스트 블록 또는 마크다운 블록으로 생성
  }, [blockId, url]);

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
      <TooltipContent side="right" hasArrow={false} sideOffset={10}>
        <p>AI 요약 (LLM)</p>
      </TooltipContent>
    </Tooltip>
  );
}
