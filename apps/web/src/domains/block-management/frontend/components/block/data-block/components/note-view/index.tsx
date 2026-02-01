/**
 * Note View Component
 *
 * Container Component: Hook → Props 변환
 *
 * 모든 블록의 content를 마크다운으로 렌더링하는 View
 * 마크다운 블록과 완전히 동일한 편집 기능 제공
 */

'use client';

import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import { NoteViewView } from './components/note-view-view';
import type { NoteViewProps } from './core/types';
import type { UseNoteViewOptions } from './core/types';
import { useNoteView } from './core/use-note-view';

export interface NoteViewComponentProps extends NoteViewProps {
  businessLogic?: UseNoteViewOptions['businessLogic'];
  canvasMetadataOverride?: UseNoteViewOptions['canvasMetadataOverride'];
}

/**
 * Note View Component
 *
 * Hook을 사용하여 데이터를 가져오고 Props로 전달
 */
export function NoteView(props: NoteViewComponentProps) {
  const { businessLogic, canvasMetadataOverride, ...restProps } = props;
  const { readonly } = useCanvasReadOnly();
  const { uiState, business, editor } = useNoteView(restProps, {
    businessLogic,
    canvasMetadataOverride,
  });

  return (
    <NoteViewView
      className={restProps.className}
      selected={restProps.selected || false}
      readonly={readonly}
      uiState={uiState}
      business={business}
      editor={editor}
    />
  );
}

// Export types
export type { NoteViewProps } from './core/types';
