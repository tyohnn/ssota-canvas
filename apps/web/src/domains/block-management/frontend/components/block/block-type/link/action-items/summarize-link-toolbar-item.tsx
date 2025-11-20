'use client';

import { useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Sparkles } from 'lucide-react';

interface SummarizeLinkToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  url: string;
  disabled?: boolean;
}

export function SummarizeLinkToolbarItem({
  blockId,
  blockMountId,
  url,
  disabled = false,
}: SummarizeLinkToolbarItemProps) {
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
