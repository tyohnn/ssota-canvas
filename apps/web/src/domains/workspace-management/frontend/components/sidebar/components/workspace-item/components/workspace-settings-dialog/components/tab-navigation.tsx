'use client';

import { cn } from '@workspace/ui/lib/utils';
import type { SettingsTab, Tab } from '../core/types';

/**
 * Tab Navigation (Presentational)
 *
 * Left sidebar navigation for settings tabs
 *
 * Follows Container/Presentational pattern (v4.0.0):
 * - Props only (tabs, activeTab, onTabClick)
 * - Storybook testable
 * - No business logic
 */

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: SettingsTab;
  onTabClick: (tab: SettingsTab) => void;
}

export function TabNavigation({
  tabs,
  activeTab,
  onTabClick,
}: TabNavigationProps) {
  return (
    <div className="w-48 border-r border-border/30 bg-muted/30 p-4">
      <div className="mb-4">
        <h3 className="font-semibold text-sm px-2">Workspace Settings</h3>
      </div>
      <div className="space-y-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabClick(tab.id)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors',
                activeTab === tab.id
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
