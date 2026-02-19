/**
 * Script Table of Contents Types
 *
 * 타입 정의
 */
import type { TOCItem } from '../../../core/utils';

/**
 * Script Table of Contents Props
 */
export interface ScriptTableOfContentsProps {
  transcript: Array<{ start: number; text: string }> | undefined;
  showTOC: boolean;
}

/**
 * Table of Contents UI State
 */
export interface TableOfContentsUIState {
  isHovered: boolean;
  setIsHovered: (isHovered: boolean) => void;
}

/**
 * Active Time Hook Result
 */
export interface UseActiveTimeResult {
  activeTime: number | null;
}

/**
 * Table of Contents Hook Result
 */
export interface UseTableOfContentsResult {
  allTocItems: TOCItem[];
  tocItems: TOCItem[];
  isHovered: boolean;
  activeTime: number | null;
  getActiveTOCItem: (item: TOCItem) => boolean;
  handleTOCClick: (item: TOCItem) => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}
