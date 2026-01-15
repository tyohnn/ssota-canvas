/**
 * URL Toolbar Item View Component
 *
 * Presentational component: Renders the URL input popover
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */

'use client';

import { Check, type LucideIcon, X } from 'lucide-react';

import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';
import { Button } from '@workspace/ui/components/ui/button';
import { Input } from '@workspace/ui/components/ui/input';
import { Label } from '@workspace/ui/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';

import { Box } from '@/components/ui/box';

import type {
  UrlToolbarItemBusinessLogic,
  UrlToolbarItemUIState,
} from '../core/types';

export interface UrlToolbarItemViewProps {
  icon: LucideIcon;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  uiState: UrlToolbarItemUIState;
  business: UrlToolbarItemBusinessLogic;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
}

export function UrlToolbarItemView({
  icon: Icon,
  label,
  placeholder = 'https://...',
  disabled = false,
  uiState,
  business,
  handleSubmit,
}: UrlToolbarItemViewProps): React.JSX.Element {
  const {
    isOpen,
    draftUrl,
    isSubmitting,
    inputRef,
    setDraftUrl,
    handleOpenChange,
    handleCancel,
    handleKeyDown,
  } = uiState;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <ToolbarIconButton
          icon={<Icon />}
          tooltip={label}
          tooltipSide="top"
          tooltipOffset={5}
          disabled={disabled}
          onMouseDown={e => e.stopPropagation()}
          className="h-7 w-7 p-0"
          iconClassName="size-3.5"
        />
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-3"
        side="top"
        align="center"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        onOpenAutoFocus={e => {
          e.preventDefault();
          // Popover가 열리면 input에 포커스
          setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
          }, 0);
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-2">
          <Box className="space-y-1">
            <Label className="text-xs font-medium text-foreground">
              {label}
            </Label>
            <Input
              ref={inputRef}
              type="url"
              value={draftUrl}
              onChange={e => setDraftUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isSubmitting}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            />
          </Box>
          <Box className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              className="h-7 px-2"
              disabled={isSubmitting}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </form>
      </PopoverContent>
    </Popover>
  );
}
