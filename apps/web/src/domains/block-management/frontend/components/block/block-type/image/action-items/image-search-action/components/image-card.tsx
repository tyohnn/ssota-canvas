/**
 * Image Card Component
 */

'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import type { ImageAsset } from '@/domains/image-app-space/shared/types/image-search.types';
import { useImageSearchActionContext } from '../image-search-action.context';
import { Box } from '@workspace/ui/components/ui/box';
import Image from 'next/image';
/**
 * Image Card Props
 */
export interface ImageCardProps {
  image: ImageAsset;
  className?: string;
}

/**
 * Image Card Component
 */
export function ImageCard({
  image,
  className,
}: ImageCardProps): React.ReactElement {
  const { selectedImage, selectImage } = useImageSearchActionContext();

  const isSelected = selectedImage?.id === image.id;

  const handleClick = () => {
    selectImage(isSelected ? null : image);
  };

  return (
    <Box
      onClick={handleClick}
      className={cn(
        'relative group cursor-pointer overflow-hidden transition-all break-inside-avoid mb-0',
        className
      )}
      style={{ display: 'inline-block', width: '100%' }}
    >
      {/* 이미지 */}
      <Image
        src={image.thumbnailUrl}
        width={image.metadata.width}
        height={image.metadata.height}
        alt={image.alt || 'Image'}
        className={cn(
          'w-full h-auto block transition-all',
          isSelected ? 'opacity-90' : 'hover:opacity-90'
        )}
        loading="lazy"
      />

      {/* 선택 표시 오버레이 */}
      {isSelected && (
        <>
          {/* 배경 오버레이 */}
          <Box className="absolute inset-0 bg-primary/20 pointer-events-none" />
          {/* 체크 아이콘 */}
          <Box className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg">
            <Check className="h-4 w-4" />
          </Box>
        </>
      )}

      {/* Hover 효과 */}
      {!isSelected && (
        <Box className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </Box>
  );
}
