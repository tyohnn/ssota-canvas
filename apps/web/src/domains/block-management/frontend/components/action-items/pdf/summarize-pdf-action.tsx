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
  const url = properties.url;

  const handleSummarize = useCallback(() => {
    console.log('[TODO] PDF 내용 요약:', { blockId, url });
    // TODO: PDF 요약 로직 구현
    // 1. PDF 텍스트 추출
    // 2. LLM으로 요약 생성 (긴 문서의 경우 청크 단위로 처리)
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
        <p>AI 요약 (LLM)</p>
      </TooltipContent>
    </Tooltip>
  );
}
