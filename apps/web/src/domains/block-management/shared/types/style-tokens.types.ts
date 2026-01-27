/**
 * Style Tokens Types
 *
 * Tailwind 토큰 기반의 스타일 시스템
 * - TAILWIND_COLOR_PALETTE가 단일 진실 공급원 (Single Source of Truth)
 * - 모든 색상 유틸리티는 이 팔레트를 참조
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
 * Tailwind 색상 팔레트 (SSOT - Single Source of Truth)
 *
 * 모든 색상 값은 이 팔레트에서만 정의하고, 다른 곳에서는 참조만 함
 * https://tailwindcss.com/docs/customizing-colors
 */
export const TAILWIND_COLOR_PALETTE: Record<
  ColorToken,
  {
    100: string; // 가장 밝은 톤 (배경용)
    400: string; // 밝은 톤 (글로우, 다크모드 강조)
    500: string; // 기본 톤 (테두리, 강조)
    700: string; // 어두운 톤 (라이트모드 텍스트)
    800: string; // 더 어두운 톤 (진한 텍스트)
    900: string; // 가장 어두운 톤 (다크모드 배경)
  }
> = {
  [ColorToken.GRAY]: {
    100: '#f3f4f6',
    400: '#9ca3af',
    500: '#6b7280',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  [ColorToken.RED]: {
    100: '#fee2e2',
    400: '#f87171',
    500: '#ef4444',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  [ColorToken.ORANGE]: {
    100: '#ffedd5',
    400: '#fb923c',
    500: '#f97316',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  [ColorToken.AMBER]: {
    100: '#fef3c7',
    400: '#fbbf24',
    500: '#f59e0b',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  [ColorToken.GREEN]: {
    100: '#d1fae5',
    400: '#4ade80',
    500: '#10b981',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  [ColorToken.BLUE]: {
    100: '#dbeafe',
    400: '#60a5fa',
    500: '#3b82f6',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  [ColorToken.PURPLE]: {
    100: '#ede9fe',
    400: '#c084fc',
    500: '#a855f7',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
  [ColorToken.PINK]: {
    100: '#fce7f3',
    400: '#f472b6',
    500: '#ec4899',
    700: '#be185d',
    800: '#9f1239',
    900: '#831843',
  },
};

/**
 * HEX를 RGB로 변환
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 0, g: 0, b: 0 };
  return {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16),
  };
}

/**
 * HEX를 RGBA 문자열로 변환
 */
function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * HEX를 RGB 문자열로 변환
 */
function hexToRgbString(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r},${g},${b})`;
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
 * - 400 톤 사용 (밝은 글로우 효과)
 */
export function getGlowColor(token: ColorToken): string {
  const palette = TAILWIND_COLOR_PALETTE[token] || TAILWIND_COLOR_PALETTE[ColorToken.GRAY];
  return hexToRgbString(palette[400]);
}

/**
 * HEX 색상 값 가져오기 (엣지 등에서 사용 - 라이트 모드)
 * - 500 톤 사용 (기본 강조색)
 * - GRAY는 400 톤 사용 (더 선명한 표현)
 */
export function getHexColor(token: ColorToken): string {
  const palette = TAILWIND_COLOR_PALETTE[token] || TAILWIND_COLOR_PALETTE[ColorToken.GRAY];
  return token === ColorToken.GRAY ? palette[400] : palette[500];
}

/**
 * HEX 색상 값 가져오기 (엣지 등에서 사용 - 다크 모드)
 * - 400 톤 사용 (밝은 강조색)
 */
export function getHexColorDark(token: ColorToken): string {
  const palette = TAILWIND_COLOR_PALETTE[token] || TAILWIND_COLOR_PALETTE[ColorToken.GRAY];
  return palette[400];
}

/**
 * HEX → ColorToken 역변환 맵 (TAILWIND_COLOR_PALETTE에서 동적 생성)
 */
const HEX_TO_COLOR_TOKEN_MAP: Record<string, ColorToken> = (() => {
  const map: Record<string, ColorToken> = {};
  for (const token of Object.values(ColorToken)) {
    const palette = TAILWIND_COLOR_PALETTE[token];
    // 400, 500 톤을 역변환에 등록
    map[palette[400].toLowerCase()] = token;
    map[palette[500].toLowerCase()] = token;
  }
  return map;
})();

/**
 * HEX 색상에서 ColorToken 가져오기 (역변환)
 */
export function getColorTokenFromHex(hexColor: string): ColorToken {
  return HEX_TO_COLOR_TOKEN_MAP[hexColor.toLowerCase()] || ColorToken.GRAY;
}

/**
 * 그룹 블록용 색상 인터페이스
 */
export interface GroupColorValues {
  /** 반투명 배경색 (rgba, 0.3 alpha) */
  bg: string;
  /** 테두리 색상 (hex) */
  border: string;
  /** 텍스트 색상 (hex) */
  text: string;
  /** 헤더 배경색 (hex) */
  header: string;
}

/**
 * 그룹 블록용 색상 값 생성 함수
 * - bg: 100 톤 기반 반투명 (0.3 alpha)
 * - border: 500 톤 (강조색), GRAY는 400 톤
 * - text: 700 톤 (진한 텍스트)
 * - header: 100 톤 (밝은 배경)
 */
function createGroupColorValues(token: ColorToken): GroupColorValues {
  const palette = TAILWIND_COLOR_PALETTE[token];
  return {
    bg: hexToRgba(palette[100], 0.3),
    border: token === ColorToken.GRAY ? palette[400] : palette[500],
    text: palette[700],
    header: palette[100],
  };
}

/**
 * 그룹 블록용 색상 값 매핑 (TAILWIND_COLOR_PALETTE에서 동적 생성)
 */
export const GROUP_COLOR_VALUES: Record<ColorToken, GroupColorValues> = {
  [ColorToken.GRAY]: createGroupColorValues(ColorToken.GRAY),
  [ColorToken.RED]: createGroupColorValues(ColorToken.RED),
  [ColorToken.ORANGE]: createGroupColorValues(ColorToken.ORANGE),
  [ColorToken.AMBER]: createGroupColorValues(ColorToken.AMBER),
  [ColorToken.GREEN]: createGroupColorValues(ColorToken.GREEN),
  [ColorToken.BLUE]: createGroupColorValues(ColorToken.BLUE),
  [ColorToken.PURPLE]: createGroupColorValues(ColorToken.PURPLE),
  [ColorToken.PINK]: createGroupColorValues(ColorToken.PINK),
};

/**
 * 그룹 블록용 색상 값 가져오기
 */
export function getGroupColorValues(token: ColorToken): GroupColorValues {
  return GROUP_COLOR_VALUES[token] || GROUP_COLOR_VALUES[ColorToken.BLUE];
}
