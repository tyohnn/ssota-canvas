/**
 * Image Base
 *
 * 공통 이미지 기본 스타일 컴포넌트
 */

'use client';

export interface ImageBaseProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
}

/**
 * Image Base
 *
 * 이미지의 공통 스타일을 제공하는 기본 컴포넌트
 * 하단 공간 제거를 위한 스타일이 적용되어 있음
 */
export function ImageBase({
  src,
  alt,
  className = '',
  style,
  ...props
}: ImageBaseProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={`w-full h-auto object-cover transition-transform group-hover:scale-105 ${className}`}
      style={{
        display: 'block',
        margin: 0,
        padding: 0,
        verticalAlign: 'bottom',
        ...style,
      }}
      {...props}
    />
  );
}
