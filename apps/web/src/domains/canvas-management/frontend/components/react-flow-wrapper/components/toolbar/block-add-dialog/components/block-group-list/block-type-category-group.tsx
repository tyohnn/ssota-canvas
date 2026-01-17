import { Fragment } from 'react';

import {
  CommandGroup,
  CommandSeparator,
} from '@workspace/ui/components/ui/command';

import type { BlockType, BlockTypeInfo } from '../../core/types';
import { BlockTypeItem } from './block-type-item';

export interface BlockTypeCategoryGroupProps {
  category: string;
  blockTypeInfos: BlockTypeInfo[];
  categoryIndex: number;
  totalCategories: number;
  onSelectBlockType: (blockType: BlockType) => void;
}

/**
 * Block Type Category Group Component
 *
 * Presentational component: Renders a category group with its block types
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function BlockTypeCategoryGroup({
  category,
  blockTypeInfos,
  categoryIndex,
  totalCategories,
  onSelectBlockType,
}: BlockTypeCategoryGroupProps) {
  return (
    <Fragment key={category}>
      <CommandGroup heading={category}>
        {blockTypeInfos.map((blockTypeInfo, blockIndex) => (
          <BlockTypeItem
            key={`${category}-${blockTypeInfo.type}-${blockIndex}`}
            blockTypeInfo={blockTypeInfo}
            category={category}
            blockIndex={blockIndex}
            onSelectBlockType={onSelectBlockType}
          />
        ))}
      </CommandGroup>
      {categoryIndex < totalCategories - 1 && (
        <CommandSeparator className="bg-border/50" />
      )}
    </Fragment>
  );
}
