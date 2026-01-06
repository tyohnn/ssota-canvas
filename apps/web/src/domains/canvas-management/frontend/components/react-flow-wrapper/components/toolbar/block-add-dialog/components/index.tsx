import React from 'react';

import { Command, CommandInput } from '@workspace/ui/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';

import type { BlockType, BlockTypeInfo } from '../core/types';
import { BlockGroupList } from './block-group-list';

export interface BlockAddDialogViewProps {
  isOpen: boolean;
  onClose: () => void;
  blockTypesByCategory: Record<string, BlockTypeInfo[]>;
  onSelectBlockType: (blockType: BlockType) => void;
}

/**
 * Block Add Dialog View Component
 *
 * Presentational component: Renders the block type selection dialog
 * - No Context dependencies
 * - Renders based on Props only
 * - Can be tested independently in Storybook
 */
export function BlockAddDialogView({
  isOpen,
  onClose,
  blockTypesByCategory,
  onSelectBlockType,
}: BlockAddDialogViewProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[450px] p-0 rounded-md">
        <DialogHeader className="px-4 py-3 border-b border-border/30">
          <DialogTitle>Select Block Type</DialogTitle>
          <DialogDescription>
            Choose a block type to add to your canvas.
          </DialogDescription>
        </DialogHeader>

        <Command className="rounded-md border-0">
          <CommandInput
            placeholder="Search block types..."
            className="border-0 focus:ring-0 rounded-md"
          />
          <BlockGroupList
            blockTypesByCategory={blockTypesByCategory}
            onSelectBlockType={onSelectBlockType}
          />
        </Command>
      </DialogContent>
    </Dialog>
  );
}
