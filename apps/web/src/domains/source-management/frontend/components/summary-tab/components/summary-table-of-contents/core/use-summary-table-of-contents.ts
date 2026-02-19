'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  SummaryTableOfContentsProps,
  UseSummaryTableOfContentsResult,
} from './types';
import {
  extractHeadingsFromTiptapJSON,
  type SummaryTOCItem,
} from './utils';

export function useSummaryTableOfContents({
  tiptapContent,
  showTOC,
}: SummaryTableOfContentsProps): UseSummaryTableOfContentsResult {
  const headings = useMemo(() => {
    return extractHeadingsFromTiptapJSON(
      tiptapContent as import('@tiptap/core').JSONContent | null | undefined
    );
  }, [tiptapContent]);

  const [isHovered, setIsHovered] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!showTOC || headings.length === 0) {
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;

      const headingElements = headings
        .map(item => {
          const element = document.getElementById(item.elementId || item.id);
          return element ? { id: item.id, element } : null;
        })
        .filter((item): item is { id: string; element: HTMLElement } =>
          item !== null
        );

      let currentActiveId: string | null = null;
      for (let i = headingElements.length - 1; i >= 0; i--) {
        const item = headingElements[i];
        if (!item) continue;
        const { id, element } = item;
        if (element.offsetTop <= scrollPosition) {
          currentActiveId = id;
          break;
        }
      }

      setActiveHeadingId(currentActiveId);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showTOC, headings]);

  const getActiveHeading = useCallback(
    (item: SummaryTOCItem): boolean => {
      return activeHeadingId === item.id;
    },
    [activeHeadingId]
  );

  const handleHeadingClick = useCallback((item: SummaryTOCItem) => {
    const element = document.getElementById(item.elementId || item.id);

    if (element) {
      const offset = 60;
      const scrollContainer = document.querySelector(
        '[data-content-area-scroll-container="true"]'
      ) as HTMLElement;

      if (scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top;
        const scrollPosition =
          scrollContainer.scrollTop + relativeTop - offset;

        scrollContainer.scrollTo({
          top: scrollPosition,
          behavior: 'smooth',
        });
      } else {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return {
    headings,
    isHovered,
    getActiveHeading,
    handleHeadingClick,
    handleMouseEnter,
    handleMouseLeave,
  };
}
