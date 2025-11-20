'use client';

import type { UnsplashImage } from '@/domains/image-app-space/shared/types/image-search.types';
import { ImageCard } from './image-card';

/**
 * Image Grid Props
 */
export interface ImageGridProps {
  images: UnsplashImage[];
  onSelectImage: (image: UnsplashImage) => void;
}

/**
 * Image Grid Component
 */
export function ImageGrid({ images, onSelectImage }: ImageGridProps) {
  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">검색 결과가 없습니다</p>
          <p className="text-sm">다른 검색어를 입력해보세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
      {images.map(image => (
        <ImageCard
          key={image.id}
          image={image}
          onSelect={() => onSelectImage(image)}
        />
      ))}
    </div>
  );
}
