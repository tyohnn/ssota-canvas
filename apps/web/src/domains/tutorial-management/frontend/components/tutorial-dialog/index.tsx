'use client';

import { useEffect, useRef } from 'react';
import { TutorialDialogContext } from './core/context';
import { useTutorialDialog } from './core/use-tutorial-dialog';
import { TutorialDialogView } from './components/tutorial-dialog-view';
import { TutorialNav } from './components/tutorial-nav';
import { TutorialContentArea } from './components/tutorial-content-area';

const GETTING_STARTED_TUTORIAL_ID = 'getting-started';

/**
 * Tutorial Dialog Standalone Props
 */
export interface TutorialDialogStandaloneProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, open with this tutorial selected (e.g. welcome flow). */
  initialTutorialId?: string;
}

/**
 * Tutorial Dialog Standalone
 *
 * Standalone tutorial dialog that can be controlled externally
 */

export function TutorialDialogStandalone({
  open,
  onOpenChange,
  initialTutorialId,
}: TutorialDialogStandaloneProps) {
  const dialogState = useTutorialDialog();

  // Sync external open state with internal state + initial selection
  useEffect(() => {
    if (open && !dialogState.isOpen) {
      dialogState.openDialog();
      if (initialTutorialId) {
        dialogState.selectTutorial(initialTutorialId);
      } else {
        // Always select a default when reopening from navbar (even with non-empty progress)
        dialogState.selectTutorial(GETTING_STARTED_TUTORIAL_ID);
      }
    } else if (!open && dialogState.isOpen) {
      dialogState.closeDialog();
    }
  }, [open, initialTutorialId]);

  // Sync parent when internal dialog closes programmatically (e.g. on tutorial complete).
  // Radix Dialog does not call onOpenChange when close is driven by controlled prop change,
  // so we must notify the parent to keep isTutorialOpen in sync.
  // Only sync on transition open→closed (not when reopening: openDialog just called, isOpen still false).
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  const prevIsOpenRef = useRef(dialogState.isOpen);
  useEffect(() => {
    const prevIsOpen = prevIsOpenRef.current;
    const currIsOpen = dialogState.isOpen;
    const transitionedToClosed = prevIsOpen && !currIsOpen;
    const willSyncClose = transitionedToClosed && open;
    prevIsOpenRef.current = currIsOpen;
    if (willSyncClose) {
      onOpenChangeRef.current(false);
    }
  }, [dialogState.isOpen, open]);

  // Sync internal state with external callback
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      dialogState.openDialog();
    } else {
      dialogState.closeDialog();
    }
    onOpenChange(isOpen);
  };

  return (
    <TutorialDialogContext.Provider value={dialogState}>
      <TutorialDialogView
        open={dialogState.isOpen}
        onOpenChange={handleOpenChange}
        nav={<TutorialNav />}
        content={<TutorialContentArea />}
      />
    </TutorialDialogContext.Provider>
  );
}

/**
 * Tutorial Dialog (Container)
 *
 * Main tutorial dialog component that provides context and orchestrates the UI
 */
export function TutorialDialog() {
  const dialogState = useTutorialDialog();

  return (
    <TutorialDialogContext.Provider value={dialogState}>
      <TutorialDialogView
        open={dialogState.isOpen}
        onOpenChange={(open) =>
          open ? dialogState.openDialog() : dialogState.closeDialog()
        }
        nav={<TutorialNav />}
        content={<TutorialContentArea />}
      />
    </TutorialDialogContext.Provider>
  );
}

/**
 * Tutorial Dialog Context Hook
 *
 * Use this hook to control the tutorial dialog from anywhere within the provider
 */
export { useTutorialDialogContext as useTutorialDialog } from './core/context';
