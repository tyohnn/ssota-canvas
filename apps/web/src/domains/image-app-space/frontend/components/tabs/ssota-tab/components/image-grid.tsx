/**
 * Ssota Image Grid Component
 */

'use client';

import type { ImageAsset } from '@/domains/image-app-space/shared/types/image-search.types';
import { useSsotaTabContext } from '../core/ssota-tab.context';

/**
 * Ssota Image Card
 */
function SsotaImageCard({
  image,
  onSelect,
}: {
  image: ImageAsset;
  onSelect: () => void;
}) {
  return (
    <div
      className="group relative aspect-square overflow-hidden rounded-lg border bg-card cursor-pointer hover:shadow-lg transition-all"
      onClick={onSelect}
    >
      <img
        src={image.thumbnailUrl}
        alt={image.alt || 'SSOTA image'}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-2 left-2 text-white">
          <p className="text-sm font-medium">
            {image.metadata.description || 'SSOTA Image'}
          </p>
          {image.score && (
            <p className="text-xs opacity-80">
              Similarity: {(image.score * 100).toFixed(0)}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Ssota Image Grid
 */
export function SsotaImageGrid() {
  const { images, isLoading, onSelectImage } = useSsotaTabContext();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">검색 결과가 없습니다</p>
          <p className="text-sm">시맨틱 검색을 시도해보세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map(image => (
          <SsotaImageCard
            key={image.id}
            image={image}
            onSelect={() => onSelectImage(image)}
          />
        ))}
      </div>
    </div>
  );
}
