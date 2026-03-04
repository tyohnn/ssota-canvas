'use client';

import * as React from 'react';
import { useCustomPropertyAddPopover } from './core/use-custom-property-add-popover';
import { CustomPropertyAddPopoverView } from './components/add-popover.view';
import type { CustomPropertyAddPopoverDeps } from './core/types';

export interface CustomPropertyAddPopoverProps {
  entityId: string;
  deps: CustomPropertyAddPopoverDeps;
  readonly?: boolean;
  /** Icon picker slot - injected from apps */
  iconPickerSlot?: (props: {
    value: string | undefined;
    onChange: (icon: string) => void;
  }) => React.ReactNode;
}

/**
 * Custom property add popover container.
 * Orchestration hook + View. All deps injected.
 */
export function CustomPropertyAddPopover({
  entityId,
  deps,
  readonly,
  iconPickerSlot,
}: CustomPropertyAddPopoverProps): React.JSX.Element | null {
  const {
    open,
    propertyName,
    icon,
    handleOpenChange,
    handleSelectType,
    setPropertyName,
    setIcon,
    inputRef,
  } = useCustomPropertyAddPopover({ entityId, deps });

  if (readonly) {
    return null;
  }

  return (
    <CustomPropertyAddPopoverView
      open={open}
      onOpenChange={handleOpenChange}
      propertyName={propertyName}
      onPropertyNameChange={setPropertyName}
      icon={icon}
      onIconChange={setIcon}
      onSelectType={handleSelectType}
      inputRef={inputRef}
      iconPickerSlot={iconPickerSlot}
    />
  );
}
