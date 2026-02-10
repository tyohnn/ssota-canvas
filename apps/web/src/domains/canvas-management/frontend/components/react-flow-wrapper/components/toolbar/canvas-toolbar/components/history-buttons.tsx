'use client';

import React from 'react';
import { Undo2, Redo2 } from 'lucide-react';
import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';

interface HistoryButtonsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndoClick: () => void;
  onRedoClick: () => void;
}

export function HistoryButtons({
  canUndo,
  canRedo,
  onUndoClick,
  onRedoClick,
}: HistoryButtonsProps) {
  return (
    <>
      <ToolbarIconButton
        icon={<Undo2 className="h-4 w-4" />}
        tooltip="Undo (Cmd+Z)"
        tooltipSide="top"
        tooltipOffset={5}
        onClick={onUndoClick}
        disabled={!canUndo}
        className="h-8 w-8 p-0 rounded-sm"
        aria-label="Undo"
      />
      <ToolbarIconButton
        icon={<Redo2 className="h-4 w-4" />}
        tooltip="Redo (Cmd+Shift+Z)"
        tooltipSide="top"
        tooltipOffset={5}
        onClick={onRedoClick}
        disabled={!canRedo}
        className="h-8 w-8 p-0 rounded-sm"
        aria-label="Redo"
      />
    </>
  );
}
