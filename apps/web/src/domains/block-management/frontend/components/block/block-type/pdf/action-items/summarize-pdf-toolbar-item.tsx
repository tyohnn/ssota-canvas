'use client';

import { useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Sparkles } from 'lucide-react';

interface SummarizePdfToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  url: string;
  disabled?: boolean;
}

export function SummarizePdfToolbarItem({
  blockId,
  blockMountId,
  url,
  disabled = false,
}: SummarizePdfToolbarItemProps) {
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
        <button
          className="flex items-center justify-center p-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onMouseDown={e => e.stopPropagation()}
          onClick={handleSummarize}
          disabled={disabled || !url}
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" hasArrow={false} sideOffset={10}>
        <p>AI 요약</p>
      </TooltipContent>
    </Tooltip>
  );
}
