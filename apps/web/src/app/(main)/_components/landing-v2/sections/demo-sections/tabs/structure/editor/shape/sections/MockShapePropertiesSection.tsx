/**
 * Mock Shape Properties Section
 *
 * Replicated from Block Properties Section using shapeEditorPanelSchema
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { shapeEditorPanelSchema } from '@/domains/block-management/frontend/components/block/block-type/shape/config/shape-editor-panel-schema';
import { LandingBlockPropertyRenderer } from "../../../../../../../../mocks/editor-panel/sections/LandingBlockPropertyRenderer";

// Reused PropertyGroup component logic
function ShapePropertyGroup({
  group,
  children,
}: {
  group: any;
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(group.defaultCollapsed);

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center w-full px-4 py-2 hover:bg-accent/50 transition-colors group select-none"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground mr-2 transition-transform group-hover:text-foreground" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground mr-2 transition-transform group-hover:text-foreground" />
        )}
        <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
          {group.label}
        </span>
      </button>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'
        )}
      >
        <div className="pb-2">{children}</div>
      </div>
    </div>
  );
}

interface MockShapePropertiesSectionProps {
  shapeBlockData: {
    blockId: string;
    title: string;
    properties: {
      shapeType: string;
      color: string;
      borderStyle: string;
    };
  };
}

export function MockShapePropertiesSection({ shapeBlockData }: MockShapePropertiesSectionProps) {
  // Filter out metadata group to match real implementation logic
  const sortedGroups = [...shapeEditorPanelSchema.groups]
    .filter(group => group.id !== 'metadata')
    .sort((a, b) => a.order - b.order);

  return (
    <div>
      {sortedGroups.map(group => (
        <ShapePropertyGroup key={group.id} group={group}>
          {group.properties.map((propertyKey: string) => {
            const propertyDef = shapeEditorPanelSchema.properties[propertyKey];
            if (!propertyDef) return null;

            const value = shapeBlockData.properties?.[propertyKey as keyof typeof shapeBlockData.properties];

            return (
              <LandingBlockPropertyRenderer
                key={propertyKey}
                propertyKey={propertyKey}
                propertyDef={propertyDef}
                value={value}
              />
            );
          })}
        </ShapePropertyGroup>
      ))}
    </div>
  );
}
