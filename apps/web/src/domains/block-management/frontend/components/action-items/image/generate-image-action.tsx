'use client';

import { useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Button } from '@workspace/ui/components/ui/button';
import { Wand2 } from 'lucide-react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';

interface GenerateImageActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function GenerateImageAction({
  blockId,
  blockData,
}: GenerateImageActionProps) {
  const handleGenerateImage = useCallback(() => {
    console.log('[TODO] AI 이미지 생성:', { blockId });
    // TODO: AI 이미지 생성 로직 구현
    // 1. 프롬프트 입력 다이얼로그 표시
    // 2. Replicate API (Flux 모델) 또는 OpenAI DALL-E 사용
    // 3. 생성된 이미지를 현재 블록의 imageUrl로 업데이트
  }, [blockId]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleGenerateImage}
        >
          <Wand2 className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" hasArrow={false} sideOffset={10}>
        <p>AI 이미지 생성 (Nanobanana)</p>
      </TooltipContent>
    </Tooltip>
  );
}

