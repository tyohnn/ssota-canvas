'use client';

import { useMemo, useRef, useEffect } from 'react';
import { Box } from '@workspace/ui/components/ui/box';
import { BlockContentChangeContext } from '@/domains/block-management/frontend/contexts/block-content-change-context';
import { useTutorialDialogContext } from '../core/context';

/**
 * Tutorial Content Area (Presentational)
 *
 * Single large tutorial panel: interactive content only.
 */
export function TutorialContentArea() {
  const {
    currentTutorial,
    currentStep,
    currentStepIndex,
    tutorialState,
    completeCurrentStep,
    isElementInteractable,
  } = useTutorialDialogContext();

  const totalSteps = currentTutorial?.steps.length ?? 0;
  const isLastStep = totalSteps > 0 && currentStepIndex === totalSteps - 1;

  const didCompleteFromContentChangeRef = useRef(false);
  const contentChangeCallCountRef = useRef(0);
  useEffect(() => {
    didCompleteFromContentChangeRef.current = false;
    contentChangeCallCountRef.current = 0;
  }, [currentStepIndex]);

  const blockContentChangeValue = useMemo(
    () => ({
      onContentChange: isLastStep
        ? undefined
        : () => {
          if (didCompleteFromContentChangeRef.current) return;
          contentChangeCallCountRef.current += 1;
          if (contentChangeCallCountRef.current < 2) return;
          didCompleteFromContentChangeRef.current = true;
          completeCurrentStep();
        },
    }),
    [isLastStep, currentStepIndex, completeCurrentStep, currentStep?.id]
  );

  if (!currentTutorial) {
    return (
      <Box className="h-full flex items-center justify-center text-center p-8">
        <Box>
          <h3 className="text-lg font-semibold mb-2">
            Select a Tutorial to Start
          </h3>
          <p className="text-sm text-muted-foreground">
            Choose a tutorial from the left sidebar to begin your learning
            journey.
          </p>
        </Box>
      </Box>
    );
  }

  const ContentComponent = currentTutorial.content.ContentComponent;

  return (
    <BlockContentChangeContext.Provider value={blockContentChangeValue}>
      <Box className="h-full w-full overflow-hidden">
        <ContentComponent
          state={tutorialState}
          currentStepIndex={currentStepIndex}
          onStepComplete={completeCurrentStep}
          isElementInteractable={isElementInteractable}
        />
      </Box>
    </BlockContentChangeContext.Provider>
  );
}
