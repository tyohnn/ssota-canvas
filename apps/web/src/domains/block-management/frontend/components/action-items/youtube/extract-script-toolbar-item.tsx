'use client';

import { useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { FileText } from 'lucide-react';

interface ExtractScriptToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  url: string;
  disabled?: boolean;
}

export function ExtractScriptToolbarItem({
  blockId,
  blockMountId,
  url,
  disabled = false,
}: ExtractScriptToolbarItemProps) {
  const handleExtractScript = useCallback(() => {
    console.log('[TODO] YouTube 스크립트 추출:', { blockId, url });
    // TODO: YouTube 스크립트 추출 로직 구현
    // 1. YouTube Data API 또는 youtube-transcript API 사용
    // 2. 자막/스크립트 추출
    // 3. 새로운 텍스트 블록 또는 마크다운 블록으로 생성
  }, [blockId, url]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="flex items-center justify-center p-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onMouseDown={e => e.stopPropagation()}
          onClick={handleExtractScript}
          disabled={disabled || !url}
        >
          <FileText className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" hasArrow={false} sideOffset={10}>
        <p>스크립트 추출</p>
      </TooltipContent>
    </Tooltip>
  );
}

