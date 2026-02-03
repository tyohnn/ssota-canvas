'use client';

import { cn } from '@workspace/ui/lib/utils';
import { Check } from 'lucide-react';
import { Box } from '@workspace/ui/components/ui/box';

interface StepIndicatorProps {
  totalSteps: number;
  currentStepIndex: number;
  completedSteps: Set<number>;
}

/**
 * Step Indicator (Presentational)
 *
 * Shows progress through tutorial steps
 */
export function StepIndicator({
  totalSteps,
  currentStepIndex,
  completedSteps,
}: StepIndicatorProps) {
  return (
    <Box className="flex items-center gap-2">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isCompleted = completedSteps.has(index);
        const isCurrent = index === currentStepIndex;
        const isPast = index < currentStepIndex;

        return (
          <Box
            key={index}
            className={cn(
              'flex items-center',
              index < totalSteps - 1 && 'flex-1'
            )}
          >
            {/* Step Circle */}
            <Box
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                isCurrent &&
                  'bg-accent text-accent-foreground ring-2 ring-accent ring-offset-2',
                isCompleted && !isCurrent && 'bg-green-500 text-white',
                !isCurrent &&
                  !isCompleted &&
                  'bg-muted text-muted-foreground'
              )}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
            </Box>

            {/* Connector Line */}
            {index < totalSteps - 1 && (
              <Box
                className={cn(
                  'h-0.5 flex-1 mx-2 transition-colors',
                  isPast || isCompleted ? 'bg-primary' : 'bg-muted'
                )}
              />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
