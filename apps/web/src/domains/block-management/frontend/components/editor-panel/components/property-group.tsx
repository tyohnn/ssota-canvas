/**
 * Property Group Component
 *
 * 속성들을 그룹화하여 표시하는 Collapsible 컴포넌트
 */

'use client';

import { useState } from 'react';
import type { PropertyGroupDefinition } from '../../../types/block-editor-schema.interface';

export interface PropertyGroupProps {
  group: PropertyGroupDefinition;
  children: React.ReactNode;
}

export function PropertyGroup({ group, children }: PropertyGroupProps) {
  const [isOpen, setIsOpen] = useState(!group.defaultCollapsed);

  return (
    <div className="py-3">
      {/* Group Label - Simple and Small */}
      <div className="px-3 mb-1.5">
        <h3 className="text-[10px] font-semibold text-muted-foreground tracking-wide">
          {group.label}
        </h3>
      </div>

      {/* Group Content */}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
