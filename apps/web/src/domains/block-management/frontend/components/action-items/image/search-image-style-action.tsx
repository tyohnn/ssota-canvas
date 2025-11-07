'use client';

import { useCallback } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Button } from '@workspace/ui/components/ui/button';
import { Palette } from 'lucide-react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { ImageBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';

interface SearchImageStyleActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

export function SearchImageStyleAction({
  blockId,
  blockData,
}: SearchImageStyleActionProps) {
  const properties = blockData.properties as ImageBlockProperties;
  const imageUrl = properties.imageUrl;

  const handleSearchStyle = useCallback(() => {
    console.log('[TODO] 이미지 스타일 검색:', { blockId, imageUrl });
    // TODO: 이미지 스타일 검색 및 변환 로직 구현
    // 1. 스타일 선택 다이얼로그 표시 (예: "수채화", "유화", "팝아트" 등)
    // 2. Replicate API의 Style Transfer 모델 사용
    // 3. 스타일이 적용된 새 이미지를 생성하여 imageUrl 업데이트
  }, [blockId, imageUrl]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleSearchStyle}
          disabled={!imageUrl}
        >
          <Palette className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" hasArrow={false} sideOffset={10}>
        <p>스타일 변환</p>
      </TooltipContent>
    </Tooltip>
  );
}
