import type {
  Tutorial,
  TutorialGroup,
  TutorialProgress,
  TutorialState,
  TutorialStep,
} from '@/domains/tutorial-management/shared/types/tutorial.types';

/**
 * Tutorial Dialog UI State
 */
export interface TutorialDialogUIState {
  isOpen: boolean;
  selectedTutorialId: string | null;
  currentStepIndex: number;
  tutorialState: TutorialState;
  setIsOpen: (isOpen: boolean) => void;
  setSelectedTutorialId: (id: string | null) => void;
  setCurrentStepIndex: (index: number) => void;
  setTutorialState: (state: TutorialState | ((prev: TutorialState) => TutorialState)) => void;
}

/**
 * Tutorial Dialog Business Logic
 */
export interface TutorialDialogBusinessLogic {
  loadProgress: () => Record<string, TutorialProgress>;
  saveProgress: (tutorialId: string, progress: TutorialProgress) => void;
  getTutorialById: (id: string) => Tutorial | undefined;
  getAllTutorials: () => Tutorial[];
  getTutorialGroups: () => TutorialGroup[];
}
