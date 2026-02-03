'use client';

import { useEffect } from 'react';
import { TutorialDialogContext } from './core/context';
import { useTutorialDialog } from './core/use-tutorial-dialog';
import { TutorialDialogView } from './components/tutorial-dialog-view';
import { TutorialNav } from './components/tutorial-nav';
import { TutorialContentArea } from './components/tutorial-content-area';

/**
 * Tutorial Dialog Standalone Props
 */
export interface TutorialDialogStandaloneProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Tutorial Dialog Standalone
 *
 * Standalone tutorial dialog that can be controlled externally
 */

export function TutorialDialogStandalone({
  open,
  onOpenChange,
}: TutorialDialogStandaloneProps) {
  const dialogState = useTutorialDialog();

  // Sync external open state with internal state
  useEffect(() => {
    if (open && !dialogState.isOpen) {
      dialogState.openDialog();
    } else if (!open && dialogState.isOpen) {
      dialogState.closeDialog();
    }
  }, [open, dialogState]);

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
