/**
 * Scroll Spy Hook
 *
 * 헤더가 상단에 도달했는지 감지하고 목차 표시 상태를 관리합니다.
 */

'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Scroll Spy Hook Return Type
 */
export interface UseScrollSpyResult {
  isHeaderAtTop: boolean; // 헤더가 상단에 도달했는지 여부
  showTOC: boolean; // 목차 표시 여부 (페이드인/아웃용)
}

/**
 * Scroll Spy Hook
 *
 * IntersectionObserver를 사용하여 헤더가 상단에 도달했는지 감지합니다.
 * 헤더가 상단에 도달하면 목차를 표시합니다.
 *
 * @param headerRef - 헤더 요소의 ref
 * @returns 헤더 도달 상태 및 목차 표시 상태
 */
export function useScrollSpy<T extends HTMLElement = HTMLElement>(
  headerRef: React.RefObject<T | null>
): UseScrollSpyResult {
  const [isHeaderAtTop, setIsHeaderAtTop] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const headerElement = headerRef.current;
    if (!headerElement) {
      return;
    }

    // IntersectionObserver로 헤더가 상단에 도달했는지 감지
    observerRef.current = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry) {
          // 헤더가 상단에 도달했는지 확인 (intersectionRatio가 0에 가까우면 상단에 도달)
          const atTop = entry.intersectionRatio < 0.1;
          setIsHeaderAtTop(atTop);

          // 페이드인/아웃을 위한 상태 업데이트 (약간의 지연)
          if (atTop) {
            // 헤더가 상단에 도달하면 목차 표시
            setTimeout(() => setShowTOC(true), 100);
          } else {
            // 헤더가 상단에서 벗어나면 목차 숨김
            setShowTOC(false);
          }
        }
      },
      {
        root: null, // viewport 기준
        rootMargin: '0px',
        threshold: [0, 0.1, 0.5, 1], // 여러 threshold로 정확한 감지
      }
    );

    observerRef.current.observe(headerElement);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [headerRef]);

  return {
    isHeaderAtTop,
    showTOC,
  };
}
