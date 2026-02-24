'use client';

import React, { useState } from 'react';

import {
  Bold,
  Italic,
  Code,
  Strikethrough,
  Highlighter,
  Type,
} from 'lucide-react';
import type { Editor } from '@tiptap/react';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';
import {
  ColorToken,
  getColorLabel,
  TAILWIND_COLOR_PALETTE,
} from '@/domains/block-management/shared/types/style-tokens.types';
import { cn } from '@/lib/utils';

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0,0,0,${alpha})`;
  return `rgba(${parseInt(result[1]!, 16)}, ${parseInt(result[2]!, 16)}, ${parseInt(result[3]!, 16)}, ${alpha})`;
}

// Background colors: group block style, darker (0.6 alpha) for better visibility
const BUBBLE_BG_COLORS: Record<ColorToken, string> = Object.fromEntries(
  (Object.values(ColorToken) as ColorToken[]).map(t => [
    t,
    hexToRgba(TAILWIND_COLOR_PALETTE[t][100], 0.6),
  ])
) as Record<ColorToken, string>;

// Text colors: 800 tone for readable text (Tailwind palette)
const TEXT_COLORS: Record<ColorToken, string> = {
  [ColorToken.GRAY]: TAILWIND_COLOR_PALETTE[ColorToken.GRAY][800],
  [ColorToken.RED]: TAILWIND_COLOR_PALETTE[ColorToken.RED][800],
  [ColorToken.ORANGE]: TAILWIND_COLOR_PALETTE[ColorToken.ORANGE][800],
  [ColorToken.AMBER]: TAILWIND_COLOR_PALETTE[ColorToken.AMBER][800],
  [ColorToken.GREEN]: TAILWIND_COLOR_PALETTE[ColorToken.GREEN][800],
  [ColorToken.BLUE]: TAILWIND_COLOR_PALETTE[ColorToken.BLUE][800],
  [ColorToken.PURPLE]: TAILWIND_COLOR_PALETTE[ColorToken.PURPLE][800],
  [ColorToken.PINK]: TAILWIND_COLOR_PALETTE[ColorToken.PINK][800],
};

/** Border classes matching ColorToolbarItem (group block mount toolbar) */
const COLOR_BORDER_CLASSES: Record<ColorToken, string> = {
  [ColorToken.RED]: 'border-red-500/50 dark:border-red-500/50',
  [ColorToken.ORANGE]: 'border-orange-500/50 dark:border-orange-500/50',
  [ColorToken.AMBER]: 'border-amber-500/50 dark:border-amber-500/50',
  [ColorToken.GREEN]: 'border-green-500/50 dark:border-green-500/50',
  [ColorToken.BLUE]: 'border-blue-500/50 dark:border-blue-500/50',
  [ColorToken.PURPLE]: 'border-purple-500/50 dark:border-purple-500/50',
  [ColorToken.PINK]: 'border-pink-500/50 dark:border-pink-500/50',
  [ColorToken.GRAY]: 'border-gray-500/50 dark:border-gray-500/50',
};

// Color token order: GRAY first, then others
const COLOR_TOKEN_ORDER: ColorToken[] = [
  ColorToken.GRAY,
  ColorToken.RED,
  ColorToken.ORANGE,
  ColorToken.AMBER,
  ColorToken.GREEN,
  ColorToken.BLUE,
  ColorToken.PURPLE,
  ColorToken.PINK,
];

export interface BubbleMenuBarProps {
  editor: Editor;
}

function ToggleButton({
  onClick,
  isActive,
  'aria-label': ariaLabel,
  tooltip,
  children,
}: {
  onClick: () => void;
  isActive: boolean;
  'aria-label': string;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <ToolbarIconButton
      icon={children}
      tooltip={tooltip}
      tooltipSide="top"
      iconClassName="size-4"
      className="h-7 w-7 p-0"
      isActive={isActive}
      onClick={onClick}
      onMouseDown={e => e.preventDefault()}
    />
  );
}

function ColorPopover({
  editor,
  type,
  displayColors,
  applyColors,
  triggerIcon: TriggerIcon,
  triggerLabel,
}: {
  editor: Editor;
  type: 'background' | 'text';
  displayColors: Record<ColorToken, string>;
  applyColors: Record<ColorToken, string>;
  triggerIcon: React.ElementType;
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const TriggerIconComponent = TriggerIcon;

  const setColor = (color: string) => {
    if (type === 'background') {
      editor.chain().focus().setBackgroundColor(color).run();
    } else {
      editor.chain().focus().setColor(color).run();
    }
    setOpen(false);
  };

  const clearColor = () => {
    if (type === 'background') {
      editor.chain().focus().unsetBackgroundColor().run();
    } else {
      editor.chain().focus().unsetColor().run();
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarIconButton
          icon={<TriggerIconComponent className="size-4 shrink-0" />}
          tooltip={triggerLabel}
          tooltipDisabled={open}
          iconClassName="size-4"
          className="h-7 w-7 p-0"
          isActive={open}
          tooltipSide="top"
          onMouseDown={e => e.preventDefault()}
        />
      </PopoverTrigger>
      <PopoverContent
        className="p-1.5 w-fit will-change-transform rounded-2xl"
        side="top"
        align="center"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        onOpenAutoFocus={e => e.preventDefault()}
        style={{
          transform: 'scale(0.5)',
          transformOrigin: 'var(--radix-popover-content-transform-origin)',
        }}
      >
        <div className="flex gap-0.5">
          {COLOR_TOKEN_ORDER.map(token => (
            <ToolbarIconButton
              key={token}
              icon={
                <div
                  className={cn('size-8 rounded border-2', COLOR_BORDER_CLASSES[token])}
                  style={{ backgroundColor: displayColors[token] }}
                />
              }
              tooltip={getColorLabel(token)}
              tooltipSide="top"
              iconClassName="size-8"
              className="rounded-xl size-14 transition-colors will-change-transform px-0"
              onClick={() => setColor(applyColors[token])}
              onMouseDown={e => e.preventDefault()}
            />
          ))}
          <button
            type="button"
            onClick={clearColor}
            onMouseDown={e => e.preventDefault()}
            title="Clear"
            className={cn(
              'flex size-14 items-center justify-center rounded-xl',
              'border-2 border-dashed border-border/50',
              'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              'transition-colors will-change-transform'
            )}
          >
            <span className="text-xs">✕</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function BubbleMenuBar({ editor }: BubbleMenuBarProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-0.5',
        'rounded-md border border-border bg-background/90 backdrop-blur-md shadow-lg',
        'px-1.5 py-1'
      )}
    >
      <ToggleButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        aria-label="Bold"
        tooltip="Bold"
      >
        <Bold className="size-4" />
      </ToggleButton>
      <ToggleButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        aria-label="Italic"
        tooltip="Italic"
      >
        <Italic className="size-4" />
      </ToggleButton>
      <ToggleButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        aria-label="Code"
        tooltip="Code"
      >
        <Code className="size-4" />
      </ToggleButton>
      <ToggleButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        aria-label="Strikethrough"
        tooltip="Strikethrough"
      >
        <Strikethrough className="size-4" />
      </ToggleButton>

      <div className="mx-1 h-4 w-px bg-border" role="separator" />

      <ColorPopover
        editor={editor}
        type="background"
        displayColors={BUBBLE_BG_COLORS}
        applyColors={BUBBLE_BG_COLORS}
        triggerIcon={Highlighter}
        triggerLabel="Background color"
      />
      <ColorPopover
        editor={editor}
        type="text"
        displayColors={BUBBLE_BG_COLORS}
        applyColors={TEXT_COLORS}
        triggerIcon={Type}
        triggerLabel="Text color"
      />
    </div>
  );
}
