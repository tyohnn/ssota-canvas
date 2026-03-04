'use client';

import * as React from 'react';
import { useDetailPopover } from './core/use-detail-popover';
import { PropertyDetailPopoverView } from './components/popover.view';
import type { DetailPopoverFieldLike } from './core/types';
import type { PropertyDetailPopoverDeps } from './core/types';

export interface PropertyDetailPopoverProps {
  entityId: string;
  field: DetailPopoverFieldLike;
  isOpen: boolean;
  onRequestClose: () => void;
  deps: PropertyDetailPopoverDeps;
  /** Icon picker slot - injected from apps */
  iconPickerSlot?: (props: {
    value: string | undefined;
    onChange: (icon: string) => void;
  }) => React.ReactNode;
  /** Option sections slot - injected from apps (select/status options) */
  optionSectionsSlot?: React.ReactNode;
}

/**
 * Property detail popover container.
 * Orchestration hook + View. All deps injected.
 */
export function PropertyDetailPopover({
  entityId,
  field,
  isOpen,
  onRequestClose,
  deps,
  iconPickerSlot,
  optionSectionsSlot,
}: PropertyDetailPopoverProps): React.JSX.Element {
  const {
    label,
    setLabel,
    icon,
    setIcon,
    handleDuplicate,
    handleDelete,
    handleKeyDown,
  } = useDetailPopover({ entityId, field, deps });

  if (!isOpen) return <></>;

  return (
    <PropertyDetailPopoverView
      label={label}
      onLabelChange={setLabel}
      icon={icon}
      onIconChange={setIcon}
      iconPickerSlot={iconPickerSlot}
      onDuplicate={handleDuplicate}
      onDelete={handleDelete}
      onKeyDown={handleKeyDown}
      optionSectionsSlot={optionSectionsSlot}
    />
  );
}
