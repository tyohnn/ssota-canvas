'use client';

import type { UnsplashImage } from '@/domains/image-app-space/shared/types/image-search.types';
import { ImageCard } from './image-card';
import { ImageGridContainer, ImageGridEmpty } from '../../common/components';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * Image Grid Props
 */
export interface ImageGridProps {
  images: UnsplashImage[];
  onSelectImage: (image: UnsplashImage) => void;
  error?: string | null;
}

/**
 * Image Grid Component
 */
export function ImageGrid({ images, onSelectImage, error }: ImageGridProps) {
  // 에러 상태 표시
  if (error) {
    return (
      <ImageGridEmpty
        title="No images found"
        description="Try a different search term"
      />
    );
  }

  // 빈 결과 표시
  if (images.length === 0) {
    return (
      <ImageGridEmpty
        title="No results found"
        description="Try a different search term"
      />
    );
  }

  return (
    <Box className="pb-0">
      <ImageGridContainer>
        {images.map(image => (
          <ImageCard
            key={image.id}
            image={image}
            onSelect={() => onSelectImage(image)}
          />
        ))}
      </ImageGridContainer>
    </Box>
  );
}
