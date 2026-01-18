/**
 * Editor Panel Title Input
 */

'use client';

import { Box } from '@/components/ui/box';
import { Input } from '@/components/ui/input';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import { useEditorPanelContext } from '../../../core/context';

export function TitleInput() {
  const { title, setTitle, inputRef, handleKeyDown, handleTitleSave } =
    useEditorPanelContext();
  const { readonly } = useCanvasReadOnly();

  return (
    <Box className="p-4">
      <Input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleTitleSave}
        disabled={readonly}
        readOnly={readonly}
        className="h-10 px-0 text-2xl md:text-3xl font-semibold border-none bg-transparent focus-visible:ring-0 shadow-none"
        placeholder="제목 없음"
        maxLength={100}
      />
    </Box>
  );
}
