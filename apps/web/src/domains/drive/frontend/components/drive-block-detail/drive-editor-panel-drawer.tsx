'use client';

import { Box } from '@workspace/ui/components/ui/box';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer';

import type { DriveBlockData } from '@/domains/drive/frontend/hooks/use-drive-block';
import { DriveEditorPanel } from './drive-editor-panel';

export interface DriveEditorPanelDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockData: DriveBlockData;
  orgId: string;
  /** Called when user taps close in the panel (closes drawer). */
  onClose: () => void;
}

/**
 * Mobile editor panel wrapper: shows DriveEditorPanel inside a bottom drawer (80% height).
 * Expand/collapse is hidden; close button closes the drawer.
 */
export function DriveEditorPanelDrawer({
  open,
  onOpenChange,
  blockData,
  orgId,
  onClose,
}: DriveEditorPanelDrawerProps) {
  const handlePanelClose = () => {
    onOpenChange(false);
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
      <DrawerContent className="h-[92vh] min-h-[92vh] max-h-[92vh] flex flex-col">
        <DrawerHeader className="sr-only">
          <DrawerTitle>Block details</DrawerTitle>
          <DrawerDescription>View and edit block properties.</DrawerDescription>
        </DrawerHeader>
        <Box className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <DriveEditorPanel
            blockData={blockData}
            orgId={orgId}
            onClose={handlePanelClose}
            isExpanded={false}
            onToggleExpand={() => {}}
            hideExpand
          />
        </Box>
      </DrawerContent>
    </Drawer>
  );
}
