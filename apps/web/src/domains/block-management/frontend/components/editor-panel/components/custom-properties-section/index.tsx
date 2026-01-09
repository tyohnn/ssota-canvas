'use client';

import type { ReactNode } from 'react';

import { PropertyGroup } from '../property-group';
import { CustomPropertyAddPopover } from './components/custom-property-add-popover';
import { PropertiesList } from './components/properties-list';
import { CustomPropertiesSectionProvider } from './core/provider';
import type { CustomPropertiesSectionProps } from './core/types';

export function CustomPropertiesSection({
  blockId,
}: CustomPropertiesSectionProps): ReactNode {
  return (
    <CustomPropertiesSectionProvider blockId={blockId}>
      <PropertyGroup
        group={{
          id: 'custom-properties',
          label: 'Custom Properties',
          order: 1000,
          defaultCollapsed: false,
          properties: [],
        }}
      >
        <PropertiesList />
        <CustomPropertyAddPopover blockId={blockId} />
      </PropertyGroup>
    </CustomPropertiesSectionProvider>
  );
}
