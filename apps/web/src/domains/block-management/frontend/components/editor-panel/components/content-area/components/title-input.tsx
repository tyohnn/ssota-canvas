/**
 * Editor Panel Title Input Container
 */

'use client';

import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import { useEditorPanelContext } from '../../../core/context';
import { TitleInputView } from './title-input.view';

export function TitleInput() {
  const { title, setTitle, inputRef, handleKeyDown, handleTitleSave } =
    useEditorPanelContext();
  const { readonly } = useCanvasReadOnly();

  return (
    <TitleInputView
      value={title}
      onChange={e => setTitle(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleTitleSave}
      readOnly={readonly}
      inputRef={inputRef}
    />
  );
}
