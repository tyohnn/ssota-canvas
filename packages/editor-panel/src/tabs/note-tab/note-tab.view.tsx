/**
 * Note Tab View
 *
 * Presentational layout for note tab content.
 * Receives editorContent from app wrapper (Canvas or Drive) - no TipTap/React Flow imports.
 */

'use client';

import React from 'react';
import { Box } from '@workspace/ui/components/ui/box';

import type { NoteTabViewProps } from './types';

export function NoteTabView({
  editorContent,
  readonly,
  onEditorClick,
}: NoteTabViewProps) {
  return (
    <Box className="pl-6 pr-4 py-3 min-h-[200px]" data-note-section="true">
      <Box
        onClick={readonly ? undefined : onEditorClick}
        className={
          readonly
            ? 'min-h-[200px] cursor-default'
            : 'min-h-[200px] cursor-text'
        }
      >
        {editorContent}
      </Box>
    </Box>
  );
}
