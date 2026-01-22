/**
 * Use Summary Table of Contents Hook
 *
 * 헤더 기반 목차 컴포넌트의 메인 훅
 */

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

/**
 * Use Summary Table of Contents Hook
 *
 * @param tiptapContent - TipTap JSON 콘텐츠
 * @param showTOC - 목차 표시 여부
 * @returns 목차 관련 상태 및 핸들러
 */
export function useSummaryTableOfContents({
  tiptapContent,
  showTOC,
}: SummaryTableOfContentsProps): UseSummaryTableOfContentsResult {
  // 헤더 추출
  const headings = useMemo(() => {
    return extractHeadingsFromTiptapJSON(tiptapContent);
  }, [tiptapContent]);

  // UI 상태
  const [isHovered, setIsHovered] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);

  // 스크롤 위치에 따라 활성 헤더 감지
  useEffect(() => {
    if (!showTOC || headings.length === 0) {
      return;
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // 약간의 오프셋

      // 모든 헤더 요소 찾기
      const headingElements = headings
        .map(item => {
          const element = document.getElementById(item.elementId || item.id);
          return element ? { id: item.id, element } : null;
        })
        .filter((item): item is { id: string; element: HTMLElement } =>
          item !== null
        );

      // 현재 스크롤 위치에 해당하는 헤더 찾기
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
    handleScroll(); // 초기 실행

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [showTOC, headings]);

  // 활성 헤더 확인
  const getActiveHeading = useCallback(
    (item: SummaryTOCItem): boolean => {
      return activeHeadingId === item.id;
    },
    [activeHeadingId]
  );

  // 헤더 클릭 핸들러
  const handleHeadingClick = useCallback((item: SummaryTOCItem) => {
    const element = document.getElementById(item.elementId || item.id);

    if (element) {
      // 스크롤 컨테이너 찾기 (Editor Panel의 ContentArea)
      const scrollContainer = document.querySelector('[data-content-area-scroll-container="true"]') as HTMLElement;

      // sticky 헤더에 가려지지 않도록 오프셋 적용
      const offset = 60; // sticky 헤더 높이 + 여유 공간

      if (scrollContainer) {
        // Editor Panel 내부 스크롤 컨테이너 사용
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const relativeTop = elementRect.top - containerRect.top;
        const scrollPosition = scrollContainer.scrollTop + relativeTop - offset;

        scrollContainer.scrollTo({
          top: scrollPosition,
          behavior: 'smooth',
        });
      } else {
        // Fallback: window 스크롤 (일반 페이지인 경우)
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
