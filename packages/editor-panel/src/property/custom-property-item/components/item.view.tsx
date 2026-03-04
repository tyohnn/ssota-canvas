'use client';

import * as React from 'react';
import {
  Popover,
  PopoverContent,
} from '@workspace/ui/components/ui/popover';
import { DetailPopoverTrigger } from '../../detail-popover-trigger';
import { PropertyDetailPopover } from '../../property-detail-popover';
import { CustomPropertyLabelView } from './label.view';
import { CustomPropertyInputBox } from './input-box';
import { CustomPropertyInputRendererView } from './input-renderer.view';
import { CustomPropertyItemWrapper } from './wrapper';
import type { CustomPropertyDefinitionLike } from '../core/types';
import type { PropertyDetailPopoverDeps } from '../../property-detail-popover/core/types';

export interface CustomPropertyItemViewProps {
  entityId: string;
  property: CustomPropertyDefinitionLike;
  value: unknown;
  isPopoverOpen: boolean;
  onPopoverOpenChange: (open: boolean) => void;
  onValueChange: (nextValue: unknown) => void;
  detailPopoverDeps: PropertyDetailPopoverDeps;
  iconPickerSlot?: (props: {
    value: string | undefined;
    onChange: (icon: string) => void;
  }) => React.ReactNode;
  optionSectionsSlot?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Item layout: popover trigger (label) + input box.
 */
export function CustomPropertyItemView({
  entityId,
  property,
  value,
  isPopoverOpen,
  onPopoverOpenChange,
  onValueChange,
  detailPopoverDeps,
  iconPickerSlot,
  optionSectionsSlot,
  disabled,
}: CustomPropertyItemViewProps): React.JSX.Element {
  return (
    <CustomPropertyItemWrapper>
      <Popover open={isPopoverOpen} onOpenChange={onPopoverOpenChange}>
        <DetailPopoverTrigger open={isPopoverOpen}>
          <CustomPropertyLabelView
            propertyName={property.name}
            propertyIcon={property.icon ?? null}
          />
        </DetailPopoverTrigger>
        <PopoverContent side="left" align="center" className="w-fit p-3">
          <PropertyDetailPopover
            entityId={entityId}
            field={property}
            isOpen={isPopoverOpen}
            onRequestClose={() => onPopoverOpenChange(false)}
            deps={detailPopoverDeps}
            iconPickerSlot={iconPickerSlot}
            optionSectionsSlot={optionSectionsSlot}
          />
        </PopoverContent>
      </Popover>
      <CustomPropertyInputBox>
        <CustomPropertyInputRendererView
          property={property}
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
        />
      </CustomPropertyInputBox>
    </CustomPropertyItemWrapper>
  );
}
