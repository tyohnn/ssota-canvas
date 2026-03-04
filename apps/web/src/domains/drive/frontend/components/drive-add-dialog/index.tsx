'use client';

import { Box } from '@/components/ui/box';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';
import { useIsMobile } from '@workspace/ui/hooks/use-mobile';
import { useDriveAddDialog } from './core/use-drive-add-dialog';
import { FormContent } from './components/form-content';
import { DriveAddDialogTabs } from './components/drive-add-dialog-tabs';
import type { DriveAddDialogProps } from './core/types';

const dialogContent = (
  state: ReturnType<typeof useDriveAddDialog>,
  orgId: string,
  isMobile: boolean,
) => (
  <>
    <Box
      className={
        isMobile
          ? 'flex w-full min-w-0 flex-1 min-h-0 flex-col'
          : 'flex flex-1 min-h-0'
      }
    >
      <Box
        className={
          isMobile
            ? 'w-full shrink-0 border-b border-border bg-muted/50 p-3'
            : 'w-44 shrink-0 border-r border-border bg-muted/50 p-4'
        }
      >
        <DriveAddDialogTabs
          tabs={state.tabs}
          activeTab={state.activeTab}
          onTabClick={state.setActiveTab}
          variant={isMobile ? 'horizontal' : 'vertical'}
        />
      </Box>
      <Box
        className={
          isMobile
            ? 'flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-x-hidden overflow-y-auto'
            : 'flex min-h-0 flex-1 flex-col overflow-y-auto'
        }
      >
        <FormContent
          activeTab={state.activeTab}
          orgId={orgId}
          workspaces={state.workspaces}
          isLoadingWorkspaces={state.isLoadingWorkspaces}
          onClose={state.handleClose}
        />
      </Box>
    </Box>
  </>
);

/**
 * Drive add block dialog.
 * Desktop: centered dialog. Mobile: bottom sheet.
 * Left/top: block type tabs. Right/bottom: type-specific section (each tab manages its own form and business logic).
 */
export function DriveAddDialog({ orgId, open, onOpenChange }: DriveAddDialogProps) {
  const state = useDriveAddDialog({ orgId, open, onOpenChange });
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
        <DrawerContent className="w-full min-h-[80vh] flex flex-col">
          <DrawerHeader className="sr-only">
            <DrawerTitle>Add block to Drive</DrawerTitle>
            <DrawerDescription>
              Create a new block and add it to Drive.
            </DrawerDescription>
          </DrawerHeader>
          <Box className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
            {dialogContent(state, orgId, true)}
          </Box>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[560px] p-0 rounded-md overflow-hidden flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Add block to Drive</DialogTitle>
          <DialogDescription>
            Create a new block and add it to Drive.
          </DialogDescription>
        </DialogHeader>
        <Box className="flex flex-1 min-h-0">
          {dialogContent(state, orgId, false)}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
