'use client';

import type { ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';
import { Box } from '@workspace/ui/components/ui/box';

interface TutorialDialogViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nav: ReactNode;
  content: ReactNode;
}

/**
 * Tutorial Dialog View (Presentational)
 *
 * Main layout for the tutorial dialog
 */
export function TutorialDialogView({
  open,
  onOpenChange,
  nav,
  content,
}: TutorialDialogViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-7xl! h-[90vh] p-0 gap-0 overflow-hidden rounded-md"
        overlayClassName="backdrop-blur-sm"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Tutorials</DialogTitle>
        <Box className="flex h-full min-h-0">
          {/* Left Navigation */}
          <Box className="w-64 border-r border-border bg-muted/30 overflow-y-auto">
            {nav}
          </Box>

          {/* Right Content - Full ReactFlow */}
          <Box className="flex-1 overflow-hidden">{content}</Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
