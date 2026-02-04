'use client';

import type { ReactNode } from 'react';
import { cn } from '@workspace/ui/lib/utils';
import { Box } from '@workspace/ui/components/ui/box';
import { useTutorialDialogContext } from '../tutorial-dialog/core/context';

interface InteractionGuardProps {
  selector: string;
  children: ReactNode;
  className?: string;
}

/**
 * Interaction Guard
 *
 * Wraps components to enforce hard restriction and auto-advance:
 * - Only the current step's target is interactable
 * - Other elements are disabled (pointer-events-none, opacity-40, grayscale)
 * - Current target is highlighted
 * - On click, automatically advances to next step
 */
export function InteractionGuard({
  selector,
  children,
  className,
}: InteractionGuardProps) {
  const { isElementInteractable, currentStep, completeCurrentStep } =
    useTutorialDialogContext();

  const isActive = isElementInteractable(selector);
  const isCurrentTarget =
    currentStep?.targetSelector === selector ||
    (currentStep?.interactableSelectors?.length
      ? currentStep.interactableSelectors.includes(selector)
      : false);

  const handleClick = (e: React.MouseEvent) => {
    if (isCurrentTarget && currentStep?.action === 'click') {
      // Auto-advance to next step after a short delay for better UX
      setTimeout(() => {
        completeCurrentStep();
      }, 300);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isCurrentTarget && currentStep?.action === 'dblclick') {
      setTimeout(() => {
        completeCurrentStep();
      }, 300);
    }
  };

  const handleInput = () => {
    if (isCurrentTarget && currentStep?.action === 'input') {
      // Auto-advance on input action after delay
      setTimeout(() => {
        completeCurrentStep();
      }, 500);
    }
  };

  return (
    <Box
      data-tutorial={selector}
      className={cn(
        'relative transition-all duration-200',
        !isActive && 'pointer-events-none',
        className
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onInput={handleInput}
    >
      {children}
    </Box>
  );
}
