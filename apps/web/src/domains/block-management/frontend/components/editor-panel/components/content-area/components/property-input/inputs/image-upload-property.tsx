'use client';

import { useCallback, useState } from 'react';

import { AlertCircleIcon, ImageIcon, ImageOff, Trash2 } from 'lucide-react';

import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import {
  type FileWithPreview,
  useFileUpload,
} from '@workspace/ui/hooks/use-file-upload';
import { cn } from '@workspace/ui/lib/utils';

import type { PropertyUIDefinition } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';

interface BlockContext {
  orgId: string;
  workspaceId: string;
  pageId: string;
  blockId: string; // blocks.id (NOT block_mounts.id)
}

export interface ImageUploadPropertyProps {
  value: string | null | undefined;
  propertyDef: PropertyUIDefinition;
  onChange: (value: string) => Promise<void>;
  disabled?: boolean;
  blockData?: BlockContext; // Block context for storage path
}

/**
 * Image Upload Property Input
 *
 * 이미지 URL을 관리하는 입력 컴포넌트
 * - 작은 사각형 프리뷰 (이미지가 있을 때)
 * - 클릭 시 이미지 업로더 표시
 */
export function ImageUploadProperty({
  value,
  propertyDef,
  onChange,
  disabled = false,
  blockData,
}: ImageUploadPropertyProps) {
  const [hasError, setHasError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const {
    upload,
    isUploading,
    progress,
    error: uploadError,
  } = useSupabaseStorage();

  const maxSizeMB = 10;
  const maxSize = maxSizeMB * 1024 * 1024; // 10MB

  const [
    { files, isDragging, errors: uploadErrors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
    },
  ] = useFileUpload({
    accept: 'image/*',
    maxSize,
    multiple: false,
    onFilesAdded: async (addedFiles: FileWithPreview[]) => {
      const fileWithPreview = addedFiles[0];
      if (fileWithPreview && fileWithPreview.file instanceof File) {
        try {
          // Upload to Supabase Storage
          const result = await upload({
            bucket: StorageBucket.CANVAS_ASSETS,
            file: fileWithPreview.file,
          });

          await onChange(result.url);
        } catch (error) {
          console.error('Failed to upload image:', error);
          // Fallback to blob URL if upload fails
          if (fileWithPreview.preview) {
            await onChange(fileWithPreview.preview);
          }
        }
      }
    },
  });

  const handleImageLoad = useCallback(() => {
    setHasError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setHasError(true);
  }, []);

  const handleRemoveImage = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disabled) {
        await onChange('');
        if (files[0]) {
          removeFile(files[0].id);
        }
      }
    },
    [disabled, onChange, files, removeFile]
  );

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (disabled) return;

      // Create file input element dynamically
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
            });
            await onChange(result.url);
          } catch (error) {
            console.error('Failed to upload image:', error);
            // Fallback to Base64
            const reader = new FileReader();
            reader.onload = async e => {
              const url = e.target?.result as string;
              await onChange(url);
            };
            reader.readAsDataURL(file);
          }
        }
      };
      input.click();
    },
    [disabled, upload, blockData, onChange]
  );

  // 작은 프리뷰 모드 (이미지가 있을 때)
  if (value) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={handleFileSelect}
          className={cn(
            'relative rounded border border-border overflow-hidden',
            'w-32 h-18', // 16:9 aspect ratio
            'hover:border-blue-400 dark:hover:border-blue-500 transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <ImageOff className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : (
            <img
              src={value}
              alt="Preview"
              onLoad={handleImageLoad}
              onError={handleImageError}
              className="w-full h-full object-cover"
            />
          )}

          {/* 업로드 중 Skeleton */}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              <Skeleton className="w-full h-full" />
            </div>
          )}
        </button>

        {/* 삭제 버튼 (우측 상단) */}
        {isHovered && !disabled && !isUploading && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className={cn(
              'absolute top-1 right-1 z-10',
              'flex items-center justify-center',
              'w-5 h-5 rounded-full',
              'bg-destructive text-destructive-foreground',
              'hover:bg-destructive/90 transition-colors',
              'shadow-md'
            )}
            aria-label="Remove image"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  // 이미지 없음 - 갤러리 아이콘 또는 Skeleton 표시
  return (
    <div className="flex flex-col gap-2">
      {/* 업로드 중이면 Skeleton, 아니면 갤러리 아이콘 */}
      {isUploading ? (
        <Skeleton className="w-12 h-12 rounded" />
      ) : (
        <button
          type="button"
          onClick={handleFileSelect}
          disabled={disabled}
          className={cn(
            'relative w-12 h-12 rounded border border-border overflow-hidden',
            'flex items-center justify-center',
            'hover:border-blue-400 dark:hover:border-blue-500 hover:bg-accent transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </button>
      )}

      {/* Hidden file input */}
      <input
        {...getInputProps()}
        className="sr-only"
        aria-label="Upload image"
        disabled={disabled}
      />

      {/* 에러 메시지 */}
      {uploadErrors.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{uploadErrors[0]}</span>
        </div>
      )}
    </div>
  );
}
