'use client';

import { Box } from '@/components/ui/box';
import { cn } from '@workspace/ui/lib/utils';
import type { DriveAddDialogTab, DriveBlockTypeTab } from '../core/types';

interface DriveAddDialogTabsProps {
  tabs: DriveAddDialogTab[];
  activeTab: DriveBlockTypeTab;
  onTabClick: (tab: DriveBlockTypeTab) => void;
  variant?: 'vertical' | 'horizontal';
}

export function DriveAddDialogTabs({
  tabs,
  activeTab,
  onTabClick,
  variant = 'vertical',
}: DriveAddDialogTabsProps) {
  const isHorizontal = variant === 'horizontal';

  const tabButtons = tabs.map(tab => (
    <button
      key={tab.id}
      type="button"
      onClick={() => onTabClick(tab.id)}
      className={cn(
        'flex items-center gap-2 rounded-md text-sm transition-colors shrink-0',
        isHorizontal
          ? 'px-3 py-1.5'
          : 'w-full px-2 py-1.5 text-left',
        activeTab === tab.id
          ? 'bg-accent text-accent-foreground font-medium'
          : 'hover:bg-accent hover:text-accent-foreground text-muted-foreground'
      )}
    >
      <tab.icon className="size-4 shrink-0" />
      <span>{tab.label}</span>
    </button>
  ));

  if (isHorizontal) {
    return (
      <Box className="flex flex-col gap-2 min-w-0">
        <Box className="px-2 text-sm font-semibold shrink-0">Resource type</Box>
        <Box className="w-full min-w-0 overflow-x-auto overflow-y-hidden -mx-1 pb-1 touch-pan-x overscroll-x-contain">
          <Box className="flex flex-nowrap gap-2 w-max px-1">
            {tabButtons}
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="space-y-1">
      <Box className="mb-2 px-2 text-sm font-semibold">Resource type</Box>
      {tabButtons}
    </Box>
  );
}
