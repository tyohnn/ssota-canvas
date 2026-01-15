/**
 * Badge Style Utilities
 *
 * Property Input 컴포넌트에서 사용하는 Badge 스타일 유틸리티
 * style-tokens.types.ts의 ColorToken 기반으로 색상을 관리합니다.
 */

import {
  ColorToken,
  COLOR_TOKEN_CLASSES,
} from '@/domains/block-management/shared/types/style-tokens.types';

/**
 * 문자열 색상을 ColorToken으로 변환
 * Option Item과 동일한 매핑 로직 사용
 */
function mapColorToToken(color: string): ColorToken {
  if (!color) return ColorToken.GRAY;

  const colorStr = color.toLowerCase();
  const tokenMap: Record<string, ColorToken> = {
    red: ColorToken.RED,
    orange: ColorToken.ORANGE,
    amber: ColorToken.AMBER,
    green: ColorToken.GREEN,
    blue: ColorToken.BLUE,
    purple: ColorToken.PURPLE,
    pink: ColorToken.PINK,
    gray: ColorToken.GRAY,
    emerald: ColorToken.GREEN, // emerald는 green으로 매핑
  };

  return tokenMap[colorStr] || ColorToken.GRAY;
}

/**
 * Tailwind 클래스 문자열 반환 (일반 Badge용)
 * Option Item과 동일한 방식으로 사용 가능
 */
export function getBadgeClasses(color?: string): string {
  if (!color) {
    const grayClasses = COLOR_TOKEN_CLASSES[ColorToken.GRAY];
    return `${grayClasses.background} ${grayClasses.text} ${grayClasses.border}`;
  }

  const colorToken = mapColorToToken(color);
  const classes = COLOR_TOKEN_CLASSES[colorToken];
  return `${classes.background} ${classes.text} ${classes.border}`;
}

/**
 * 인라인 스타일 객체 반환 (Select 드롭다운 등에서 사용)
 * Tailwind 클래스가 제한적인 경우에 사용
 *
 * 참고: 라이트 모드 기준 RGB 값 반환 (다크 모드는 Tailwind 클래스로 처리)
 */
export function getBadgeStyleObject(color?: string): {
  backgroundColor: string;
  borderColor: string;
  color: string;
} {
  if (!color) {
    return {
      backgroundColor: '#F3F4F6', // gray-100
      borderColor: '#E5E7EB', // gray-300
      color: '#374151', // gray-900
    };
  }

  const colorToken = mapColorToToken(color);

  // ColorToken → RGB 값 매핑 (Tailwind 색상 기준)
  const colorMap: Record<
    ColorToken,
    { backgroundColor: string; borderColor: string; color: string }
  > = {
    [ColorToken.RED]: {
      backgroundColor: '#FEE2E2', // red-100
      borderColor: '#FCA5A5', // red-300
      color: '#991B1B', // red-900
    },
    [ColorToken.ORANGE]: {
      backgroundColor: '#FFEDD5', // orange-100
      borderColor: '#FED7AA', // orange-300
      color: '#9A3412', // orange-900
    },
    [ColorToken.AMBER]: {
      backgroundColor: '#FEF3C7', // amber-100
      borderColor: '#FCD34D', // amber-300
      color: '#78350F', // amber-900
    },
    [ColorToken.GREEN]: {
      backgroundColor: '#D1FAE5', // green-100
      borderColor: '#6EE7B7', // green-300
      color: '#065F46', // green-900
    },
    [ColorToken.BLUE]: {
      backgroundColor: '#DBEAFE', // blue-100
      borderColor: '#93C5FD', // blue-300
      color: '#1E40AF', // blue-900
    },
    [ColorToken.PURPLE]: {
      backgroundColor: '#F3E8FF', // purple-100
      borderColor: '#C4B5FD', // purple-300
      color: '#581C87', // purple-900
    },
    [ColorToken.PINK]: {
      backgroundColor: '#FCE7F3', // pink-100
      borderColor: '#F9A8D4', // pink-300
      color: '#831843', // pink-900
    },
    [ColorToken.GRAY]: {
      backgroundColor: '#F3F4F6', // gray-100
      borderColor: '#E5E7EB', // gray-300
      color: '#374151', // gray-900
    },
  };

  return colorMap[colorToken] || colorMap[ColorToken.GRAY];
}
