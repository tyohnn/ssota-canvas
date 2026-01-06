import React from 'react';

import { CommandEmpty, CommandList } from '@workspace/ui/components/ui/command';

import type { BlockType, BlockTypeInfo } from '../../core/types';
import { BlockTypeCategoryGroup } from './block-type-category-group';

export interface BlockGroupListProps {
  blockTypesByCategory: Record<string, BlockTypeInfo[]>;
  onSelectBlockType: (blockType: BlockType) => void;
}

/**
 * Block Group List Component
 *
 * Presentational component: Renders the list of block types organized by category
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function BlockGroupList({
  blockTypesByCategory,
  onSelectBlockType,
}: BlockGroupListProps) {
  const categoryEntries = Object.entries(blockTypesByCategory);
  const totalCategories = categoryEntries.length;

  return (
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>

      {categoryEntries.map(([category, blockTypeInfos], categoryIndex) => (
        <BlockTypeCategoryGroup
          key={category}
          category={category}
          blockTypeInfos={blockTypeInfos}
          categoryIndex={categoryIndex}
          totalCategories={totalCategories}
          onSelectBlockType={onSelectBlockType}
        />
      ))}
    </CommandList>
  );
}
