/**
 * Note Tab Types
 *
 * Contract for NoteTabView - no React Flow/Canvas imports.
 * Apps inject editorContent and callbacks via props.
 */

import type { ReactNode } from 'react';

export interface NoteTabViewProps {
  /** Rendered editor content (TipTap or equivalent). App provides via wrapper. */
  editorContent: ReactNode;
  readonly: boolean;
  onEditorClick?: () => void;
}
