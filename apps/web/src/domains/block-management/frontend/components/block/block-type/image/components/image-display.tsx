/**
 * ImageDisplay Component
 *
 * 이미지 렌더링 (항상 object-cover)
 */

import { cn } from '@workspace/ui/lib/utils';

export interface ImageDisplayProps {
  src: string;
  alt: string;
  isLoading: boolean;
  hasError: boolean;
  onLoad: () => void;
  onError: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  className?: string;
}

export function ImageDisplay({
  src,
  alt,
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
        // console.log('[ImageBlock] Image loaded successfully');
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
        'w-full h-full object-cover',
        (isLoading || hasError) && 'opacity-0',
        'transition-opacity duration-300',
        className
      )}
    />
  );
}
