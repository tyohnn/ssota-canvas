/**
 * Note View Title View Component
 *
 * Presentational component: 문서 h1 느낌의 제목 입력
 * - Editor panel TitleInputView와 동일한 스타일 (text-2xl/3xl font-semibold)
 */

'use client';

import React from 'react';

import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';
import { Input } from '@/components/ui/input';

export interface NoteViewTitleViewProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  readOnly: boolean;
  /** false일 때 포커스·텍스트 선택 불가 (클릭은 부모로 전달되어 블록 선택 가능) */
  interactive?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function NoteViewTitleView({
  value,
  onChange,
  onKeyDown,
  onBlur,
  readOnly,
  interactive = true,
  inputRef,
}: NoteViewTitleViewProps) {
  return (
    <Box className="py-2">
      <Input
        ref={inputRef}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onBlur={onBlur}
        readOnly={readOnly}
        tabIndex={interactive ? 0 : -1}
        className={cn(
          'nodrag h-10 px-0 text-2xl md:text-3xl font-semibold border-none bg-transparent dark:bg-transparent focus-visible:ring-0 shadow-none',
          !interactive && 'pointer-events-none select-none'
        )}
        placeholder="New Block"
        maxLength={100}
      />
    </Box>
  );
}
