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
import { uploadImageAsset } from '@/domains/image-app-space/frontend/utils/upload-image-asset';

interface ImageChangeToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentValue: string;
  disabled?: boolean;
  orgId: string;
  workspaceId: string;
  pageId: string;
  onValueChange?: (url: string) => Promise<void>;
  onPropertiesChange?: (properties: Record<string, any>) => Promise<void>;
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
  onPropertiesChange,
}: ImageChangeToolbarItemProps) {
  const { upload, isUploading } = useSupabaseStorage();

  const handleImageChange = useCallback(() => {
    if (disabled || isUploading) return;
    if (!onValueChange && !onPropertiesChange) return;

    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async event => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // ✅ New: image-assets 시스템 사용
          const imageAsset = await uploadImageAsset(file, workspaceId);

          // ✅ onPropertiesChange가 있으면 여러 속성 한번에 업데이트
          if (onPropertiesChange) {
            await onPropertiesChange({
              imageAssetId: imageAsset.id,
              imageSource: 'user-upload',
              // 기존 메타데이터 제거
              caption: '',
              alt: '',
              unsplashAuthorName: null,
              unsplashAuthorLink: null,
            });
          } else if (onValueChange) {
            // Legacy: imageUrl만 업데이트
            await onValueChange(imageAsset.image_url);
          }
        } catch (error) {
          console.error(
            '[ImageChangeToolbarItem] image-assets upload failed:',
            error
          );
        }
      }
    };

    input.click();
  }, [
    disabled,
    onValueChange,
    onPropertiesChange,
    upload,
    isUploading,
    workspaceId,
    orgId,
    pageId,
    blockId,
  ]);

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
          disabled={disabled}
        >
          <ImagePlus className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" hasArrow={false} sideOffset={10}>
        <p>Change image</p>
      </TooltipContent>
    </Tooltip>
  );
}
