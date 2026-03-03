'use client';

import * as React from 'react';
import { useCustomPropertyItem } from './core/use-custom-property-item';
import { CustomPropertyItemView } from './components/item.view';
import type { CustomPropertyDefinitionLike } from './core/types';
import type { CustomPropertyItemDeps } from './core/use-custom-property-item';
import type { PropertyDetailPopoverDeps } from '../property-detail-popover/core/types';

export interface CustomPropertyItemProps {
  property: CustomPropertyDefinitionLike;
  deps: CustomPropertyItemDeps;
  /** Icon picker slot - injected from apps */
  iconPickerSlot?: (props: {
    value: string | undefined;
    onChange: (icon: string) => void;
  }) => React.ReactNode;
  /** Option sections slot - injected from apps (select/status options) */
  optionSectionsSlot?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Custom property item container.
 * Orchestration hook + View. All deps injected. No context.
 */
export function CustomPropertyItem({
  property,
  deps,
  iconPickerSlot,
  optionSectionsSlot,
  disabled,
}: CustomPropertyItemProps): React.JSX.Element {
  const {
    property: prop,
    value,
    isPopoverOpen,
    onPopoverOpenChange,
    onValueChange,
  } = useCustomPropertyItem({ property, deps });

  const detailPopoverDepsWithClose: PropertyDetailPopoverDeps = {
    ...deps.detailPopoverDeps,
    onRequestClose: () => onPopoverOpenChange(false),
  };

  return (
    <CustomPropertyItemView
      entityId={deps.entityId}
      property={prop}
      value={value}
      isPopoverOpen={isPopoverOpen}
      onPopoverOpenChange={onPopoverOpenChange}
      onValueChange={onValueChange}
      detailPopoverDeps={detailPopoverDepsWithClose}
      iconPickerSlot={iconPickerSlot}
      optionSectionsSlot={optionSectionsSlot}
      disabled={disabled}
    />
  );
}
