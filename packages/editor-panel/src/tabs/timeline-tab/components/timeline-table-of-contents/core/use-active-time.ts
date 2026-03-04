'use client';

import { useEffect, useState } from 'react';

export function useActiveTime(
  transcript: Array<{ start: number; text: string }> | undefined,
  showTOC: boolean
) {
  const [activeTime, setActiveTime] = useState<number | null>(null);

  useEffect(() => {
    if (!transcript || transcript.length === 0 || !showTOC) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const t = visible[0].target.getAttribute('data-segment-time');
          if (t) setActiveTime(parseFloat(t));
        }
      },
      { root: null, rootMargin: '-100px 0px -50% 0px', threshold: [0, 0.1, 0.5, 1] }
    );

    document.querySelectorAll('[data-segment-time]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [transcript, showTOC]);

  return { activeTime };
}
