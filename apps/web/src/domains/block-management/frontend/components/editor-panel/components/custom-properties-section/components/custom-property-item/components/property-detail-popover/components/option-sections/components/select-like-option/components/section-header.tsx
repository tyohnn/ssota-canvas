'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus } from 'lucide-react';
import { useAddOptionContext } from '../core/context';
import { OptionEditPopover } from '../../option-edit-popover';

export function SectionHeader() {
  const {
    isAddPopoverOpen,
    pendingOption,
    handleAddOption,
    handleClosePopover,
    handlePopoverOpenChange,
    popoverTriggerRef,
  } = useAddOptionContext();

  return (
    <Popover open={isAddPopoverOpen} onOpenChange={handlePopoverOpenChange}>
      <div className="flex items-center justify-between">
        <Label
          className="text-xs font-medium text-muted-foreground mb-1 select-none"
          htmlFor="options"
        >
          Options
        </Label>
        <PopoverTrigger asChild>
          <Button
            ref={popoverTriggerRef}
            variant="ghost"
            size="sm"
            onClick={handleAddOption}
            className="p-0 hover:bg-accent/50 h-6 w-6"
          >
            <Plus className="h-3! w-3! text-muted-foreground!" />
          </Button>
        </PopoverTrigger>
      </div>
      {pendingOption && (
        <PopoverContent align="start" side="right" className="w-48">
          <OptionEditPopover
            option={pendingOption}
            isNew={false}
            onClose={handleClosePopover}
          />
        </PopoverContent>
      )}
    </Popover>
  );
}
