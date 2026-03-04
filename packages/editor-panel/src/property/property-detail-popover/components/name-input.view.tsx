'use client';

import * as React from 'react';
import { Box } from '@workspace/ui/components/ui/box';
import { Input } from '@workspace/ui/components/ui/input';
import { Label } from '@workspace/ui/components/ui/label';
import { cn } from '@workspace/ui/lib/utils';

export interface PropertyDetailNameInputViewProps {
  label: string;
  onLabelChange: (value: string) => void;
  icon: string | null;
  onIconChange: (icon: string | null) => void;
  /** Icon picker slot - injected from apps. Receives value/onChange; IconPicker typically passes string to onChange. */
  iconPickerSlot?: (props: {
    value: string | undefined;
    onChange: (icon: string) => void;
  }) => React.ReactNode;
  className?: string;
}

/**
 * Name + icon input for property detail popover.
 * iconPickerSlot is injected because IconPicker may be domain-specific.
 */
export function PropertyDetailNameInputView({
  label,
  onLabelChange,
  icon,
  onIconChange,
  iconPickerSlot,
  className,
}: PropertyDetailNameInputViewProps): React.JSX.Element {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onLabelChange(e.target.value);
  };

  const handleIconChange = (nextIcon: string) => {
    const trimmed = nextIcon.trim();
    onIconChange(trimmed.length > 0 ? trimmed : null);
  };

  return (
    <Box className={cn('space-y-2', className)}>
      <Label htmlFor="property-name" className="text-xs font-medium text-muted-foreground">
        Property name
      </Label>
      <Box className="flex items-start gap-1 mt-1">
        {iconPickerSlot?.({ value: icon ?? undefined, onChange: (v: string) => handleIconChange(v) })}
        <Input
          value={label}
          id="property-name"
          onChange={handleChange}
          placeholder="Property name"
          className="h-8"
        />
      </Box>
    </Box>
  );
}
