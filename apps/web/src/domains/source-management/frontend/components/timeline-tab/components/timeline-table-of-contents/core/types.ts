import type { TOCItem } from '../../../core/utils';

export interface TimelineTableOfContentsProps {
  transcript: Array<{ start: number; text: string }> | undefined;
  showTOC: boolean;
}

export interface TableOfContentsUIState {
  isHovered: boolean;
  setIsHovered: (isHovered: boolean) => void;
}

export interface UseActiveTimeResult {
  activeTime: number | null;
}

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
