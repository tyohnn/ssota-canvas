'use client';

import { Button } from '@workspace/ui/components/ui/button';
import { Box } from '@workspace/ui/components/ui/box';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { ReactNode } from 'react';

interface StepInstructionProps {
  title: string;
  description: ReactNode;
  currentStepIndex: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSkip: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

/**
 * Step Instruction (Presentational)
 *
 * Shows current step instructions and navigation controls
 */
export function StepInstruction({
  title,
  description,
  currentStepIndex,
  totalSteps,
  onPrevious,
  onNext,
  onSkip,
  canGoPrevious,
  canGoNext,
}: StepInstructionProps) {
  const isLastStep = currentStepIndex === totalSteps - 1;

  return (
    <Box className="border-t border-border bg-background p-6 space-y-4">
      {/* Instruction Content */}
      <Box>
        <Box className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4 mr-1" />
            Skip
          </Button>
        </Box>
        <Box className="text-sm text-muted-foreground">{description}</Box>
      </Box>

      {/* Navigation Controls */}
      <Box className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        <span className="text-sm text-muted-foreground">
          Step {currentStepIndex + 1} of {totalSteps}
        </span>

        <Button
          size="sm"
          onClick={onNext}
          disabled={!canGoNext}
        >
          {isLastStep ? 'Complete' : 'Next'}
          {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
        </Button>
      </Box>
    </Box>
  );
}
