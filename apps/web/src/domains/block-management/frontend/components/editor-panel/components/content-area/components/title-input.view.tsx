/**
 * Editor Panel Title Input View
 * 
 * Presentational component for Title Input
 */

'use client';

import React from 'react';
import { Box } from '@/components/ui/box';
import { Input } from '@/components/ui/input';

export interface TitleInputViewProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  readOnly: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function TitleInputView({
  value,
  onChange,
  onKeyDown,
  onBlur,
  readOnly,
  inputRef,
}: TitleInputViewProps) {
  return (
    <Box className="p-4">
      <Input
        ref={inputRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        readOnly={readOnly}
        className="h-10 px-0 text-2xl md:text-3xl font-semibold border-none bg-transparent focus-visible:ring-0 shadow-none"
        placeholder="New Block"
        maxLength={100}
      />
    </Box>
  );
}
