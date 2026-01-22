/**
 * Summary Scroll Spy Hook
 *
 * 스크롤 위치에 따라 TOC 표시 여부 결정
 */

'use client';

import { useLayoutEffect, useState } from 'react';
import type React from 'react';

/**
 * Use Summary Scroll Spy Hook
 *
 * @param containerRef - 컨테이너 ref
 * @param hasHeadings - 헤더가 있는지 여부
 * @returns showTOC - TOC 표시 여부
 */
export function useSummaryScrollSpy<T extends HTMLElement = HTMLElement>(
  containerRef: React.RefObject<T | null>,
  hasHeadings: boolean
): { showTOC: boolean } {
  const [showTOC, setShowTOC] = useState(false);

  useLayoutEffect(() => {
    if (!hasHeadings) {
      setShowTOC(false);
      return;
    }

    const handleScroll = () => {
      if (!containerRef.current) {
        return;
      }

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const scrollTop = window.scrollY || document.documentElement.scrollTop;

      // 컨테이너가 뷰포트에 보이는지 확인
      const isVisible =
        containerRect.top < window.innerHeight &&
        containerRect.bottom > 0;

      // 스크롤이 충분히 내려갔는지 확인 (헤더 영역을 지났는지)
      const shouldShow = isVisible && scrollTop > 200;

      setShowTOC(shouldShow);
    };

    // containerRef가 설정될 때까지 기다리기 위해 requestAnimationFrame 사용
    const setupScrollListener = () => {
      if (!containerRef.current) {
        requestAnimationFrame(setupScrollListener);
        return;
      }

      // 초기 체크
      handleScroll();

      window.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll, { passive: true });
    };

    setupScrollListener();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [hasHeadings]);

  return { showTOC };
}
