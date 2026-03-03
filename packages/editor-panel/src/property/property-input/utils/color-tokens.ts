/**
 * Color Tokens (package-owned, minimal for property inputs)
 * Self-contained - no external domain imports.
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

const COLOR_PREVIEW_CLASSES: Record<ColorToken, string> = {
  [ColorToken.RED]: 'bg-red-100 dark:bg-red-900',
  [ColorToken.ORANGE]: 'bg-orange-100 dark:bg-orange-900',
  [ColorToken.AMBER]: 'bg-amber-100 dark:bg-amber-900',
  [ColorToken.GREEN]: 'bg-green-100 dark:bg-green-900',
  [ColorToken.BLUE]: 'bg-blue-100 dark:bg-blue-900',
  [ColorToken.PURPLE]: 'bg-purple-100 dark:bg-purple-900',
  [ColorToken.PINK]: 'bg-pink-100 dark:bg-pink-900',
  [ColorToken.GRAY]: 'bg-gray-100 dark:bg-gray-900',
};

const COLOR_LABELS: Record<ColorToken, string> = {
  [ColorToken.RED]: 'Red',
  [ColorToken.ORANGE]: 'Orange',
  [ColorToken.AMBER]: 'Amber',
  [ColorToken.GREEN]: 'Green',
  [ColorToken.BLUE]: 'Blue',
  [ColorToken.PURPLE]: 'Purple',
  [ColorToken.PINK]: 'Pink',
  [ColorToken.GRAY]: 'Gray',
};

const COLOR_TOKEN_CLASSES: Record<
  ColorToken,
  { background: string; text: string; border: string; selectedRing: string }
> = {
  [ColorToken.RED]: {
    background: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-900 dark:text-red-100',
    border: 'border-red-300 dark:border-red-700',
    selectedRing: 'ring-2 ring-red-400',
  },
  [ColorToken.ORANGE]: {
    background: 'bg-orange-100 dark:bg-orange-900',
    text: 'text-orange-900 dark:text-orange-100',
    border: 'border-orange-300 dark:border-orange-700',
    selectedRing: 'ring-2 ring-orange-400',
  },
  [ColorToken.AMBER]: {
    background: 'bg-amber-100 dark:bg-amber-900',
    text: 'text-amber-900 dark:text-amber-100',
    border: 'border-amber-300 dark:border-amber-700',
    selectedRing: 'ring-2 ring-amber-400',
  },
  [ColorToken.GREEN]: {
    background: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-900 dark:text-green-100',
    border: 'border-green-300 dark:border-green-700',
    selectedRing: 'ring-2 ring-green-400',
  },
  [ColorToken.BLUE]: {
    background: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-900 dark:text-blue-100',
    border: 'border-blue-300 dark:border-blue-700',
    selectedRing: 'ring-2 ring-blue-400',
  },
  [ColorToken.PURPLE]: {
    background: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-900 dark:text-purple-100',
    border: 'border-purple-300 dark:border-purple-700',
    selectedRing: 'ring-2 ring-purple-400',
  },
  [ColorToken.PINK]: {
    background: 'bg-pink-100 dark:bg-pink-900',
    text: 'text-pink-900 dark:text-pink-100',
    border: 'border-pink-300 dark:border-pink-700',
    selectedRing: 'ring-2 ring-pink-400',
  },
  [ColorToken.GRAY]: {
    background: 'bg-gray-100 dark:bg-gray-900',
    text: 'text-gray-900 dark:text-gray-100',
    border: 'border-gray-300 dark:border-gray-700',
    selectedRing: 'ring-2 ring-gray-400',
  },
};

export function getColorPreviewClass(token: ColorToken): string {
  return COLOR_PREVIEW_CLASSES[token] ?? COLOR_PREVIEW_CLASSES[ColorToken.GRAY];
}

export function getColorLabel(token: ColorToken): string {
  return COLOR_LABELS[token] ?? COLOR_LABELS[ColorToken.GRAY];
}

export function getSelectedRingClasses(token: ColorToken): string {
  return COLOR_TOKEN_CLASSES[token]?.selectedRing ?? COLOR_TOKEN_CLASSES[ColorToken.GRAY].selectedRing;
}

export function mapColorToToken(color: string): ColorToken {
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
    emerald: ColorToken.GREEN,
  };
  return tokenMap[colorStr] ?? ColorToken.GRAY;
}

export { COLOR_TOKEN_CLASSES };
