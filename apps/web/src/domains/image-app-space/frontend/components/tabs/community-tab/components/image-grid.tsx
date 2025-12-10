/**
 * Community Image Grid Component
 *
 * 이미지 그리드 with Infinite Scroll
 */

'use client';

import { useEffect, useRef } from 'react';
import { Heart, Bookmark } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import { useCommunityFeedContext } from '../core/community-feed.context';
import type { ImageAssetWithStats } from '@/domains/image-app-space/backend/repositories/interfaces/image-asset.repository.interface';

/**
 * Image Card Props
 */
interface ImageCardProps {
  image: ImageAssetWithStats;
  onLike: () => void;
  onBookmark: () => void;
}

/**
 * Community Image Card
 */
function CommunityImageCard({ image, onLike, onBookmark }: ImageCardProps) {
  return (
    <div
      className="group relative overflow-hidden bg-card break-inside-avoid"
      style={{ display: 'inline-block', width: '100%', margin: 0 }}
    >
      {/* Image */}
      <img
        src={image.thumbnail_url || image.image_url}
        alt={image.title || 'Image'}
        className="w-full h-auto object-cover transition-transform group-hover:scale-105"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Actions */}
        <div className="absolute bottom-2 right-2 flex gap-2">
          <Button
            size="sm"
            variant={image.isLiked ? 'default' : 'secondary'}
            onClick={e => {
              e.stopPropagation();
              onLike();
            }}
            className="h-8 w-8 p-0"
          >
            <Heart
              className={`h-4 w-4 ${image.isLiked ? 'fill-current' : ''}`}
            />
          </Button>
          <Button
            size="sm"
            variant={image.isBookmarked ? 'default' : 'secondary'}
            onClick={e => {
              e.stopPropagation();
              onBookmark();
            }}
            className="h-8 w-8 p-0"
          >
            <Bookmark
              className={`h-4 w-4 ${image.isBookmarked ? 'fill-current' : ''}`}
            />
          </Button>
        </div>

        {/* Info */}
        <div className="absolute bottom-2 left-2 text-white">
          <p className="text-sm font-medium">{image.title || 'Untitled'}</p>
          <p className="text-xs opacity-80">
            {image.like_count} likes • {image.view_count} views
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Community Image Grid
 *
 * Infinite Scroll 지원
 */
export function CommunityImageGrid() {
  const {
    images,
    isLoading,
    hasNextPage,
    fetchNextPage,
    toggleLike,
    toggleBookmark,
  } = useCommunityFeedContext();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite Scroll Setup
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasNextPage && !isLoading) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasNextPage, isLoading, fetchNextPage]);

  if (isLoading && images.length === 0) {
    return (
      <div className="p-6">
        <div
          className="columns-2 md:columns-3 lg:columns-4"
          style={{ columnGap: 0, gap: 0 }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-muted animate-pulse mb-0 break-inside-avoid"
              style={{
                display: 'inline-block',
                width: '100%',
                aspectRatio: '4/3',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No images found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div
        className="columns-2 md:columns-3 lg:columns-4"
        style={{ columnGap: 0 }}
      >
        {images.map(image => (
          <CommunityImageCard
            key={image.id}
            image={image}
            onLike={() => toggleLike(image.id)}
            onBookmark={() => toggleBookmark(image.id)}
          />
        ))}
      </div>

      {/* Load More Trigger */}
      {hasNextPage && (
        <div
          ref={loadMoreRef}
          className="h-20 flex items-center justify-center"
        >
          {isLoading && (
            <p className="text-sm text-muted-foreground">Loading...</p>
          )}
        </div>
      )}
    </div>
  );
}
