'use client';

import React, { memo, useState, useCallback, useRef } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { ImageBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import { BaseBlock } from '../base-block/base-block';
import type { ImageBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { cn } from '@workspace/ui/lib/utils';
import { ImageIcon, ImageOff } from 'lucide-react';
import {
  useFileUpload,
  type FileWithPreview,
} from '@workspace/ui/hooks/use-file-upload';
import { useBlockPropertyUpdate } from '../../../hooks/use-block-property-update';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { useSupabaseStorage } from '@/domains/storage/hooks/use-supabase-storage';
import { StorageBucket } from '@/domains/storage/types/storage.types';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';

/**
 * Image Block Component
 *
 * 이미지를 표시하는 블록 컴포넌트
 */
export const ImageBlock = memo(function ImageBlock({
  id,
  data,
  selected,
  width: nodeW,
  height: nodeH,
}: NodeProps) {
  const nodeData = data as ImageBlockNodeData;
  const properties = nodeData.properties as ImageBlockProperties;

  // Properties destructuring
  const { imageUrl, objectFit, caption, alt } = properties;

  // Dimensions
  const width = typeof nodeW === 'number' ? nodeW : 300;
  const height = typeof nodeH === 'number' ? nodeH : 200;

  // State
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(!!imageUrl);
  const [hasError, setHasError] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [draftCaption, setDraftCaption] = useState(caption || '');

  // 원본 caption 저장 (서버에 저장된 값)
  const originalCaptionRef = useRef(caption || '');

  // Hooks
  const { updateProperty } = useBlockPropertyUpdate();
  const { upload, isUploading } = useSupabaseStorage();

  // File upload hook (only used when no image)
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
      getInputProps,
    },
  ] = useFileUpload({
    accept: 'image/*',
    maxSize,
    multiple: false,
    onFilesAdded: async (addedFiles: FileWithPreview[]) => {
      // Handle file upload
      const fileWithPreview = addedFiles[0];
      if (fileWithPreview && fileWithPreview.file instanceof File) {
        try {
          // Upload to Supabase Storage
          const result = await upload({
            bucket: StorageBucket.CANVAS_ASSETS,
            file: fileWithPreview.file,
            orgId: nodeData.orgId,
            workspaceId: nodeData.workspaceId,
            pageId: nodeData.pageId,
            blockId: nodeData.blockId,
          });

          await updateProperty(
            nodeData.blockId,
            'properties.imageUrl',
            result.url,
            nodeData
          );
        } catch (error) {
          console.error('Failed to upload image:', error);
          // Fallback to blob URL if Supabase upload fails
          if (fileWithPreview.preview) {
            await updateProperty(
              nodeData.blockId,
              'properties.imageUrl',
              fileWithPreview.preview,
              nodeData
            );
          }
        }
      }
    },
  });

  // Handlers
  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleCaptionClick = useCallback(() => {
    // 편집 시작 시 현재 값을 원본으로 저장
    originalCaptionRef.current = caption || '';
    setIsEditingCaption(true);
    setDraftCaption(caption || '');
  }, [caption]);

  const handleCaptionBlur = useCallback(async () => {
    setIsEditingCaption(false);

    // 원본 값(서버에 저장된 값)과 비교
    if (draftCaption !== originalCaptionRef.current) {
      await updateProperty(
        nodeData.blockId,
        'properties.caption',
        draftCaption,
        nodeData
      );
      // 서버 저장 성공 후 원본 값 업데이트
      originalCaptionRef.current = draftCaption;
    }
  }, [draftCaption, updateProperty, nodeData]);

  const handleCaptionKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        (e.target as HTMLInputElement).blur();
      } else if (e.key === 'Escape') {
        // Escape: 원본 값으로 복원
        setDraftCaption(originalCaptionRef.current);
        setIsEditingCaption(false);
      }
    },
    []
  );

  return (
    <BaseBlock
      data={nodeData}
      selected={selected}
      isConnectable={true}
      width={width}
      height={height}
      noBorder={true}
      noBackground={true}
    >
      <TooltipProvider>
        <div
          className={cn(
            'w-full h-full flex flex-col relative',
            'bg-background border-2 border-border rounded-lg overflow-hidden',
            'shadow-md', // 기본 shadow 크게
            // Hover 효과 (선택되지 않았을 때만)
            !selected && 'hover:shadow-xl hover:scale-[1.02] hover:rotate-1',
            // 선택 효과
            selected && 'ring-2 ring-blue-400 dark:ring-blue-500',
            selected && 'shadow-xl',
            // Transition
            'transition-all duration-300 ease-out'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 이미지 컨테이너 */}
          <div className="relative flex-1 overflow-hidden bg-muted/30">
            {!imageUrl ? (
              isUploading ? (
                // 업로드 중 Skeleton
                <Skeleton className="absolute inset-0" />
              ) : (
                // Empty state with file uploader
                <div
                  role="button"
                  onClick={selected ? openFileDialog : undefined}
                  onDragEnter={selected ? handleDragEnter : undefined}
                  onDragLeave={selected ? handleDragLeave : undefined}
                  onDragOver={selected ? handleDragOver : undefined}
                  onDrop={selected ? handleDrop : undefined}
                  data-dragging={isDragging || undefined}
                  className={cn(
                    'absolute inset-0 flex flex-col items-center justify-center',
                    'transition-colors',
                    selected && 'cursor-pointer',
                    selected && 'hover:bg-accent/50',
                    isDragging &&
                      'bg-blue-50 dark:bg-blue-950/30 border-2 border-dashed border-blue-400 dark:border-blue-500'
                  )}
                >
                  <input
                    {...getInputProps()}
                    className="sr-only"
                    aria-label="Upload image"
                  />
                  <div className="flex flex-col items-center justify-center text-center px-4">
                    <div
                      className="mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background"
                      aria-hidden="true"
                    >
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="mb-1 text-sm font-medium text-foreground">
                      {selected
                        ? '이미지를 드롭하거나 클릭하여 업로드'
                        : '이미지를 추가하려면 블록을 선택하세요'}
                    </p>
                    {selected && (
                      <p className="text-xs text-muted-foreground">
                        최대 {maxSizeMB}MB
                      </p>
                    )}
                  </div>
                  {uploadErrors.length > 0 && (
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
                        <span>{uploadErrors[0]}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            ) : hasError ? (
              // Error state
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                <ImageOff className="h-12 w-12 mb-2" />
                <span className="text-sm">이미지 로드 실패</span>
              </div>
            ) : (
              // Image wrapper
              <>
                {/* Loading skeleton */}
                {isLoading && (
                  <div className="absolute inset-0 bg-muted animate-pulse" />
                )}

                {/* Image */}
                <img
                  src={imageUrl}
                  alt={alt || '이미지'}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  className={cn(
                    'w-full h-full',
                    objectFit === 'contain' && 'object-contain',
                    objectFit === 'cover' && 'object-cover',
                    objectFit === 'fill' && 'object-fill',
                    isLoading && 'opacity-0',
                    'transition-opacity duration-300'
                  )}
                />

                {/* 업로드 중 Skeleton Overlay */}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Skeleton className="w-full h-full" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Caption - 인라인 편집 가능 */}
          <div
            className="px-3 py-2 bg-background border-t border-border min-h-[36px] flex items-center justify-center"
            onClick={handleCaptionClick}
          >
            {isEditingCaption ? (
              <input
                type="text"
                value={draftCaption}
                onChange={e => setDraftCaption(e.target.value)}
                onBlur={handleCaptionBlur}
                onKeyDown={handleCaptionKeyDown}
                placeholder="캡션을 입력하세요..."
                className={cn(
                  'w-full text-xs text-center',
                  'bg-transparent border-none outline-none',
                  'text-muted-foreground',
                  'placeholder:text-muted-foreground/60 placeholder:italic',
                  'transition-colors'
                )}
                autoFocus
              />
            ) : (
              <p className="text-xs text-center cursor-text text-muted-foreground italic transition-colors">
                {caption || '캡션을 추가하려면 클릭하세요'}
              </p>
            )}
          </div>
        </div>
      </TooltipProvider>
    </BaseBlock>
  );
});
