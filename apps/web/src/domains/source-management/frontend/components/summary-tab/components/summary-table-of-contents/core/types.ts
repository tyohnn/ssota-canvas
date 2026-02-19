import type { SummaryTOCItem } from './utils';

export interface SummaryTableOfContentsProps {
  tiptapContent: unknown;
  showTOC: boolean;
}

export interface SummaryTableOfContentsUIState {
  isHovered: boolean;
  setIsHovered: (isHovered: boolean) => void;
}

export interface UseSummaryTableOfContentsResult {
  headings: SummaryTOCItem[];
  isHovered: boolean;
  getActiveHeading: (item: SummaryTOCItem) => boolean;
  handleHeadingClick: (item: SummaryTOCItem) => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}
