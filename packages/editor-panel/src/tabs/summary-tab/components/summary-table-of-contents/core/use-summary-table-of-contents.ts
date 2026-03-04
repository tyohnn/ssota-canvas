'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { JSONContent } from '@tiptap/core';
import { useTableOfContentsController } from '@workspace/ui/components/ssota-ui/table-of-contents';
import type { SummaryTableOfContentsProps } from './types';
import { extractHeadingsFromTiptapJSON, type SummaryTOCItem } from './utils';

export function useSummaryTableOfContents({
  tiptapContent,
  showTOC,
}: SummaryTableOfContentsProps) {
  const headings = useMemo(
    () => extractHeadingsFromTiptapJSON((tiptapContent as JSONContent) ?? null),
    [tiptapContent]
  );

  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!showTOC || headings.length === 0) return;

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100;
      const headingElements = headings
        .map((item) => {
          const el = document.getElementById(item.elementId || item.id);
          return el ? { id: item.id, element: el } : null;
        })
        .filter((x): x is { id: string; element: HTMLElement } => x !== null);

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
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showTOC, headings]);

  const mapToUiItem = useCallback((h: SummaryTOCItem) => ({ id: h.id, label: h.text, level: h.level }), []);
  const getIsDomainItemActive = useCallback(
    (item: SummaryTOCItem) => activeHeadingId === item.id,
    [activeHeadingId]
  );
  const onDomainItemClick = useCallback((item: SummaryTOCItem) => {
    const element = document.getElementById(item.elementId || item.id);
    if (!element) return;
    const offset = 60;
    const scrollContainer = document.querySelector(
      '[data-content-area-scroll-container="true"]'
    ) as HTMLElement | null;

    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const relativeTop = elementRect.top - containerRect.top;
      scrollContainer.scrollTo({
        top: scrollContainer.scrollTop + relativeTop - offset,
        behavior: 'smooth',
      });
    } else {
      const offsetPosition = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }, []);

  return useTableOfContentsController<SummaryTOCItem>({
    items: headings,
    mapToUiItem,
    getIsDomainItemActive,
    onDomainItemClick,
  });
}
