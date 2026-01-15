/**
 * Property Group Component
 *
 * 속성들을 그룹화하여 표시하는 Collapsible 컴포넌트
 */

'use client';

import { useState } from 'react';

import { Box } from '@/components/ui/box';
import type { PropertyGroupDefinition } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { cn } from '@/lib/utils';

export interface PropertyGroupProps {
  group: PropertyGroupDefinition;
  children: React.ReactNode;
  containerClassName?: string;
}

export function PropertyGroup({
  group,
  children,
  containerClassName,
}: PropertyGroupProps) {
  const [isOpen, setIsOpen] = useState(!group.defaultCollapsed);

  return (
    <Box className={cn('py-3 ', containerClassName)}>
      {/* Group Label - Simple and Small */}
      <Box className="px-3 mb-1.5">
        <h3 className="text-[10px] font-semibold text-muted-foreground tracking-wide">
          {group.label}
        </h3>
      </Box>

      {/* Group Content */}
      <div className="space-y-0.5">{children}</div>
    </Box>
  );
}
