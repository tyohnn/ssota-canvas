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
import { refreshImageUrlAction } from '@/domains/storage/actions/storage.actions';

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
  const {
    imageUrl,
    imageSource,
    objectFit,
    caption,
    isCaptionVisible = false,
    alt,
    unsplashAuthorName,
    unsplashAuthorLink,
  } = properties;

  // Dimensions
  const width = typeof nodeW === 'number' ? nodeW : 300;
  const height = typeof nodeH === 'number' ? nodeH : 200;

  // State
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [draftCaption, setDraftCaption] = useState(caption || '');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 원본 caption 저장 (서버에 저장된 값)
  const originalCaptionRef = useRef(caption || '');
  // URL 재생성 시도 횟수 추적 (무한 루프 방지)
  const retryCountRef = useRef(0);
  // 이전 imageUrl 추적 (변경 감지용)
  const prevImageUrlRef = useRef(imageUrl);

  // Hooks
  const { updateProperty } = useBlockPropertyUpdate();
  const { upload, isUploading } = useSupabaseStorage();

  // imageUrl이 변경되면 로딩 상태로 전환
  React.useEffect(() => {
    if (imageUrl && imageUrl !== prevImageUrlRef.current) {
      setIsLoading(true);
      setHasError(false);
      prevImageUrlRef.current = imageUrl;
    }
  }, [imageUrl]);

  // 외부 데이터가 바뀌었을 때, 편집 중이 아니면 초안 동기화
  React.useEffect(() => {
    if (!isEditingCaption) {
      setDraftCaption(caption || '');
      originalCaptionRef.current = caption || '';
    }
  }, [caption, isEditingCaption]);

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

  const handleImageError = useCallback(async () => {
    setIsLoading(false);

    // 이미 재시도했거나 재생성 중이면 에러 상태만 표시
    if (retryCountRef.current > 0 || isRefreshing) {
      setHasError(true);
      return;
    }

    // URL 재생성 시도 (한 번만)
    retryCountRef.current += 1;
    setIsRefreshing(true);

    try {
      const result = await refreshImageUrlAction(nodeData.blockId);

      if (result.success && result.url) {
        // 새 URL로 업데이트 (로컬 상태만 업데이트, DB는 Server Action에서 이미 업데이트됨)
        await updateProperty(
          nodeData.blockId,
          'properties.imageUrl',
          result.url,
          nodeData
        );
        // 로딩 상태로 돌려서 이미지 재로드 시도
        setIsLoading(true);
        setHasError(false);
      } else {
        console.error('Failed to refresh image URL:', result.error);
        setHasError(true);
      }
    } catch (error) {
      console.error('Error refreshing image URL:', error);
      setHasError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, [nodeData, updateProperty, isRefreshing]);

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
            'shadow-md',
            !selected && 'hover:shadow-xl hover:scale-[1.02] hover:rotate-1',
            selected && 'ring-2 ring-blue-400 dark:ring-blue-500',
            selected && 'shadow-xl',
            'transition-all duration-300 ease-out'
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* 이미지 컨테이너 */}
          <div className="relative flex-1 overflow-hidden bg-muted/30 group">
            {!imageUrl ? (
              isUploading ? (
                <Skeleton className="absolute inset-0" />
              ) : (
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
            ) : (
              // Image wrapper (에러 포함)
              <>
                {/* Loading skeleton */}
                {isLoading && !hasError && (
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
                    (isLoading || hasError) && 'opacity-0',
                    'transition-opacity duration-300'
                  )}
                />

                {/* 에러 오버레이 */}
                {hasError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted/50 backdrop-blur-sm">
                    <ImageOff className="h-12 w-12 mb-2" />
                    <span className="text-sm font-medium">
                      {isRefreshing ? 'URL 재생성 중...' : '이미지 로드 실패'}
                    </span>
                    {isRefreshing && (
                      <div className="mt-2 h-1 w-24 bg-muted-foreground/20 rounded-full overflow-hidden">
                        <div className="h-full w-1/2 bg-muted-foreground/50 animate-pulse" />
                      </div>
                    )}
                  </div>
                )}

                {/* Unsplash 저자 정보 오버레이 (선택 + 호버 시 표시) */}
                {selected &&
                  imageSource === 'unsplash' &&
                  unsplashAuthorName &&
                  unsplashAuthorLink &&
                  !isLoading &&
                  !hasError && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                      <p className="text-xs text-white pointer-events-auto">
                        Photo by{' '}
                        <a
                          href={unsplashAuthorLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-300 transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          {unsplashAuthorName}
                        </a>
                        {' on '}
                        <a
                          href="https://unsplash.com?utm_source=ssota&utm_medium=referral"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-300 transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          Unsplash
                        </a>
                      </p>
                    </div>
                  )}

                {/* 업로드 중 Skeleton Overlay */}
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Skeleton className="w-full h-full" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Caption - 인라인 편집 가능 (토글 가능) */}
          {isCaptionVisible && (
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
          )}
        </div>
      </TooltipProvider>
    </BaseBlock>
  );
});
