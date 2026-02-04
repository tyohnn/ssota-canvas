'use client';

import { useEffect, useState } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@workspace/ui/components/ui/box';

/**
 * Step Highlight
 *
 * Glow-only highlight for the current step's target (no background).
 * Matches landing page demo: box-shadow pulse, no fill.
 */
export function StepHighlight() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Glow only - no background, same as landing demo highlight-pulse */}
      <Box
        className={cn(
          'absolute -inset-1 rounded-lg pointer-events-none transition-opacity duration-500',
          animate ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          animation: animate
            ? 'step-highlight-glow 2.5s ease-in-out infinite'
            : undefined,
        }}
      />
      {animate && (
        <style>
          {`
            @keyframes step-highlight-glow {
              0%, 100% {
                box-shadow: 0 0 0 0 rgba(96, 165, 250, 0.3), 0 0 16px 3px rgba(96, 165, 250, 0.15);
              }
              50% {
                box-shadow: 0 0 0 4px rgba(96, 165, 250, 0.2), 0 0 24px 6px rgba(96, 165, 250, 0.25);
              }
            }
          `}
        </style>
      )}
    </>
  );
}
