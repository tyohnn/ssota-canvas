'use client';

import { Fragment, useMemo } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
  CommandSeparator,
} from '@workspace/ui/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/ui/dialog';
import type { BlockType } from '@/domains/block-management/shared/types/block-types';
import { BlockTypeItem } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/block-add-dialog/components/block-group-list/block-type-item';
import { DEFAULT_BLOCK_TYPES } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/block-add-dialog/core/block-types';
import type { BlockTypeInfo } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/toolbar/block-add-dialog/core/types';
import { InteractionGuard } from '../common/interaction-guard';
import { useTutorialDialogContext } from '../tutorial-dialog/core/context';

interface MockBlockAddDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBlockType?: (blockType: BlockType) => void;
  /** When provided, enters block-creation mode on select (tutorial flow) */
  enterBlockCreationMode?: (blockType: BlockType) => void;
}

/**
 * Mock Block Add Dialog
 *
 * Uses real dialog/command structure and BlockTypeItem; each item is wrapped
 * in InteractionGuard with selector `block-type-${type}` so the current step
 * can highlight the correct block type (e.g. block-type-markdown).
 * When enterBlockCreationMode is provided, selecting a type enters that mode and closes the dialog.
 */
/**
 * When the current step targets something inside this dialog (e.g. block-type-markdown),
 * prevent closing so the user must complete the step.
 */
function isAddDialogLocked(currentStep: { targetSelector?: string } | null): boolean {
  return (
    currentStep != null && (currentStep.targetSelector?.startsWith('block-type-') ?? false)
  );
}

export function MockBlockAddDialog({
  isOpen,
  onClose,
  onSelectBlockType,
  enterBlockCreationMode,
}: MockBlockAddDialogProps) {
  const { currentStep } = useTutorialDialogContext();
  const locked = isOpen && isAddDialogLocked(currentStep);

  const handleSelectBlockType = (blockType: BlockType) => {
    enterBlockCreationMode?.(blockType);
    onClose();
    onSelectBlockType?.(blockType);
  };

  const blockTypesByCategory = useMemo(() => {
    const grouped = DEFAULT_BLOCK_TYPES.reduce<Record<string, BlockTypeInfo[]>>(
      (acc, blockTypeInfo) => {
        const category = blockTypeInfo.category;
        if (!category) return acc;
        if (!acc[category]) acc[category] = [];
        acc[category].push(blockTypeInfo);
        return acc;
      },
      {}
    );
    const { Code, ...filtered } = grouped;
    return filtered;
  }, []);
  const categoryEntries = Object.entries(blockTypesByCategory);
  const totalCategories = categoryEntries.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[450px] p-0 rounded-md"
        closeButtonDisabled={locked}
        onInteractOutside={locked ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={locked ? (e) => e.preventDefault() : undefined}
      >
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
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {categoryEntries.map(([category, blockTypeInfos], categoryIndex) => (
              <Fragment key={category}>
                <CommandGroup heading={category}>
                  {blockTypeInfos.map((blockTypeInfo, blockIndex) =>
                    blockTypeInfo.isPreparing ? null : (
                      <InteractionGuard
                        key={`${category}-${blockTypeInfo.type}-${blockIndex}`}
                        selector={`block-type-${blockTypeInfo.type}`}
                      >
                        <BlockTypeItem
                          blockTypeInfo={blockTypeInfo}
                          category={category}
                          blockIndex={blockIndex}
                          onSelectBlockType={handleSelectBlockType}
                        />
                      </InteractionGuard>
                    )
                  )}
                </CommandGroup>
                {categoryIndex < totalCategories - 1 && (
                  <CommandSeparator className="bg-border/50" />
                )}
              </Fragment>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
