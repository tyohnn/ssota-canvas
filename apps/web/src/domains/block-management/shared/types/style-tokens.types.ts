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
  background: string; // 100 tone (라이트), 900 tone (다크)
  text: string; // 900 tone (라이트), 100 tone (다크)
  border: string; // 300 tone (라이트), 700 tone (다크)
  // 호버/선택 상태용
  hoverShadow: string; // 호버 시 box-shadow (뿌연 효과)
  selectedRing: string; // 선택 시 링 (선명한 링)
}

/**
 * 색상 토큰 → Tailwind 클래스 매핑 (고정값)
 */
export const COLOR_TOKEN_CLASSES: Record<ColorToken, ColorClasses> = {
  [ColorToken.RED]: {
    background: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-900 dark:text-red-100',
    border: 'border-red-300 dark:border-red-700',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(248,113,113,0.15)]',
    selectedRing: 'ring-2 ring-red-400',
  },
  [ColorToken.ORANGE]: {
    background: 'bg-orange-100 dark:bg-orange-900',
    text: 'text-orange-900 dark:text-orange-100',
    border: 'border-orange-300 dark:border-orange-700',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(251,146,60,0.15)]',
    selectedRing: 'ring-2 ring-orange-400',
  },
  [ColorToken.AMBER]: {
    background: 'bg-amber-100 dark:bg-amber-900',
    text: 'text-amber-900 dark:text-amber-100',
    border: 'border-amber-300 dark:border-amber-700',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(251,191,36,0.15)]',
    selectedRing: 'ring-2 ring-amber-400',
  },
  [ColorToken.GREEN]: {
    background: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-900 dark:text-green-100',
    border: 'border-green-300 dark:border-green-700',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(74,222,128,0.15)]',
    selectedRing: 'ring-2 ring-green-400',
  },
  [ColorToken.BLUE]: {
    background: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-900 dark:text-blue-100',
    border: 'border-blue-300 dark:border-blue-700',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(96,165,250,0.15)]',
    selectedRing: 'ring-2 ring-blue-400',
  },
  [ColorToken.PURPLE]: {
    background: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-900 dark:text-purple-100',
    border: 'border-purple-300 dark:border-purple-700',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(192,132,252,0.15)]',
    selectedRing: 'ring-2 ring-purple-400',
  },
  [ColorToken.PINK]: {
    background: 'bg-pink-100 dark:bg-pink-900',
    text: 'text-pink-900 dark:text-pink-100',
    border: 'border-pink-300 dark:border-pink-700',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(244,114,182,0.15)]',
    selectedRing: 'ring-2 ring-pink-400',
  },
  [ColorToken.GRAY]: {
    background: 'bg-gray-100 dark:bg-gray-900',
    text: 'text-gray-900 dark:text-gray-100',
    border: 'border-gray-300 dark:border-gray-700',
    hoverShadow: 'hover:shadow-[0_0_0_4px_rgba(156,163,175,0.15)]',
    selectedRing: 'ring-2 ring-gray-400',
  },
};

/**
 * 색상 토큰별 미리보기 클래스 (툴바 미리보기용 - 배경색상과 동일)
 */
export const COLOR_TOKEN_PREVIEW_CLASSES: Record<ColorToken, string> = {
  [ColorToken.RED]: 'bg-red-100 dark:bg-red-900',
  [ColorToken.ORANGE]: 'bg-orange-100 dark:bg-orange-900',
  [ColorToken.AMBER]: 'bg-amber-100 dark:bg-amber-900',
  [ColorToken.GREEN]: 'bg-green-100 dark:bg-green-900',
  [ColorToken.BLUE]: 'bg-blue-100 dark:bg-blue-900',
  [ColorToken.PURPLE]: 'bg-purple-100 dark:bg-purple-900',
  [ColorToken.PINK]: 'bg-pink-100 dark:bg-pink-900',
  [ColorToken.GRAY]: 'bg-gray-100 dark:bg-gray-900',
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

/**
 * HEX 색상 값 가져오기 (엣지 등에서 사용 - 라이트 모드)
 */
export function getHexColor(token: ColorToken): string {
  const colorMap: Record<ColorToken, string> = {
    [ColorToken.RED]: '#ef4444', // red-500
    [ColorToken.ORANGE]: '#f97316', // orange-500
    [ColorToken.AMBER]: '#f59e0b', // amber-500
    [ColorToken.GREEN]: '#10b981', // green-500
    [ColorToken.BLUE]: '#3b82f6', // blue-500
    [ColorToken.PURPLE]: '#a855f7', // purple-500
    [ColorToken.PINK]: '#ec4899', // pink-500
    [ColorToken.GRAY]: '#9ca3af', // gray-400
  };
  return colorMap[token] || '#9ca3af';
}

/**
 * HEX 색상 값 가져오기 (엣지 등에서 사용 - 다크 모드)
 */
export function getHexColorDark(token: ColorToken): string {
  const colorMap: Record<ColorToken, string> = {
    [ColorToken.RED]: '#f87171', // red-400
    [ColorToken.ORANGE]: '#fb923c', // orange-400
    [ColorToken.AMBER]: '#fbbf24', // amber-400
    [ColorToken.GREEN]: '#4ade80', // green-400
    [ColorToken.BLUE]: '#60a5fa', // blue-400
    [ColorToken.PURPLE]: '#c084fc', // purple-400
    [ColorToken.PINK]: '#f472b6', // pink-400
    [ColorToken.GRAY]: '#9ca3af', // gray-400
  };
  return colorMap[token] || '#9ca3af';
}

/**
 * HEX 색상에서 ColorToken 가져오기 (역변환)
 */
export function getColorTokenFromHex(hexColor: string): ColorToken {
  const hexMap: Record<string, ColorToken> = {
    '#ef4444': ColorToken.RED, // red-500
    '#f97316': ColorToken.ORANGE, // orange-500
    '#f59e0b': ColorToken.AMBER, // amber-500
    '#10b981': ColorToken.GREEN, // green-500
    '#3b82f6': ColorToken.BLUE, // blue-500
    '#a855f7': ColorToken.PURPLE, // purple-500
    '#ec4899': ColorToken.PINK, // pink-500
    '#9ca3af': ColorToken.GRAY, // gray-400
    // 다크모드 HEX도 포함
    '#f87171': ColorToken.RED, // red-400
    '#fb923c': ColorToken.ORANGE, // orange-400
    '#fbbf24': ColorToken.AMBER, // amber-400
    '#4ade80': ColorToken.GREEN, // green-400
    '#60a5fa': ColorToken.BLUE, // blue-400
    '#c084fc': ColorToken.PURPLE, // purple-400
    '#f472b6': ColorToken.PINK, // pink-400
  };
  return hexMap[hexColor.toLowerCase()] || ColorToken.GRAY;
}
