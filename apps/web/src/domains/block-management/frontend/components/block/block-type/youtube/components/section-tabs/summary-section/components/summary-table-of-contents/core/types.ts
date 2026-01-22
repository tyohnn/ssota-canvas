/**
 * Summary Table of Contents Types
 *
 * 타입 정의
 */

import type { SummaryTOCItem } from './utils';

/**
 * Summary Table of Contents Props
 */
export interface SummaryTableOfContentsProps {
  tiptapContent: any; // TipTap JSON 콘텐츠
  showTOC: boolean;
}

/**
 * Table of Contents UI State
 */
export interface SummaryTableOfContentsUIState {
  isHovered: boolean;
  setIsHovered: (isHovered: boolean) => void;
}

/**
 * Table of Contents Hook Result
 */
export interface UseSummaryTableOfContentsResult {
  headings: SummaryTOCItem[];
  isHovered: boolean;
  getActiveHeading: (item: SummaryTOCItem) => boolean;
  handleHeadingClick: (item: SummaryTOCItem) => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}
