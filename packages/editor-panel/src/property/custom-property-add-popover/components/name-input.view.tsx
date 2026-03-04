'use client';

import * as React from 'react';
import { Input } from '@workspace/ui/components/ui/input';
import { Label } from '@workspace/ui/components/ui/label';
import { Box } from '@workspace/ui/components/ui/box';
import { cn } from '@workspace/ui/lib/utils';

export interface CustomPropertyAddNameInputViewProps {
  value: string;
  onChange: (value: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  placeholder?: string;
  /** Icon picker slot - injected from apps. IconPicker typically passes string to onChange. */
  iconPickerSlot?: (props: {
    value: string | undefined;
    onChange: (icon: string) => void;
  }) => React.ReactNode;
  icon: string | null;
  onIconChange: (icon: string | null) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}

export function CustomPropertyAddNameInputView({
  value,
  onChange,
  inputRef,
  placeholder = 'Enter property name',
  iconPickerSlot,
  icon,
  onIconChange,
  onKeyDown,
  className,
}: CustomPropertyAddNameInputViewProps): React.JSX.Element {
  const handleIconChange = (nextIcon: string) => {
    const trimmed = nextIcon.trim();
    onIconChange(trimmed.length > 0 ? trimmed : null);
  };

  return (
    <Box className={cn('space-y-2', className)}>
      <Label
        htmlFor="custom-property-name"
        className="text-xs font-medium text-muted-foreground"
      >
        Add Custom Property
      </Label>
      <Box className="flex items-start gap-1 mt-1">
        {iconPickerSlot?.({ value: icon ?? undefined, onChange: (v: string) => handleIconChange(v) })}
        <Input
          id="custom-property-name"
          ref={inputRef}
          value={value}
          placeholder={placeholder}
          className="h-8"
          onChange={(e) => onChange(e.currentTarget.value)}
          onKeyDown={onKeyDown}
          autoFocus
        />
      </Box>
    </Box>
  );
}
