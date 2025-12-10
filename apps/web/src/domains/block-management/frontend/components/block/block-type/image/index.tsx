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
import { TooltipProvider } from '@workspace/ui/components/ui/tooltip';
import { Skeleton } from '@workspace/ui/components/ui/skeleton';
import { useImageBlock } from './core/use-image-block';
import { ImageDisplay } from './components/image-display';
import { ImageUploadPlaceholder } from './components/image-upload-placeholder';
import { ImageCaption } from './components/image-caption';
import { ImageErrorOverlay } from './components/image-error-overlay';
import { UnsplashAttribution } from './components/unsplash-attribution';
import { Box } from '@/components/ui/box';

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
        <Box
          className={cn(
            'w-full h-full flex flex-col relative',
            'bg-background border-2 border-border rounded-lg overflow-hidden',
            'shadow-md',
            !selected && 'hover:shadow-xl',
            selected && 'ring-2 ring-blue-400 dark:ring-blue-500',
            selected && 'shadow-xl',
            'transition-all duration-300 ease-out'
          )}
          onMouseEnter={() => imageBlock.setIsHovered(true)}
          onMouseLeave={() => imageBlock.setIsHovered(false)}
        >
          {/* 이미지 컨테이너 */}
          <Box className="relative flex-1 overflow-hidden bg-muted/30 group">
            {!imageAssetId && !imageUrl ? (
              // 업로드 플레이스홀더
              <ImageUploadPlaceholder
                selected={selected}
                maxSizeMB={maxSizeMB}
                isUploading={imageBlock.isUploading}
                onFileSelect={imageBlock.handleFileUpload}
              />
            ) : (
              // 이미지 표시
              <>
                {/* Loading skeleton */}
                {imageBlock.isLoading && !imageBlock.hasError && (
                  <Box className="absolute inset-0 bg-muted animate-pulse" />
                )}

                {/* Image - displayUrl만 사용 (만료된 imageUrl fallback 방지) */}
                {imageBlock.displayUrl && (
                  <ImageDisplay
                    src={imageBlock.displayUrl}
                    alt={alt || '이미지'}
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
                  <Box className="absolute inset-0 flex items-center justify-center bg-background/80">
                    <Skeleton className="w-full h-full" />
                  </Box>
                )}
              </>
            )}
          </Box>

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
        </Box>
      </TooltipProvider>
    </BaseBlock>
  );
});
