'use client';

import type { ReactNode } from 'react';

import { Box } from '@/components/ui/box';
import { PropertyGroup } from '../property-group';
import { CustomPropertiesSectionProvider } from './core/provider';
import { useCustomPropertiesSectionContext } from './core/context';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import type { CustomPropertiesSectionProps } from './core/types';
import { cn } from '@/lib/utils';

function CustomPropertiesSectionContent(): ReactNode {
  const { customProperties } = useCustomPropertiesSectionContext();
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
      <Box
        className={cn(
          'mx-3 px-3 py-2 rounded-md',
          'bg-muted/50 text-muted-foreground',
          'text-xs font-medium text-center'
        )}
      >
        Coming soon
      </Box>
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
