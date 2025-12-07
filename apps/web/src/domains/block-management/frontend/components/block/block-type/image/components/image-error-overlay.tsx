/**
 * ImageErrorOverlay Component
 *
 * 이미지 로드 에러 표시 + 재시도 UI
 */

import { ImageOff } from 'lucide-react';

export interface ImageErrorOverlayProps {
  visible: boolean;
  isRefreshing: boolean;
}

export function ImageErrorOverlay({
  visible,
  isRefreshing,
}: ImageErrorOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-muted/50 backdrop-blur-sm">
      <ImageOff className="h-12 w-12 mb-2" />
      <span className="text-sm font-medium">
        {isRefreshing ? 'URL 재생성 중...' : '이미지 로드 실패'}
      </span>
      {isRefreshing && (
        <div className="mt-2 h-1 w-24 bg-muted-foreground/20 rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-muted-foreground/50 animate-pulse" />
        </div>
      )}
    </div>
  );
}

