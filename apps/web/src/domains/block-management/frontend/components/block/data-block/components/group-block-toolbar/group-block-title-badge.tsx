'use client';

import React, { useState } from 'react';

import { Box } from '@/components/ui/box';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import {
  ColorToken,
  getGroupColorValues,
} from '@/domains/block-management/shared/types/style-tokens.types';
import type { GroupBlockProperties } from '@/domains/block-management/shared/value-objects/block-properties';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import { useBlockHeader } from '../block-header/core/use-block-header';

export interface GroupBlockTitleBadgeProps {
  data: BlockNodeData;
  selected: boolean;
}

/**
 * Group Block Title Badge
 *
 * Color-matched badge displaying the group title (editable).
 * Positioned at top-left inside the group block.
 */
export function GroupBlockTitleBadge({ data, selected }: GroupBlockTitleBadgeProps) {
  const [isFocused, setIsFocused] = useState(false);
  const { readonly } = useCanvasReadOnly();

  const {
    title,
    setTitle,
    inputRef,
    handleKeyDown,
    handleBlur,
    isUpdating,
  } = useBlockHeader({ data, selected });

  const properties = (data?.properties ?? {}) as Partial<GroupBlockProperties>;
  const color = (properties.color as ColorToken) ?? ColorToken.BLUE;
  const colors = getGroupColorValues(color);

  const displayText = title || 'Group';

  return (
    <Box
      className="pointer-events-auto shrink-0 nodrag relative inline-block border-2 rounded-sm py-1.5 px-2.5"
      style={{
        backgroundColor: colors.header,
        borderColor: colors.border,
        boxShadow: isFocused ? `0 0 0 2px ${colors.border}40` : undefined,
      }}
    >
      {/* 숨겨진 span이 부모 너비를 텍스트 길이에 맞게 결정 (input 기본 min-width 회피) */}
      <span
        aria-hidden
        className="text-sm font-semibold whitespace-pre inline-block"
        style={{ visibility: 'hidden' }}
      >
        {displayText}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          handleBlur();
        }}
        disabled={isUpdating}
        readOnly={readonly}
        placeholder="Group"
        className="absolute inset-0 w-full text-sm font-semibold bg-transparent border-0 outline-none focus-visible:ring-0 placeholder:opacity-60 nodrag px-1.5"
        style={{ color: colors.text }}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      />
    </Box>
  );
}
