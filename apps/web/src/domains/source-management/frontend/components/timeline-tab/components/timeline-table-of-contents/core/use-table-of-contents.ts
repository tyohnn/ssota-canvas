'use client';

import { useCallback } from 'react';

import { type TOCItem, generateMinuteTOC } from '../../../core/utils';
import { useActiveTime } from './use-active-time';
import { useTableOfContentsUI } from './use-table-of-contents.ui';

export function useTableOfContents(
  transcript: Array<{ start: number; text: string }> | undefined,
  showTOC: boolean
) {
  const allTocItems = generateMinuteTOC(transcript);
  const { isHovered, setIsHovered } = useTableOfContentsUI();
  const { activeTime } = useActiveTime(transcript, showTOC);

  const tocItems = allTocItems.slice(0, 20);

  const getActiveTOCItem = useCallback(
    (item: TOCItem): boolean => {
      if (activeTime === null) return false;
      const nextItem = allTocItems.find((t: TOCItem) => t.startTime > item.startTime);
      const endTime = nextItem ? nextItem.startTime : Infinity;
      return activeTime >= item.startTime && activeTime < endTime;
    },
    [activeTime, allTocItems]
  );

  const handleTOCClick = useCallback((item: TOCItem) => {
    const targetElement = document.querySelector(
      `[data-segment-time="${item.startTime}"]`
    );
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleMouseEnter = useCallback(() => setIsHovered(true), [setIsHovered]);
  const handleMouseLeave = useCallback(() => setIsHovered(false), [setIsHovered]);

  return {
    allTocItems,
    tocItems,
    isHovered,
    activeTime,
    getActiveTOCItem,
    handleTOCClick,
    handleMouseEnter,
    handleMouseLeave,
  };
}
