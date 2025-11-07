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

  const handleSummarize = useCallback(() => {
    console.log('[TODO] 링크 요약 (Firecrawl):', { blockId, url });
    // TODO: 링크 요약 로직 구현
    // 1. Firecrawl API로 웹페이지 크롤링 및 마크다운 변환
    // 2. LLM으로 요약 생성
    // 3. 요약된 내용을 새로운 마크다운 블록으로 생성
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
        <p>AI 요약 (Firecrawl)</p>
      </TooltipContent>
    </Tooltip>
  );
}
