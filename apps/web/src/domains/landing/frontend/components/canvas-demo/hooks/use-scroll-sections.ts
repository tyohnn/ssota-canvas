/**
 * useScrollSections Hook
 *
 * 스크롤 이벤트를 감지하여 섹션과 서브 페이즈 계산
 * - 화면 고정 (100vh)
 * - 스크롤 이벤트로 내용만 전환
 * - Canvas 위에서도 스크롤 감지
 */

'use client';

import { useEffect, useState } from 'react';

interface ScrollSections {
  section: number; // 현재 섹션 인덱스 (0-4)
  subPhase: number; // 섹션 내 서브 페이즈 (0-3)
  scrollProgress: number; // 전체 스크롤 진행률 (0-1)
}

/**
 * 각 섹션의 서브 페이즈 개수
 */
const SECTION_PHASES = {
  0: 5, // Section 1: 1 intro + 4 phases (Plan, Design, Develop, Deploy)
  1: 6, // Section 2: 6 phases
  2: 3, // Section 3: 3 phases
  3: 4, // Section 4: 4 phases
  4: 5, // Section 5: 5 phases
};

const TOTAL_SECTIONS = 5;
const SCROLL_THRESHOLD = 150; // 150px per phase change (더 많이 스크롤해야 변경)

export function useScrollSections(): ScrollSections {
  const [section, setSection] = useState(0);
  const [subPhase, setSubPhase] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [accumulatedScroll, setAccumulatedScroll] = useState(0);

  useEffect(() => {
    let lastScrollY = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY;
      const newAccumulated = accumulatedScroll + delta;

      // Calculate total progress
      const phases = Object.values(SECTION_PHASES).reduce((a, b) => a + b, 0);
      const maxScroll = phases * SCROLL_THRESHOLD;
      const clampedScroll = Math.max(0, Math.min(newAccumulated, maxScroll));

      setAccumulatedScroll(clampedScroll);

      // Calculate section and subPhase
      const progress = clampedScroll / maxScroll;
      setScrollProgress(progress);

      let currentScroll = clampedScroll;
      let currentSection = 0;
      let currentSubPhase = 0;

      for (let i = 0; i < TOTAL_SECTIONS; i++) {
        const sectionPhases = SECTION_PHASES[i as keyof typeof SECTION_PHASES];
        const sectionScroll = sectionPhases * SCROLL_THRESHOLD;

        if (currentScroll >= sectionScroll) {
          currentScroll -= sectionScroll;
          currentSection = i + 1;
        } else {
          currentSection = i;
          currentSubPhase = Math.floor(currentScroll / SCROLL_THRESHOLD);
          break;
        }
      }

      // Clamp values
      currentSection = Math.min(currentSection, TOTAL_SECTIONS - 1);
      const maxSubPhase =
        SECTION_PHASES[currentSection as keyof typeof SECTION_PHASES] - 1;
      currentSubPhase = Math.min(currentSubPhase, maxSubPhase);

      setSection(currentSection);
      setSubPhase(currentSubPhase);
    };

    // Passive false to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [accumulatedScroll]);

  return { section, subPhase, scrollProgress };
}
