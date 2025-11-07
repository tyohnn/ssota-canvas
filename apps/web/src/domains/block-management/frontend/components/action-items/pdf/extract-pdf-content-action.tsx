'use client';

import { useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Button } from '@workspace/ui/components/ui/button';
import { FileText } from 'lucide-react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { PdfBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

interface ExtractPdfContentActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function ExtractPdfContentAction({
  blockId,
  blockData,
}: ExtractPdfContentActionProps) {
  const properties = blockData.properties as PdfBlockProperties;
  const url = properties.url;

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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleExtractContent}
          disabled={!url}
        >
          <FileText className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" hasArrow={false} sideOffset={10}>
        <p>내용 추출</p>
      </TooltipContent>
    </Tooltip>
  );
}
