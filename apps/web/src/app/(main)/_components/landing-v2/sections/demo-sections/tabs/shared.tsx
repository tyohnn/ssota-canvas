"use client";

/**
 * Shared components and constants for demo tabs
 */

export function SparklesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-yellow-500"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}

export enum ColorToken {
  RED = "red",
  ORANGE = "orange",
  AMBER = "amber",
  GREEN = "green",
  BLUE = "blue",
  PURPLE = "purple",
  PINK = "pink",
  GRAY = "gray",
}

export const COLOR_CLASSES: Record<ColorToken, string> = {
  [ColorToken.RED]:
    "bg-red-100 dark:bg-red-900/40 border-red-200 dark:border-red-800 text-red-900 dark:text-red-100",
  [ColorToken.ORANGE]:
    "bg-orange-100 dark:bg-orange-900/40 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-100",
  [ColorToken.AMBER]:
    "bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100",
  [ColorToken.GREEN]:
    "bg-green-100 dark:bg-green-900/40 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100",
  [ColorToken.BLUE]:
    "bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100",
  [ColorToken.PURPLE]:
    "bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100",
  [ColorToken.PINK]:
    "bg-pink-100 dark:bg-pink-900/40 border-pink-200 dark:border-pink-800 text-pink-900 dark:text-pink-100",
  [ColorToken.GRAY]:
    "bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100",
};
