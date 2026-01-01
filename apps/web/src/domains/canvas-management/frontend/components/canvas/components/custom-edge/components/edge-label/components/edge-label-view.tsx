import React from 'react';

import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';

import type { EdgeLabelViewProps } from './edge-label-view.type';

/**
 * Edge Label View Component
 *
 * Presentational component: Renders edge label in read or edit mode
 * - Props only, no hooks or context
 * - Storybook testable
 *
 * Pattern: View (Semantic Grouping)
 * - Props are grouped by semantic meaning (see edge-label-view.type.ts)
 * - Improves readability and maintainability
 * - Easier to refactor and test
 */
export function EdgeLabelView({
  state,
  position,
  handlers,
  visual,
}: EdgeLabelViewProps): React.JSX.Element {
  const { label, isEditing, draftLabel } = state;
  const { isSelected, inputRef } = visual;
  // Show label if it exists, is selected, or is being edited
  const shouldShow = label || isSelected || isEditing;

  if (!shouldShow) {
    return <></>;
  }

  return (
    <Box
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px)`,
        pointerEvents: 'all',
      }}
      className="nodrag nopan"
    >
      <Box
        className={cn(
          'px-3 py-2 flex items-center justify-center rounded-md transition-all',
          isSelected || isEditing
            ? 'bg-background/90 backdrop-blur-sm border border-border shadow-sm'
            : label
              ? 'bg-background/70 backdrop-blur-sm'
              : 'bg-transparent'
        )}
        onClick={handlers.onClick}
        style={{ pointerEvents: 'all' }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={draftLabel}
            onChange={e => handlers.onChange(e.target.value)}
            onBlur={handlers.onBlur}
            onKeyDown={handlers.onKeyDown}
            placeholder="Add Label"
            className={cn(
              'text-xs text-center',
              'bg-transparent border-none outline-none',
              'text-muted-foreground',
              'placeholder:text-muted-foreground/60 placeholder:italic',
              'transition-colors'
            )}
            autoFocus
            style={{
              pointerEvents: 'all',
              width: draftLabel
                ? `${Math.max(draftLabel.length * 7, 70)}px`
                : '70px',
            }}
          />
        ) : (
          <p
            className="text-xs text-center cursor-text text-muted-foreground italic transition-colors whitespace-nowrap"
            style={{ pointerEvents: 'all' }}
          >
            {label || 'Add Label'}
          </p>
        )}
      </Box>
    </Box>
  );
}
