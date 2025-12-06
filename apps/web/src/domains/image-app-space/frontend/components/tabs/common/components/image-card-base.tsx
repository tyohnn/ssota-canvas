/**
 * Image Card Base
 *
 * 공통 이미지 카드 기본 스타일 컴포넌트
 */

'use client';

import { ReactNode } from 'react';
import { Box } from '@workspace/ui/components/ui/box';

export interface ImageCardBaseProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Image Card Base
 *
 * 이미지 카드의 공통 스타일을 제공하는 기본 컴포넌트
 * 하단 공간 제거를 위한 스타일이 적용되어 있음
 */
export function ImageCardBase({
  children,
  onClick,
  className = '',
  style,
}: ImageCardBaseProps) {
  return (
    <Box
      className={`group relative overflow-hidden bg-card break-inside-avoid ${className}`}
      style={{
        display: 'block',
        width: '100%',
        margin: 0,
        lineHeight: 0,
        fontSize: 0,
        ...style,
      }}
      onClick={onClick}
    >
      {children}
    </Box>
  );
}
