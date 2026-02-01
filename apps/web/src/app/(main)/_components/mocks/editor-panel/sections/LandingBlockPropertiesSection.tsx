/**
 * Landing Block Properties Section
 * 
 * Replicated from Block Properties Section with hardcoded schema
 * 공통 컴포넌트 - summarize와 structure 탭 모두에서 사용
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import { LandingBlockPropertyRenderer } from './LandingBlockPropertyRenderer';

// Mock Schema
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
    {
      id: 'metadata',
      label: 'Metadata',
      description: 'Creation and modification information',
      defaultCollapsed: false,
      order: 2,
      properties: ['createdAt', 'updatedAt', 'createdBy'],
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
    createdAt: {
      label: 'Created At',
      inputType: 'readonly-datetime',
      icon: 'Calendar',
      description: 'Date when the block was created',
      order: 11,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    updatedAt: {
      label: 'Updated At',
      inputType: 'readonly-datetime',
      icon: 'Clock',
      description: 'Date when the block was last updated',
      order: 12,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return '-';
        const date = new Date(value);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      },
    },
    createdBy: {
      label: 'Created By',
      inputType: 'readonly-profile',
      icon: 'User',
      description: 'User who created the block',
      order: 13,
      readonly: true,
      defaultDisplay: (value: any) => {
        if (!value) return 'Unknown';
        if (typeof value === 'string') return value;
        return value.name || value.email || 'Unknown';
      },
    },
  },
};

// Reused PropertyGroup component logic
function LandingPropertyGroup({
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

export function LandingBlockPropertiesSection() {
  // Mock data
  const blockData = {
    properties: {
      url: 'https://www.youtube.com/watch?v=0kARDVL2nZg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: {
        name: 'Demo User',
        email: 'demo@ssota.io',
      },
    },
  };

  // Filter out metadata group to match real implementation logic if needed,
  // but here we want to show it as per schema
  const sortedGroups = [...YOUTUBE_SCHEMA.groups]
    .filter(group => group.id !== 'metadata') // Usually metadata is hidden in main props section or handled differently
    .sort((a, b) => a.order - b.order);

  return (
    <div>
      {sortedGroups.map(group => (
        <LandingPropertyGroup key={group.id} group={group}>
          {group.properties.map((propertyKey: string) => {
            const propertyDef = (YOUTUBE_SCHEMA.properties as any)[propertyKey];
            if (!propertyDef) return null;

            const value = (blockData.properties as any)[propertyKey];

            return (
              <LandingBlockPropertyRenderer
                key={propertyKey}
                propertyKey={propertyKey}
                propertyDef={propertyDef}
                value={value}
              />
            );
          })}
        </LandingPropertyGroup>
      ))}
    </div>
  );
}
