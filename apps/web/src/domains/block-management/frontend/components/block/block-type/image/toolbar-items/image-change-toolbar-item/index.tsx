/**
 * Image Change Toolbar Item
 *
 * 이미지 변경을 위한 툴바 아이템
 * - 파일 선택 다이얼로그 표시
 * - 이미지 업로드 (Server Action)
 * - Properties 업데이트
 *
 * 리팩토링: Context 패턴 (Props Drilling 제거)
 */

'use client';

import { ImagePlus } from 'lucide-react';

import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';

import { useImageToolbarContext } from '../core/image-toolbar.context';
import { useImageChangeToolbarItem } from './core/use-image-change-toolbar-item';

/**
 * Image Change Toolbar Item Component
 *
 * Context에서 필요한 데이터 가져오기 (Props 없음)
 */
export function ImageChangeToolbarItem() {
  const { disabled, onPropertiesUpdate } = useImageToolbarContext();

  // Combined Hook (Business Logic)
  const { handleImageChange, isUploading } = useImageChangeToolbarItem(
    disabled,
    onPropertiesUpdate
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={e => {
            e.stopPropagation();
            handleImageChange();
          }}
          disabled={disabled || isUploading}
        >
          <ImagePlus className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" hasArrow={false} sideOffset={10}>
        <p>{isUploading ? 'Uploading...' : 'Change image'}</p>
      </TooltipContent>
    </Tooltip>
  );
}
