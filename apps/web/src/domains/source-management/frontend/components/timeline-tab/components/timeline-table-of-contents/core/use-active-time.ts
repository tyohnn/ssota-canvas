'use client';

import { useEffect, useState } from 'react';

export function useActiveTime(
  transcript: Array<{ start: number; text: string }> | undefined,
  showTOC: boolean
) {
  const [activeTime, setActiveTime] = useState<number | null>(null);

  useEffect(() => {
    if (!transcript || transcript.length === 0 || !showTOC) return;

    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -50% 0px',
      threshold: [0, 0.1, 0.5, 1],
    };

    const observer = new IntersectionObserver((entries) => {
      const visibleEntries = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => {
          const aRect = a.boundingClientRect;
          const bRect = b.boundingClientRect;
          return aRect.top - bRect.top;
        });

      if (visibleEntries.length > 0 && visibleEntries[0]) {
        const topEntry = visibleEntries[0];
        const segmentTime = topEntry.target.getAttribute('data-segment-time');
        if (segmentTime) setActiveTime(parseFloat(segmentTime));
      }
    }, observerOptions);

    const segments = document.querySelectorAll('[data-segment-time]');
    segments.forEach((segment) => observer.observe(segment));

    return () => observer.disconnect();
  }, [transcript, showTOC]);

  return { activeTime };
}
