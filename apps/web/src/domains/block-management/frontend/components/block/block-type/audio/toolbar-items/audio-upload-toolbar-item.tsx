'use client';

import { useCallback } from 'react';
import { Upload } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

interface AudioUploadToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  disabled?: boolean;
  orgId: string;
  workspaceId: string;
  pageId: string;
  onValueChange?: (url: string) => Promise<void>;
}

/**
 * Audio Upload Toolbar Item
 *
 * 오디오 파일 업로드를 위한 툴바 아이템
 * - 파일 선택 다이얼로그 표시
 * - Supabase Storage 업로드
 */
export function AudioUploadToolbarItem({
  blockId,
  blockMountId,
  disabled = false,
  orgId,
  workspaceId,
  pageId,
  onValueChange,
}: AudioUploadToolbarItemProps) {
  const { upload, isUploading } = useSupabaseStorage();

  const handleAudioUpload = useCallback(() => {
    if (disabled || !onValueChange || isUploading) return;

    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';

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
          console.error('Failed to upload audio:', error);
          // TODO: Show error toast
        }
      }
    };

    input.click();
  }, [
    disabled,
    onValueChange,
    upload,
    isUploading,
    orgId,
    workspaceId,
    pageId,
    blockId,
  ]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={e => {
            e.stopPropagation();
            handleAudioUpload();
          }}
          disabled={disabled || isUploading}
          aria-label="오디오 업로드"
        >
          <Upload className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{isUploading ? '업로드 중...' : '오디오 업로드'}</p>
      </TooltipContent>
    </Tooltip>
  );
}
