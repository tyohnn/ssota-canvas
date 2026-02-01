/**
 * Editor Panel Title Input Container
 */

'use client';

import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import { useEditorPanelContext } from '../../../core/context';
import { TitleInputView } from './title-input.view';

export function TitleInput() {
  const { title, setTitle, inputRef, handleKeyDown, handleTitleSave, blockData } =
    useEditorPanelContext();
  const { readonly } = useCanvasReadOnly();

  // note view일 때는 title 변경 불가
  const isNoteView = blockData?.viewMode === 'note';
  const isReadOnly = readonly || isNoteView;

  return (
    <TitleInputView
      value={title}
      onChange={e => setTitle(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleTitleSave}
      readOnly={isReadOnly}
      inputRef={inputRef}
    />
  );
}
