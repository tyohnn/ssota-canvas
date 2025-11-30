/**
 * ImageBlock Component
 *
 * 이미지를 표시하는 블록 컴포넌트
 * 리팩토링: components/ + core/ 패턴 적용
 */

'use client';

import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { ImageBlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { ImageBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { BaseBlock } from '../base-block';
import { cn } from '@workspace/ui/lib/utils';
import { useFileUpload } from '@workspace/ui/hooks/use-file-upload';
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { useImageBlock } from './core/use-image-block';
import { ImageDisplay } from './components/image-display';
import { ImageUploadPlaceholder } from './components/image-upload-placeholder';
import { ImageCaption } from './components/image-caption';
import { ImageErrorOverlay } from './components/image-error-overlay';
import { UnsplashAttribution } from './components/unsplash-attribution';

/**
 * ImageBlock Component
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
    imageAssetId,
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

  // Combined Hook (UI + Business)
  const imageBlock = useImageBlock(nodeData, properties);

  // File upload configuration
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
    onFilesAdded: imageBlock.handleFileUpload,
  });

  // Caption handlers
  const handleCaptionBlur = async () => {
    imageBlock.setIsEditingCaption(false);
    await imageBlock.saveCaptionToServer(imageBlock.draftCaption);
  };

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
          onMouseEnter={() => imageBlock.setIsHovered(true)}
          onMouseLeave={() => imageBlock.setIsHovered(false)}
        >
          {/* 이미지 컨테이너 */}
          <div className="relative flex-1 overflow-hidden bg-muted/30 group">
            {!imageAssetId && !imageUrl ? (
              // 업로드 플레이스홀더
              imageBlock.isUploading ? (
                <Skeleton className="absolute inset-0" />
              ) : (
                <ImageUploadPlaceholder
                  selected={selected}
                  isDragging={isDragging}
                  uploadErrors={uploadErrors}
                  maxSizeMB={maxSizeMB}
                  inputProps={getInputProps()}
                  onOpenFileDialog={openFileDialog}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              )
            ) : (
              // 이미지 표시
              <>
                {/* Loading skeleton */}
                {imageBlock.isLoading && !imageBlock.hasError && (
                  <div className="absolute inset-0 bg-muted animate-pulse" />
                )}

                {/* Image */}
                {(imageBlock.displayUrl || imageUrl) && (
                  <ImageDisplay
                    src={imageBlock.displayUrl || imageUrl!}
                    alt={alt || '이미지'}
                    objectFit={objectFit}
                    isLoading={imageBlock.isLoading}
                    hasError={imageBlock.hasError}
                    onLoad={imageBlock.handleImageLoad}
                    onError={imageBlock.handleImageError}
                  />
                )}

                {/* 에러 오버레이 */}
                <ImageErrorOverlay
                  visible={imageBlock.hasError}
                  isRefreshing={imageBlock.isRefreshing}
                />

                {/* Unsplash 저작권 정보 */}
                <UnsplashAttribution
                  visible={
                    selected &&
                    imageSource === 'unsplash' &&
                    !!unsplashAuthorName &&
                    !!unsplashAuthorLink &&
                    !imageBlock.isLoading &&
                    !imageBlock.hasError
                  }
                  authorName={unsplashAuthorName || ''}
                  authorLink={unsplashAuthorLink || ''}
                />

                {/* 업로드 중 Skeleton Overlay */}
                {imageBlock.isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Skeleton className="w-full h-full" />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Caption */}
          <ImageCaption
            visible={isCaptionVisible}
            isEditing={imageBlock.isEditingCaption}
            value={imageBlock.draftCaption}
            caption={caption}
            onChange={imageBlock.setDraftCaption}
            onBlur={handleCaptionBlur}
            onKeyDown={imageBlock.handleCaptionKeyDown}
            onClick={imageBlock.handleCaptionClick}
          />
        </div>
      </TooltipProvider>
    </BaseBlock>
  );
});
