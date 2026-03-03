'use client';

import type { ReactNode } from 'react';

import { Box } from '@workspace/ui/components/ui/box';
import { cn } from '@workspace/ui/lib/utils';

import { PropertyGroup } from '../property-group';
import type { CustomPropertiesSectionDeps } from './core/types';

export interface CustomPropertiesSectionProps {
  entityId: string;
  deps: CustomPropertiesSectionDeps;
  readonly?: boolean;
}

export function CustomPropertiesSection({
  entityId,
  deps,
  readonly = false,
}: CustomPropertiesSectionProps): ReactNode {
  if (readonly) {
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
