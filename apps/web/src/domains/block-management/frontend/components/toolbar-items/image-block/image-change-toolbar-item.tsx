'use client';

import { useCallback } from 'react';
import { ImagePlus } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

interface ImageChangeToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentValue: string;
  disabled?: boolean;
  orgId: string;
  workspaceId: string;
  pageId: string;
  onValueChange?: (url: string) => Promise<void>;
}

/**
 * Image Change Toolbar Item
 *
 * 이미지 변경을 위한 툴바 아이템
 * - 파일 선택 다이얼로그 표시
 * - 이미지 업로드 (TODO: Supabase Storage)
 * - 현재는 FileReader로 Base64 변환
 */
export function ImageChangeToolbarItem({
  blockId,
  blockMountId,
  currentValue,
  disabled = false,
  orgId,
  workspaceId,
  pageId,
  onValueChange,
}: ImageChangeToolbarItemProps) {
  const { upload, isUploading } = useSupabaseStorage();

  const handleImageChange = useCallback(() => {
    if (disabled || !onValueChange || isUploading) return;

    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // Upload to Supabase Storage
          const result = await upload({
            bucket: StorageBucket.CANVAS_ASSETS,
            file,
            orgId,
            workspaceId,
            pageId,
            blockId,
          });

          await onValueChange(result.url);
        } catch (error) {
          console.error('Failed to upload image:', error);
          // Fallback to Base64 if Supabase upload fails
          const reader = new FileReader();
          reader.onload = async e => {
            const url = e.target?.result as string;
            await onValueChange(url);
          };
          reader.readAsDataURL(file);
        }
      }
    };

    input.click();
  }, [disabled, onValueChange, upload, isUploading]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          onClick={e => {
            e.stopPropagation();
            handleImageChange();
          }}
          disabled={disabled}
        >
          <ImagePlus className="h-3 w-3" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" hasArrow={false} sideOffset={10}>
        <p>이미지 변경</p>
      </TooltipContent>
    </Tooltip>
  );
}
