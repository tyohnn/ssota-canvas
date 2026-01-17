import React from 'react';

import { CommandItem } from '@workspace/ui/components/ui/command';

import { Box } from '@/components/ui/box';

import type { BlockType, BlockTypeInfo } from '../../core/types';

export interface BlockTypeItemProps {
  blockTypeInfo: BlockTypeInfo;
  category: string;
  blockIndex: number;
  onSelectBlockType: (blockType: BlockType) => void;
}

/**
 * Block Type Item Component
 *
 * Presentational component: Renders a single block type item
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function BlockTypeItem({
  blockTypeInfo,
  category,
  blockIndex,
  onSelectBlockType,
}: BlockTypeItemProps) {
  const IconComponent = blockTypeInfo.icon;
  const isPreparing = blockTypeInfo.isPreparing;

  if (isPreparing) {
    return null;
  }

  return (
    <CommandItem
      key={`${category}-${blockTypeInfo.type}-${blockIndex}`}
      value={`${blockTypeInfo.displayName} ${blockTypeInfo.description}`}
      onSelect={() => {
        onSelectBlockType(blockTypeInfo.type);
      }}
      className="flex items-center gap-3 px-2 py-1.5 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
    >
      <IconComponent className="h-4 w-4" />
      <Box className="flex flex-col flex-1">
        <Box className="flex items-center justify-between">
          <span className="font-medium">{blockTypeInfo.displayName}</span>
        </Box>
        <span className="text-xs text-muted-foreground">
          {blockTypeInfo.description}
        </span>
      </Box>
    </CommandItem>
  );
}
