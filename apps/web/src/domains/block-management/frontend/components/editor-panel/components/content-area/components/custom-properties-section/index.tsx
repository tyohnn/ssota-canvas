'use client';

import type { ReactNode } from 'react';

import { PropertyGroup } from '../property-group';
import { CustomPropertyAddPopover } from './components/custom-property-add-popover';
import { PropertiesList } from './components/properties-list';
import { CustomPropertiesSectionProvider } from './core/provider';
import { useCustomPropertiesSectionContext } from './core/context';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import type { CustomPropertiesSectionProps } from './core/types';

function CustomPropertiesSectionContent(): ReactNode {
  const { customProperties, blockId } = useCustomPropertiesSectionContext();
  const { readonly } = useCanvasReadOnly();

  // readonly 모드이고 custom properties가 없으면 그룹 전체를 숨김
  if (readonly && customProperties.length === 0) {
    return null;
  }

  return (
    <PropertyGroup
      group={{
        id: 'custom-properties',
        label: 'Custom Properties',
        order: 1000,
        defaultCollapsed: false,
        properties: [],
      }}
      containerClassName="border-b border-border"
    >
      <PropertiesList />
      <CustomPropertyAddPopover blockId={blockId} />
    </PropertyGroup>
  );
}

export function CustomPropertiesSection({
  blockId,
}: CustomPropertiesSectionProps): ReactNode {
  return (
    <CustomPropertiesSectionProvider blockId={blockId}>
      <CustomPropertiesSectionContent />
    </CustomPropertiesSectionProvider>
  );
}
