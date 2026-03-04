'use client';

import * as React from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@workspace/ui/components/ui/popover';
import { CustomPropertyAddTriggerButtonView } from './trigger-button.view';
import { CustomPropertyAddNameInputView } from './name-input.view';
import { TypeGridView } from './type-grid.view';
import { cn } from '@workspace/ui/lib/utils';
import type { PropertyTypeLike } from '../core/types';

export interface CustomPropertyAddPopoverViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyName: string;
  onPropertyNameChange: (value: string) => void;
  icon: string | null;
  onIconChange: (icon: string | null) => void;
  onSelectType: (type: PropertyTypeLike, fallbackName: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  iconPickerSlot?: (props: {
    value: string | undefined;
    onChange: (icon: string) => void;
  }) => React.ReactNode;
}

export function CustomPropertyAddPopoverView({
  open,
  onOpenChange,
  propertyName,
  onPropertyNameChange,
  icon,
  onIconChange,
  onSelectType,
  inputRef,
  iconPickerSlot,
}: CustomPropertyAddPopoverViewProps): React.JSX.Element {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger>
        <CustomPropertyAddTriggerButtonView title="Add Property" isOpen={open} />
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-[320px] p-3 space-y-3')}
        side="left"
        align="center"
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <CustomPropertyAddNameInputView
          value={propertyName}
          onChange={onPropertyNameChange}
          inputRef={inputRef}
          iconPickerSlot={iconPickerSlot}
          icon={icon}
          onIconChange={onIconChange}
          onKeyDown={handleKeyDown}
        />
        <TypeGridView onSelectType={onSelectType} />
      </PopoverContent>
    </Popover>
  );
}
