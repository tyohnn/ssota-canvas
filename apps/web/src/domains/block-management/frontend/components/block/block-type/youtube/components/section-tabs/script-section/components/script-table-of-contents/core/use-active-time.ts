/**
 * Use Active Time Hook
 *
 * 스크롤 위치에 따라 현재 상단에 있는 segment를 감지하여 활성 시간을 반환합니다.
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * Use Active Time Hook Result
 */
export interface UseActiveTimeResult {
  activeTime: number | null;
}

/**
 * Use Active Time Hook
 *
 * IntersectionObserver를 사용하여 현재 화면 상단에 있는 segment를 감지합니다.
 *
 * @param transcript - 스크립트 세그먼트 배열
 * @param showTOC - 목차 표시 여부
 * @returns 활성 시간
 */
export function useActiveTime(
  transcript: Array<{ start: number; text: string }> | undefined,
  showTOC: boolean
): UseActiveTimeResult {
  const [activeTime, setActiveTime] = useState<number | null>(null);

  useEffect(() => {
    if (!transcript || transcript.length === 0 || !showTOC) {
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -50% 0px', // 상단 100px 지점 감지
      threshold: [0, 0.1, 0.5, 1],
    };

    const observer = new IntersectionObserver(entries => {
      // 상단에 가장 가까운 segment 찾기
      const visibleEntries = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => {
          const aRect = a.boundingClientRect;
          const bRect = b.boundingClientRect;
          return aRect.top - bRect.top;
        });

      if (visibleEntries.length > 0 && visibleEntries[0]) {
        const topEntry = visibleEntries[0];
        const segmentTime = topEntry.target.getAttribute('data-segment-time');
        if (segmentTime) {
          setActiveTime(parseFloat(segmentTime));
        }
      }
    }, observerOptions);

    // 모든 segment 관찰
    const segments = document.querySelectorAll('[data-segment-time]');
    segments.forEach(segment => observer.observe(segment));

    return () => {
      observer.disconnect();
    };
  }, [transcript, showTOC]);

  return { activeTime };
}
