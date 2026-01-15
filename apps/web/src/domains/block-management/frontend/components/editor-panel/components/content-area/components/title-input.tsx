/**
 * Editor Panel Title Input
 */

'use client';

import { Box } from '@/components/ui/box';
import { Input } from '@/components/ui/input';

import { useEditorPanelContext } from '../../../core/context';

export function TitleInput() {
  const { title, setTitle, inputRef, handleKeyDown, handleTitleSave } =
    useEditorPanelContext();

  return (
    <Box className="p-4">
      <Input
        ref={inputRef}
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleTitleSave}
        className="h-10 px-0 text-2xl md:text-3xl font-semibold border-none bg-transparent focus-visible:ring-0 shadow-none"
        placeholder="제목 없음"
        maxLength={100}
      />
    </Box>
  );
}
