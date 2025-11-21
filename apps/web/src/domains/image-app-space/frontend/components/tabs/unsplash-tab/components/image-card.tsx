'use client';

import type { UnsplashImage } from '@/domains/image-app-space/shared/types/image-search.types';

/**
 * Image Card Props
 */
export interface ImageCardProps {
  image: UnsplashImage;
  onSelect: () => void;
}

/**
 * Image Card Component
 */
export function ImageCard({ image, onSelect }: ImageCardProps) {
  return (
    <div
      className="relative group cursor-pointer rounded-lg overflow-hidden border hover:border-blue-500 transition-all hover:shadow-lg"
      onClick={onSelect}
    >
      <img
        src={image.urls.small}
        alt={image.alt_description || 'Unsplash image'}
        className="w-full aspect-video object-cover"
      />

      {/* 저자 정보 오버레이 */}
      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <p className="text-xs text-white truncate">
          Photo by{' '}
          <a
            href={`${image.user.links.html}?utm_source=ssota&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-300"
            onClick={e => e.stopPropagation()}
          >
            {image.user.name}
          </a>
          {' on '}
          <a
            href="https://unsplash.com?utm_source=ssota&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-blue-300"
            onClick={e => e.stopPropagation()}
          >
            Unsplash
          </a>
        </p>
      </div>
    </div>
  );
}
