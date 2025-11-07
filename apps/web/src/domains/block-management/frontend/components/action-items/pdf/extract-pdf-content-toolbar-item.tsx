'use client';

import { useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { FileText } from 'lucide-react';

interface ExtractPdfContentToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  url: string;
  disabled?: boolean;
}

export function ExtractPdfContentToolbarItem({
  blockId,
  blockMountId,
  url,
  disabled = false,
}: ExtractPdfContentToolbarItemProps) {
  const handleExtractContent = useCallback(() => {
    console.log('[TODO] PDF 내용 추출:', { blockId, url });
    // TODO: PDF 내용 추출 로직 구현
    // 1. PDF.js를 사용하여 텍스트 추출
    // 2. 추출된 텍스트를 새로운 텍스트 블록 또는 마크다운 블록으로 생성
    // 3. OCR이 필요한 경우 Tesseract.js 또는 Google Cloud Vision API 사용
  }, [blockId, url]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="flex items-center justify-center p-1 rounded-md hover:bg-black/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onMouseDown={e => e.stopPropagation()}
          onClick={handleExtractContent}
          disabled={disabled || !url}
        >
          <FileText className="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" hasArrow={false} sideOffset={10}>
        <p>내용 추출</p>
      </TooltipContent>
    </Tooltip>
  );
}
