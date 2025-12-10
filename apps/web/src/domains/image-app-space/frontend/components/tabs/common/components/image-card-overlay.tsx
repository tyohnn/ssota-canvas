/**
 * Image Card Overlay
 *
 * 공통 이미지 카드 오버레이 컴포넌트
 */

'use client';

import { Box } from '@/components/ui/box';
import { ReactNode } from 'react';

export interface ImageCardOverlayProps {
  /**
   * 하단에 표시할 콘텐츠
   */
  bottomContent?: ReactNode;

  /**
   * 상단에 표시할 콘텐츠 (예: Settings 버튼)
   */
  topContent?: ReactNode;

  /**
   * 오버레이 그라데이션 강도
   * @default '70' - from-black/70 (unsplash 스타일)
   */
  gradientIntensity?: '60' | '70';

  /**
   * 하단 패딩
   * @default 'p-3' (unsplash 스타일)
   */
  bottomPadding?: 'p-2' | 'p-3';
}

/**
 * Image Card Overlay
 *
 * 이미지 카드에 호버 시 표시되는 오버레이 컴포넌트
 * Unsplash 스타일의 하단 그라데이션 오버레이
 */
export function ImageCardOverlay({
  bottomContent,
  topContent,
  gradientIntensity = '70',
  bottomPadding = 'p-3',
}: ImageCardOverlayProps) {
  if (!bottomContent && !topContent) {
    return null;
  }

  return (
    <Box
      className={`absolute inset-0 bg-linear-to-t from-black/${gradientIntensity} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}
    >
      {/* Top Content (Settings Button 등) */}
      {topContent && <div className="absolute top-2 right-2">{topContent}</div>}

      {/* Bottom Content (이미지 정보 등) */}
      {bottomContent && (
        <Box className={`absolute bottom-0 left-0 right-0 ${bottomPadding}`}>
          {bottomContent}
        </Box>
      )}
    </Box>
  );
}
