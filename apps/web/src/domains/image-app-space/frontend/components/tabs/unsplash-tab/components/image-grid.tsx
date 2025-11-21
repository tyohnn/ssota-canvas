'use client';

import type { UnsplashImage } from '@/domains/image-app-space/shared/types/image-search.types';
import { ImageCard } from './image-card';

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
    const isApiKeyError =
      error.includes('API key') || error.includes('UNSPLASH_KEY_MISSING');

    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center max-w-md px-4">
          <div className="mb-4 text-red-500">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2 text-foreground">
            Unsplash API Configuration Needed
          </p>
          {isApiKeyError ? (
            <div className="text-sm text-muted-foreground space-y-3">
              <p>Unsplash API key is not configured.</p>
              <div className="text-left bg-muted p-3 rounded-md">
                <p className="font-semibold mb-2">To enable Unsplash:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Get API key from{' '}
                    <a
                      href="https://unsplash.com/developers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      Unsplash Developers
                    </a>
                  </li>
                  <li>
                    Create{' '}
                    <code className="bg-background px-1 py-0.5 rounded">
                      .env.local
                    </code>{' '}
                    file
                  </li>
                  <li>
                    Add:{' '}
                    <code className="bg-background px-1 py-0.5 rounded">
                      NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_key
                    </code>
                  </li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{error}</p>
          )}
        </div>
      </div>
    );
  }

  // 빈 결과 표시
  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">No results found</p>
          <p className="text-sm">Try a different search term</p>
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
