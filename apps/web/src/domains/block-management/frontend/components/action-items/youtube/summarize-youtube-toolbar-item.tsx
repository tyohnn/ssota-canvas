'use client';

import { useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Sparkles } from 'lucide-react';

interface SummarizeYoutubeToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  url: string;
  disabled?: boolean;
}

export function SummarizeYoutubeToolbarItem({
  blockId,
  blockMountId,
  url,
  disabled = false,
}: SummarizeYoutubeToolbarItemProps) {
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

