'use client';

import * as React from 'react';
import { Separator } from '@workspace/ui/components/ui/separator';
import { Box } from '@workspace/ui/components/ui/box';
import { PropertyDetailNameInputView } from './name-input.view';
import { PropertyDetailActionButtonsView } from './action-buttons.view';

export interface PropertyDetailPopoverViewProps {
  label: string;
  onLabelChange: (value: string) => void;
  icon: string | null;
  onIconChange: (icon: string | null) => void;
  iconPickerSlot?: (props: { value: string | undefined; onChange: (icon: string) => void }) => React.ReactNode;
  onDuplicate: () => Promise<void>;
  onDelete: () => Promise<void>;
  onKeyDown: (event: React.KeyboardEvent) => void;
  /** Optional option sections (e.g. select/status options) - injected from apps */
  optionSectionsSlot?: React.ReactNode;
}

/**
 * Popover content layout: name input, option sections, actions.
 */
export function PropertyDetailPopoverView({
  label,
  onLabelChange,
  icon,
  onIconChange,
  iconPickerSlot,
  onDuplicate,
  onDelete,
  onKeyDown,
  optionSectionsSlot,
}: PropertyDetailPopoverViewProps): React.JSX.Element {
  return (
    <Box tabIndex={-1} onKeyDown={onKeyDown} className="w-fit">
      <PropertyDetailNameInputView
        label={label}
        onLabelChange={onLabelChange}
        icon={icon}
        onIconChange={onIconChange}
        iconPickerSlot={iconPickerSlot}
      />
      {optionSectionsSlot && (
        <>
          <Separator className="my-3" />
          {optionSectionsSlot}
        </>
      )}
      <Separator className="my-3" />
      <PropertyDetailActionButtonsView onDuplicate={onDuplicate} onDelete={onDelete} />
    </Box>
  );
}
