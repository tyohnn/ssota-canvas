/**
 * Style Tokens Types
 *
 * Tailwind 토큰 기반의 스타일 시스템
 */

/**
 * 색상 토큰 Enum
 */
export enum ColorToken {
  RED = 'red',
  ORANGE = 'orange',
  AMBER = 'amber',
  GREEN = 'green',
  BLUE = 'blue',
  PURPLE = 'purple',
  PINK = 'pink',
  GRAY = 'gray',
}

/**
 * 색상 토큰별 Tailwind 클래스 매핑
 * - 고정된 톤 값으로 Tailwind가 정적 분석 가능
 */
export interface ColorClasses {
  // Rich Style용
  background: string; // 100 tone
  text: string; // 900 tone
  border: string; // 300 tone
  // 호버/선택 상태용
  hoverShadow: string; // 호버 시 box-shadow (뿌연 효과)
  selectedRing: string; // 선택 시 링 (선명한 링)
}

/**
 * 색상 토큰 → Tailwind 클래스 매핑 (고정값)
 */
export const COLOR_TOKEN_CLASSES: Record<ColorToken, ColorClasses> = {
  [ColorToken.RED]: {
    background: 'bg-red-100',
    text: 'text-red-900',
    border: 'border-red-300',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(248,113,113,0.15)]',
    selectedRing: 'ring-2 ring-red-400',
  },
  [ColorToken.ORANGE]: {
    background: 'bg-orange-100',
    text: 'text-orange-900',
    border: 'border-orange-300',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(251,146,60,0.15)]',
    selectedRing: 'ring-2 ring-orange-400',
  },
  [ColorToken.AMBER]: {
    background: 'bg-amber-100',
    text: 'text-amber-900',
    border: 'border-amber-300',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(251,191,36,0.15)]',
    selectedRing: 'ring-2 ring-amber-400',
  },
  [ColorToken.GREEN]: {
    background: 'bg-green-100',
    text: 'text-green-900',
    border: 'border-green-300',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(74,222,128,0.15)]',
    selectedRing: 'ring-2 ring-green-400',
  },
  [ColorToken.BLUE]: {
    background: 'bg-blue-100',
    text: 'text-blue-900',
    border: 'border-blue-300',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(96,165,250,0.15)]',
    selectedRing: 'ring-2 ring-blue-400',
  },
  [ColorToken.PURPLE]: {
    background: 'bg-purple-100',
    text: 'text-purple-900',
    border: 'border-purple-300',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(192,132,252,0.15)]',
    selectedRing: 'ring-2 ring-purple-400',
  },
  [ColorToken.PINK]: {
    background: 'bg-pink-100',
    text: 'text-pink-900',
    border: 'border-pink-300',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(244,114,182,0.15)]',
    selectedRing: 'ring-2 ring-pink-400',
  },
  [ColorToken.GRAY]: {
    background: 'bg-gray-100',
    text: 'text-gray-900',
    border: 'border-gray-300',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(156,163,175,0.15)]',
    selectedRing: 'ring-2 ring-gray-400',
  },
};

/**
 * 색상 토큰별 미리보기 클래스 (툴바 미리보기용 - 배경색상과 동일)
 */
export const COLOR_TOKEN_PREVIEW_CLASSES: Record<ColorToken, string> = {
  [ColorToken.RED]: 'bg-red-100',
  [ColorToken.ORANGE]: 'bg-orange-100',
  [ColorToken.AMBER]: 'bg-amber-100',
  [ColorToken.GREEN]: 'bg-green-100',
  [ColorToken.BLUE]: 'bg-blue-100',
  [ColorToken.PURPLE]: 'bg-purple-100',
  [ColorToken.PINK]: 'bg-pink-100',
  [ColorToken.GRAY]: 'bg-gray-100',
};

/**
 * 색상 토큰별 라벨
 */
export const COLOR_TOKEN_LABELS: Record<ColorToken, string> = {
  [ColorToken.RED]: 'Red',
  [ColorToken.ORANGE]: 'Orange',
  [ColorToken.AMBER]: 'Amber',
  [ColorToken.GREEN]: 'Green',
  [ColorToken.BLUE]: 'Blue',
  [ColorToken.PURPLE]: 'Purple',
  [ColorToken.PINK]: 'Pink',
  [ColorToken.GRAY]: 'Gray',
};

/**
 * Rich Style용 색상 클래스 가져오기
 */
export function getRichStyleClasses(token: ColorToken): string {
  const classes = COLOR_TOKEN_CLASSES[token];
  return `${classes.background} ${classes.text} ${classes.border}`;
}

/**
 * 텍스트 색상 클래스 가져오기
 */
export function getTextColorClass(token: ColorToken): string {
  return COLOR_TOKEN_CLASSES[token].text;
}

/**
 * 호버 상태의 box-shadow 클래스 가져오기
 */
export function getHoverShadowClasses(token: ColorToken): string {
  return COLOR_TOKEN_CLASSES[token].hoverShadow;
}

/**
 * 선택된 상태의 링 클래스 가져오기
 */
export function getSelectedRingClasses(token: ColorToken): string {
  return COLOR_TOKEN_CLASSES[token].selectedRing;
}

/**
 * 색상 미리보기 클래스 가져오기
 */
export function getColorPreviewClass(token: ColorToken): string {
  return COLOR_TOKEN_PREVIEW_CLASSES[token];
}

/**
 * 색상 라벨 가져오기
 */
export function getColorLabel(token: ColorToken): string {
  return COLOR_TOKEN_LABELS[token];
}

/**
 * 글로우 색상 RGB 값 가져오기 (CSS 변수용)
 */
export function getGlowColor(token: ColorToken): string {
  const colorMap: Record<ColorToken, string> = {
    [ColorToken.RED]: 'rgb(248,113,113)',
    [ColorToken.ORANGE]: 'rgb(251,146,60)',
    [ColorToken.AMBER]: 'rgb(251,191,36)',
    [ColorToken.GREEN]: 'rgb(74,222,128)',
    [ColorToken.BLUE]: 'rgb(96,165,250)',
    [ColorToken.PURPLE]: 'rgb(192,132,252)',
    [ColorToken.PINK]: 'rgb(244,114,182)',
    [ColorToken.GRAY]: 'rgb(156,163,175)',
  };
  return colorMap[token] || 'rgb(156,163,175)';
}
