import React from 'react';

import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';

/**
 * Edge Label View Props
 *
 * Flat props structure for better clarity and simplicity
 */
export type EdgeLabelViewProps = {
  // State
  label: string;
  isEditing: boolean;
  draftLabel: string;

  // Position
  x: number;
  y: number;

  // Handlers
  onClick?: (e: React.MouseEvent) => void;
  onBlur: () => void;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;

  // Visual
  isSelected: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  readonly?: boolean;
};

/**
 * Edge Label View Component
 *
 * Presentational component: Renders edge label in read or edit mode
 * - Props only, no hooks or context
 * - Storybook testable
 */
export function EdgeLabelView({
  label,
  isEditing,
  draftLabel,
  x,
  y,
  onClick,
  onBlur,
  onChange,
  onKeyDown,
  isSelected,
  inputRef,
  readonly = false,
}: EdgeLabelViewProps): React.JSX.Element {
  // Show label if it exists, is selected, or is being edited
  const shouldShow = label || isSelected || isEditing;

  if (!shouldShow) {
    return <></>;
  }

  return (
    <Box
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
        pointerEvents: 'all',
        zIndex: 10,
      }}
      className="nodrag nopan"
    >
      <Box
        className={cn(
          'px-3 py-2 flex items-center justify-center rounded-md transition-all min-w-[70px]',
          isSelected || isEditing
            ? 'bg-background/90 backdrop-blur-sm border border-border shadow-sm'
            : label
              ? 'bg-background/70 backdrop-blur-sm'
              : 'bg-transparent'
        )}
        onClick={readonly ? undefined : onClick}
        style={{ pointerEvents: 'all' }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={draftLabel}
            onChange={e => onChange(e.target.value)}
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            readOnly={readonly}
            placeholder="Add Label"
            className={cn(
              'text-xs text-center',
              'bg-transparent border-none outline-none',
              'text-muted-foreground',
              'placeholder:text-muted-foreground/60 placeholder:italic',
              'transition-colors',
              readonly && 'cursor-default'
            )}
            autoFocus={!readonly}
            style={{
              pointerEvents: 'all',
              width: draftLabel
                ? `${Math.max(draftLabel.length * 7, 70)}px`
                : '70px',
            }}
          />
        ) : (
          <p
            className={cn(
              'text-xs text-center text-muted-foreground italic transition-colors whitespace-nowrap',
              readonly ? 'cursor-default' : 'cursor-text'
            )}
            style={{ pointerEvents: 'all' }}
          >
            {label || 'Add Label'}
          </p>
        )}
      </Box>
    </Box>
  );
}
