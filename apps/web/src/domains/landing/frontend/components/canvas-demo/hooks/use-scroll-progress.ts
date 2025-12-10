/**
 * useScrollProgress Hook
 *
 * 스크롤 위치를 추적하여 현재 섹션과 서브 페이즈를 계산
 */

'use client';

import { useState, useEffect } from 'react';

interface ScrollProgress {
  section: number; // 현재 섹션 인덱스 (0-4)
  subPhase: number; // 섹션 내 서브 페이즈 (0-3)
  scrollProgress: number; // 섹션 내 진행률 (0-1)
}

/**
 * 각 섹션의 서브 페이즈 개수
 */
const SECTION_PHASES = {
  0: 4, // Section 1: 4 usecases
  1: 6, // Section 2: 6 phases
  2: 3, // Section 3: 3 phases
  3: 4, // Section 4: 4 phases
  4: 5, // Section 5: 5 phases
};

function getSectionPhases(sectionIndex: number): number {
  return SECTION_PHASES[sectionIndex as keyof typeof SECTION_PHASES] || 1;
}

export function useScrollProgress(): ScrollProgress {
  const [section, setSection] = useState(0);
  const [subPhase, setSubPhase] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.landing-section');
      const scrollY = window.scrollY;

      // Find current section
      sections.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const sectionTop = rect.top + scrollY;
        const sectionHeight = rect.height;

        // Check if we're in this section
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          setSection(index);

          // Calculate progress within section (0-1)
          const sectionProgress = (scrollY - sectionTop) / sectionHeight;
          setScrollProgress(sectionProgress);

          // Calculate sub-phase (0-based index)
          const phases = getSectionPhases(index);
          const currentPhase = Math.min(
            Math.floor(sectionProgress * phases),
            phases - 1
          );
          setSubPhase(currentPhase);
        }
      });
    };

    // Initial call
    handleScroll();

    // Listen to scroll events
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { section, subPhase, scrollProgress };
}
