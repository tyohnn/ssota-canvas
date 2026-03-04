/**
 * Editor Panel Title Input View
 *
 * Owns input value state. Receives initialTitle (e.g. from blockData) and
 * onTitleSave; on blur/Enter commits, on Escape reverts to initialTitle.
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@workspace/ui/components/ui/box';
import { Input } from '@workspace/ui/components/ui/input';

export interface TitleInputViewProps {
  /** Initial value (e.g. block title); synced when it changes. */
  initialTitle: string;
  /** Called when user commits (blur or Enter). */
  onTitleSave: (title: string) => void | Promise<void>;
  readOnly: boolean;
}

export function TitleInputView({
  initialTitle,
  onTitleSave,
  readOnly,
}: TitleInputViewProps) {
  const [value, setValue] = useState(initialTitle);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setValue(initialTitle);
  }, [initialTitle]);

  const handleBlur = () => {
    onTitleSave(value.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onTitleSave(value.trim());
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setValue(initialTitle);
      inputRef.current?.blur();
    }
  };

  return (
    <Box className="p-4">
      <Input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        readOnly={readOnly}
        className="h-10 px-0 text-2xl md:text-3xl font-semibold border-none bg-transparent dark:bg-transparent focus-visible:ring-0 shadow-none"
        placeholder="New Block"
        maxLength={100}
      />
    </Box>
  );
}
