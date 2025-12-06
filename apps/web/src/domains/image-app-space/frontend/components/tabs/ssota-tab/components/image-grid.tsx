/**
 * Ssota Image Grid Component
 */

'use client';

import type { ImageAsset } from '@/domains/image-app-space/shared/types/image-search.types';
import { useSsotaTabContext } from '../core/ssota-tab.context';
import {
  ImageGridContainer,
  ImageCardBase,
  ImageBase,
  ImageGridSkeleton,
  ImageGridEmpty,
} from '../../common/components';
import { Box } from '@workspace/ui/components/ui/box';

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
  const displayTitle =
    image.metadata?.description || image.alt || 'SSOTA Image';

  // DB의 ImageAsset에서 creator 정보 가져오기
  // TODO: ImageAssetWithStats 타입으로 creator 정보 포함 필요
  const displayCreator = 'SSOTA Creator';

  return (
    <ImageCardBase
      className="cursor-pointer hover:shadow-lg transition-all"
      onClick={onSelect}
    >
      <ImageBase src={image.thumbnailUrl} alt={image.alt || 'SSOTA image'} />

      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-2 left-2 text-white space-y-1">
          <p className="text-sm font-medium line-clamp-1">{displayTitle}</p>
          <p className="text-xs opacity-80">by {displayCreator}</p>
          {image.score && (
            <p className="text-xs opacity-80">
              Similarity: {(image.score * 100).toFixed(0)}%
            </p>
          )}
        </div>
      </div>
    </ImageCardBase>
  );
}

/**
 * Ssota Image Grid
 */
export function SsotaImageGrid() {
  const { images, isLoading, onSelectImage } = useSsotaTabContext();

  if (isLoading) {
    return <ImageGridSkeleton />;
  }

  if (images.length === 0) {
    return (
      <ImageGridEmpty
        title="No results found"
        description="Try semantic search"
      />
    );
  }

  return (
    <Box className="p-0">
      <ImageGridContainer>
        {images.map(image => (
          <SsotaImageCard
            key={image.id}
            image={image}
            onSelect={() => onSelectImage(image)}
          />
        ))}
      </ImageGridContainer>
    </Box>
  );
}
