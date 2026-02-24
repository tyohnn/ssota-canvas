import { cn } from '@workspace/ui/lib/utils';

/**
 * 공통 Original View 컨테이너 클래스
 *
 * 모든 블록의 original view에 적용되는 스타일 (테두리, 그림자, 선택 링, 호버).
 * OriginalView에서 사용; 블록별 view에서는 사용하지 않음.
 * noContainerBoundary가 true면 테두리/배경/그림자/링 생략 (도형 등 자체 시각 경계가 있는 블록).
 */
export function getOriginalViewContainerClasses(
  selected: boolean,
  additionalClasses?: string,
  noContainerBoundary?: boolean
): string {
  if (noContainerBoundary) {
    return cn(
      'w-full h-full rounded-lg',
      'transition-all duration-300 ease-out',
      additionalClasses
    );
  }
  return cn(
    'w-full h-full rounded-lg',
    'bg-background border-2 border-border',
    'shadow-md',
    !selected && 'hover:shadow-xl',
    selected && 'ring-2 ring-blue-400 dark:ring-blue-500',
    selected && 'shadow-xl',
    'transition-all duration-300 ease-out',
    additionalClasses
  );
}
