'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { BlockPropertyRendererView } from '@/domains/block-management/frontend/components/editor-panel/components/content-area/components/block-properties-section/components/block-property-renderer.view';
import type { PropertyUIDefinition } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { TUTORIAL_YOUTUBE_PROPERTIES } from '@/domains/tutorial-management/frontend/config/tutorial-mock-data';

const YOUTUBE_SCHEMA = {
  groups: [
    {
      id: 'basic-info',
      label: 'Basic Information',
      description: 'YouTube video information',
      defaultCollapsed: false,
      order: 1,
      properties: ['url'],
    },
  ],
  properties: {
    url: {
      label: 'YouTube URL',
      inputType: 'url',
      icon: 'Link',
      description: 'YouTube video URL',
      placeholder: 'https://www.youtube.com/watch?v=...',
      order: 1,
    },
  } as Record<string, PropertyUIDefinition>,
};

function MockPropertyGroup({
  group,
  children,
}: {
  group: (typeof YOUTUBE_SCHEMA.groups)[number];
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(group.defaultCollapsed);

  return (
    <div className="border-b border-border/50 last:border-0">
      <button
        type="button"
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

/**
 * Mock block properties section for tutorial editor panel. Shows Basic Information (URL) only.
 */
export function MockBlockPropertiesSection() {
  const blockData = {
    properties: {
      url: TUTORIAL_YOUTUBE_PROPERTIES.url,
    },
  };

  const sortedGroups = [...YOUTUBE_SCHEMA.groups].sort(
    (a, b) => a.order - b.order
  );

  return (
    <div>
      {sortedGroups.map((group) => (
        <MockPropertyGroup key={group.id} group={group}>
          {group.properties.map((propertyKey: string) => {
            const propertyDef = YOUTUBE_SCHEMA.properties[propertyKey];
            if (!propertyDef) return null;
            const value = (blockData.properties as Record<string, unknown>)[
              propertyKey
            ];
            return (
              <BlockPropertyRendererView
                key={propertyKey}
                propertyKey={propertyKey}
                propertyDef={propertyDef}
                value={value}
                onChange={() => {}}
                onImmediateChange={() => {}}
                readOnly={true}
              />
            );
          })}
        </MockPropertyGroup>
      ))}
    </div>
  );
}
