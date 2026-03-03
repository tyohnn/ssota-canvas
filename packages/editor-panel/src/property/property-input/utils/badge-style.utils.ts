/**
 * Badge Style Utilities (package-owned)
 * ColorToken-based styling for property inputs.
 */

import {
  ColorToken,
  COLOR_TOKEN_CLASSES,
  mapColorToToken,
} from './color-tokens';

export function getBadgeClasses(color?: string): string {
  if (!color) {
    const grayClasses = COLOR_TOKEN_CLASSES[ColorToken.GRAY];
    return `${grayClasses.background} ${grayClasses.text} ${grayClasses.border}`;
  }
  const colorToken = mapColorToToken(color);
  const classes = COLOR_TOKEN_CLASSES[colorToken];
  return `${classes.background} ${classes.text} ${classes.border}`;
}

export function getBadgeStyleObject(color?: string): {
  backgroundColor: string;
  borderColor: string;
  color: string;
} {
  if (!color) {
    return {
      backgroundColor: '#F3F4F6',
      borderColor: '#E5E7EB',
      color: '#374151',
    };
  }
  const colorToken = mapColorToToken(color);
  const colorMap: Record<
    ColorToken,
    { backgroundColor: string; borderColor: string; color: string }
  > = {
    [ColorToken.RED]: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', color: '#991B1B' },
    [ColorToken.ORANGE]: { backgroundColor: '#FFEDD5', borderColor: '#FED7AA', color: '#9A3412' },
    [ColorToken.AMBER]: { backgroundColor: '#FEF3C7', borderColor: '#FCD34D', color: '#78350F' },
    [ColorToken.GREEN]: { backgroundColor: '#D1FAE5', borderColor: '#6EE7B7', color: '#065F46' },
    [ColorToken.BLUE]: { backgroundColor: '#DBEAFE', borderColor: '#93C5FD', color: '#1E40AF' },
    [ColorToken.PURPLE]: { backgroundColor: '#F3E8FF', borderColor: '#C4B5FD', color: '#581C87' },
    [ColorToken.PINK]: { backgroundColor: '#FCE7F3', borderColor: '#F9A8D4', color: '#831843' },
    [ColorToken.GRAY]: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB', color: '#374151' },
  };
  return colorMap[colorToken] ?? colorMap[ColorToken.GRAY];
}
