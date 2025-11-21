'use client';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { Button } from '@workspace/ui/components/ui/button';
import { Palette } from 'lucide-react';
import { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { ImageBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { useImageSearchStyle } from '../use-image-actions';

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

  // 훅에서 로직을 가져옴
  const handleSearchStyle = useImageSearchStyle(blockId, blockData);

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
      <TooltipContent side="left" hasArrow={false} sideOffset={10}>
        <p>스타일 변환</p>
      </TooltipContent>
    </Tooltip>
  );
}
