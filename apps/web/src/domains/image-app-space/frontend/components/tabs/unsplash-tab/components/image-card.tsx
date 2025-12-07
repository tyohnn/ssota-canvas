'use client';

import type { UnsplashImage } from '@/domains/image-app-space/shared/types/image-search.types';
import {
  ImageCardBase,
  ImageBase,
  ImageCardOverlay,
} from '../../common/components';

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
    <ImageCardBase
      className="cursor-pointer hover:shadow-lg transition-all"
      onClick={onSelect}
    >
      <ImageBase
        src={image.urls.small}
        alt={image.alt_description || 'Unsplash image'}
      />

      {/* 저자 정보 오버레이 */}
      <ImageCardOverlay
        bottomContent={
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
        }
      />
    </ImageCardBase>
  );
}
