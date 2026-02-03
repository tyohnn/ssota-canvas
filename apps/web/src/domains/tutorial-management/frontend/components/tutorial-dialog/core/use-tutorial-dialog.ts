'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  TutorialDialogContextValue,
  TutorialProgress,
} from '@/domains/tutorial-management/shared/types/tutorial.types';
import { useTutorialDialogUI } from './use-tutorial-dialog.ui';
import { useTutorialDialogBusiness } from './use-tutorial-dialog.business';

/**
 * Tutorial Dialog Hook
 *
 * Orchestrates UI state and business logic for the tutorial dialog
 */
export function useTutorialDialog(): TutorialDialogContextValue {
  // UI State
  const ui = useTutorialDialogUI();
  const lastPlacedNodeIdRef = useRef<string | null>(null);

  // Business Logic
  const business = useTutorialDialogBusiness();

  // Load progress on mount
  const progress = useMemo(() => business.loadProgress(), [business]);

  // Current tutorial and step
  const currentTutorial = useMemo(() => {
    if (!ui.selectedTutorialId) return null;
    return business.getTutorialById(ui.selectedTutorialId) || null;
  }, [ui.selectedTutorialId, business]);

  const currentStep = useMemo(() => {
    if (!currentTutorial) return null;
    if (ui.currentStepIndex < 0) return null; // -1 means start overlay
    if (ui.currentStepIndex >= currentTutorial.steps.length) return null;
    return currentTutorial.steps[ui.currentStepIndex] || null;
  }, [currentTutorial, ui.currentStepIndex]);

  // Dialog Control
  const openDialog = useCallback(() => {
    ui.setIsOpen(true);
  }, [ui]);

  const closeDialog = useCallback(() => {
    ui.setIsOpen(false);
    // Reset state when closing
    ui.setSelectedTutorialId(null);
    ui.setCurrentStepIndex(-1);
    ui.setTutorialState({});
    lastPlacedNodeIdRef.current = null;
  }, [ui]);

  // Tutorial Selection
  const selectTutorial = useCallback(
    (tutorialId: string) => {
      const tutorial = business.getTutorialById(tutorialId);
      if (!tutorial) {
        console.warn(`Tutorial not found: ${tutorialId}`);
        return;
      }

      ui.setSelectedTutorialId(tutorialId);
      ui.setCurrentStepIndex(-1); // Start at -1 to show start overlay
      ui.setTutorialState(tutorial.content.initialState);
      lastPlacedNodeIdRef.current = null;

      // Update progress: mark as started
      const existingProgress = progress[tutorialId];
      if (!existingProgress) {
        const newProgress: TutorialProgress = {
          tutorialId,
          completedSteps: [],
          isCompleted: false,
          lastAccessedAt: new Date().toISOString(),
        };
        business.saveProgress(tutorialId, newProgress);
      } else {
        // Update last accessed time
        business.saveProgress(tutorialId, {
          ...existingProgress,
          lastAccessedAt: new Date().toISOString(),
        });
      }
    },
    [ui, business, progress]
  );

  // Step Control
  const nextStep = useCallback(() => {
    if (!currentTutorial) return;

    const nextIndex = ui.currentStepIndex + 1;
    if (nextIndex >= currentTutorial.steps.length) {
      // Tutorial completed: save progress, fire confetti, then advance or close
      const completedProgress: TutorialProgress = {
        tutorialId: currentTutorial.id,
        completedSteps: currentTutorial.steps.map((s) => s.id),
        isCompleted: true,
        lastAccessedAt: new Date().toISOString(),
      };
      business.saveProgress(currentTutorial.id, completedProgress);

      // Confetti on completion
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      });

      const groups = business.getTutorialGroups();
      const orderedTutorials = groups.flatMap((g) => g.tutorials);
      const currentIdx = orderedTutorials.findIndex((t) => t.id === currentTutorial.id);
      const nextTutorial = orderedTutorials[currentIdx + 1];
      if (nextTutorial) {
        if (nextTutorial.status === 'coming-soon') {
          closeDialog();
        } else {
          selectTutorial(nextTutorial.id);
        }
      } else {
        closeDialog();
      }
    } else {
      ui.setCurrentStepIndex(nextIndex);
    }
  }, [currentTutorial, ui, business, selectTutorial, closeDialog]);

  const previousStep = useCallback(() => {
    if (ui.currentStepIndex > -1) {
      ui.setCurrentStepIndex(ui.currentStepIndex - 1);
    }
  }, [ui]);

  // Start Tutorial (from -1 to 0)
  const startTutorial = useCallback(() => {
    ui.setCurrentStepIndex(0);
  }, [ui]);

  const goToStep = useCallback(
    (index: number) => {
      if (!currentTutorial) return;
      if (index < 0 || index >= currentTutorial.steps.length) return;
      ui.setCurrentStepIndex(index);
    },
    [currentTutorial, ui]
  );

  const completeCurrentStep = useCallback(
    (options?: { fromNextButton?: boolean }) => {
      if (!currentTutorial || !currentStep) return;

      // Execute onComplete callback if provided
      if (currentStep.onComplete) {
        const newState = currentStep.onComplete(ui.tutorialState);
        ui.setTutorialState(newState);
      }

      // Save progress
      const existingProgress = progress[currentTutorial.id] || {
        tutorialId: currentTutorial.id,
        completedSteps: [],
        isCompleted: false,
        lastAccessedAt: new Date().toISOString(),
      };

      const updatedProgress: TutorialProgress = {
        ...existingProgress,
        completedSteps: Array.from(
          new Set([...existingProgress.completedSteps, currentStep.id])
        ),
        lastAccessedAt: new Date().toISOString(),
      };

      business.saveProgress(currentTutorial.id, updatedProgress);

      const isLastStep =
        ui.currentStepIndex === currentTutorial.steps.length - 1;
      if (isLastStep && !options?.fromNextButton) {
        return;
      }
      nextStep();
    },
    [currentTutorial, currentStep, ui, business, progress, nextStep]
  );

  // State Update
  const updateTutorialState = useCallback(
    (updates: Partial<typeof ui.tutorialState>) => {
      if (updates.lastPlacedNodeId !== undefined) {
        lastPlacedNodeIdRef.current = updates.lastPlacedNodeId as string | null;
      }
      ui.setTutorialState((prev) => ({ ...prev, ...updates }));
    },
    [ui]
  );

  // Interaction Control (Hard Restriction)
  const isElementInteractable = useCallback(
    (selector: string): boolean => {
      if (selector === 'add-block-button') return true;
      if (!currentStep) return false;
      const hasInteractableSelectors = currentStep.interactableSelectors?.length;
      return hasInteractableSelectors
        ? (currentStep.interactableSelectors?.includes(selector) ?? false)
        : currentStep.targetSelector === selector;
    },
    [currentStep]
  );

  return {
    // UI State
    isOpen: ui.isOpen,
    selectedTutorialId: ui.selectedTutorialId,
    currentStepIndex: ui.currentStepIndex,
    tutorialState: ui.tutorialState,

    // Current Tutorial/Step Info
    currentTutorial,
    currentStep,

    // Dialog Control
    openDialog,
    closeDialog,

    // Tutorial Selection
    selectTutorial,

    // Step Control
    startTutorial,
    nextStep,
    previousStep,
    goToStep,
    completeCurrentStep,

    // State Update
    updateTutorialState,

    lastPlacedNodeIdRef,

    // Interaction Control
    isElementInteractable,

    // Progress
    progress,
  };
}
