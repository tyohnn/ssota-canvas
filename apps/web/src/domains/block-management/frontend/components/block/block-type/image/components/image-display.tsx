/**
 * ImageDisplay Component
 *
 * 이미지 렌더링 (img 태그 + objectFit)
 */

import { cn } from '@workspace/ui/lib/utils';
import type { ObjectFit } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

export interface ImageDisplayProps {
  src: string;
  alt: string;
  objectFit: ObjectFit;
  isLoading: boolean;
  hasError: boolean;
  onLoad: () => void;
  onError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  className?: string;
}

export function ImageDisplay({
  src,
  alt,
  objectFit,
  isLoading,
  hasError,
  onLoad,
  onError,
  className,
}: ImageDisplayProps) {
  return (
    <img
      src={src}
      alt={alt}
      onLoad={() => {
        console.log('[ImageBlock] Image loaded successfully');
        onLoad();
      }}
      onError={e => {
        const errorDetails = {
          src,
          errorType: e.type,
          currentSrc: e.currentTarget?.src || 'unknown',
          timestamp: new Date().toISOString(),
        };
        console.error('[ImageBlock] Image load error:', errorDetails);
        onError(e);
      }}
      className={cn(
        'w-full h-full',
        objectFit === 'contain' && 'object-contain',
        objectFit === 'cover' && 'object-cover',
        objectFit === 'fill' && 'object-fill',
        (isLoading || hasError) && 'opacity-0',
        'transition-opacity duration-300',
        className
      )}
    />
  );
}

