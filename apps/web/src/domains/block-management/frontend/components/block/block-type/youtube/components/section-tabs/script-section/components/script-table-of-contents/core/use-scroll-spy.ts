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

  // 초기 상태 확인 함수
  const checkInitialState = (
    headerElement: HTMLElement,
    scrollContainer: Element | null
  ) => {
    if (scrollContainer) {
      // ContentArea 스크롤 컨테이너 기준으로 확인
      const containerRect = scrollContainer.getBoundingClientRect();
      const headerRect = headerElement.getBoundingClientRect();
      // 헤더가 컨테이너 상단에 있는지 확인
      const atTop = headerRect.top <= containerRect.top + 10;
      setIsHeaderAtTop(atTop);
      if (atTop) {
        setShowTOC(true);
      }
    } else {
      // window 기준으로 확인 (fallback)
      const rect = headerElement.getBoundingClientRect();
      const atTop = rect.top <= 10;
      setIsHeaderAtTop(atTop);
      if (atTop) {
        setShowTOC(true);
      }
    }
  };

  useEffect(() => {
    const headerElement = headerRef.current;
    if (!headerElement) {
      return;
    }

    // ContentArea 스크롤 컨테이너 찾기
    const scrollContainer = document.querySelector(
      '[data-content-area-scroll-container="true"]'
    );

    // 초기 상태 확인 (컴포넌트 마운트 시 또는 탭 전환 후)
    // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 확인
    const initialCheckTimer = setTimeout(() => {
      checkInitialState(headerElement, scrollContainer);
    }, 50);

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
        root: scrollContainer, // ContentArea 스크롤 컨테이너 기준
        rootMargin: '0px',
        threshold: [0, 0.1, 0.5, 1], // 여러 threshold로 정확한 감지
      }
    );

    observerRef.current.observe(headerElement);

    // 스크롤 이벤트로도 초기 상태 확인 (IntersectionObserver가 즉시 트리거되지 않을 수 있음)
    const handleScroll = () => {
      checkInitialState(headerElement, scrollContainer);
    };
    const scrollTarget = scrollContainer || window;
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(initialCheckTimer);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      scrollTarget.removeEventListener('scroll', handleScroll);
    };
  }, [headerRef]);

  return {
    isHeaderAtTop,
    showTOC,
  };
}
