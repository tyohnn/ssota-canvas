import { ReactNode } from 'react';
import type { Node, Edge } from '@xyflow/react';

/**
 * Tutorial Category
 */
export type TutorialCategory =
  | 'getting-started'
  | 'blocks'
  | 'block-advance'
  | 'edges'
  | 'ai'
  | 'editor-panel'
  | 'database'
  | 'sub-agents';

/**
 * Tutorial Status
 */
export type TutorialStatus = 'available' | 'coming-soon' | 'locked';

/**
 * Tutorial Step Action Type
 */
export type TutorialStepAction = 'click' | 'input' | 'drag' | 'observe' | 'dblclick';

/**
 * Tutorial State (for Mock Components)
 */
export interface TutorialState {
  [key: string]: unknown;
}

/**
 * Tutorial Step Definition
 */
export interface TutorialStep {
  id: string;
  title: string;
  description: ReactNode;

  // Interaction Control
  /** When set, overlay highlights this element and anchors the card to it. When undefined, no highlight and card at bottom-center (default mode). */
  targetSelector?: string; // data-tutorial="xxx" selector
  /** When set, only these selectors are interactable. When undefined, only targetSelector (if set) is interactable. */
  interactableSelectors?: string[];
  action: TutorialStepAction;
  validateComplete?: () => boolean; // Optional step completion validation

  // State Change on Completion
  onComplete?: (state: TutorialState) => TutorialState;
}

/**
 * Tutorial Content Props (Props that Mock Components receive)
 */
export interface TutorialContentProps {
  state: TutorialState;
  currentStepIndex: number;
  onStepComplete: () => void;
  isElementInteractable: (selector: string) => boolean;
}

/**
 * Tutorial Content Configuration
 */
export interface TutorialContentConfig {
  initialState: TutorialState;
  ContentComponent: React.ComponentType<TutorialContentProps>;
  // Optional initial nodes/edges for MockCanvas
  initialNodes?: Node[];
  initialEdges?: Edge[];
}

/**
 * Tutorial Definition
 */
export interface Tutorial {
  id: string;
  name: string;
  description: string;
  category: TutorialCategory;
  status: TutorialStatus;
  estimatedMinutes?: number;
  prerequisites?: string[];
  steps: TutorialStep[];
  content: TutorialContentConfig;
}

/**
 * Tutorial Group (for Table of Contents)
 */
export interface TutorialGroup {
  id: string;
  name: string;
  category: TutorialCategory;
  tutorials: Tutorial[];
}

/**
 * Tutorial Progress
 */
export interface TutorialProgress {
  tutorialId: string;
  completedSteps: string[]; // array of step ids
  isCompleted: boolean;
  lastAccessedAt: string;
}

/**
 * Tutorial Dialog UI State
 */
export interface TutorialDialogUIState {
  isOpen: boolean;
  selectedTutorialId: string | null;
  currentStepIndex: number;
  tutorialState: TutorialState;
}

/**
 * Tutorial Dialog Context Value
 */
export interface TutorialDialogContextValue {
  // UI State
  isOpen: boolean;
  selectedTutorialId: string | null;
  currentStepIndex: number;
  tutorialState: TutorialState;

  // Current Tutorial/Step Info
  currentTutorial: Tutorial | null;
  currentStep: TutorialStep | null;

  // Dialog Control
  openDialog: () => void;
  closeDialog: () => void;

  // Tutorial Selection
  selectTutorial: (tutorialId: string) => void;

  // Step Control
  startTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (index: number) => void;
  completeCurrentStep: (options?: { fromNextButton?: boolean }) => void;

  // State Update
  updateTutorialState: (updates: Partial<TutorialState>) => void;

  // Interaction Control (Hard Restriction)
  isElementInteractable: (selector: string) => boolean;

  // Progress
  progress: Record<string, TutorialProgress>;
}
