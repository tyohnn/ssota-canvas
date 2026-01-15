'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus } from 'lucide-react';
import { useAddStatusOptionContext } from '../../core/context';
import { OptionEditPopover } from '../../../option-edit-popover';
import type { StatusGroup } from '../../types';
import type { PropertyOption } from '@/domains/block-management/shared/value-objects/block-properties/common-types';

interface GroupHeaderProps {
  group: StatusGroup;
}

export function GroupHeader({ group }: GroupHeaderProps) {
  const {
    isAddPopoverOpen,
    pendingOption,
    handleAddOption,
    handleClosePopover,
    handlePopoverOpenChange,
  } = useAddStatusOptionContext();

  // 현재 그룹에 대한 팝오버인지 확인
  const isCurrentGroupPopover =
    pendingOption &&
    (pendingOption as PropertyOption & { group?: string }).group === group.id
      ? true
      : undefined;

  const handleGroupPopoverOpenChange = (open: boolean) => {
    // 현재 그룹의 Popover가 아닌 경우 무시
    if (!open && !isCurrentGroupPopover) return;
    handlePopoverOpenChange(open);
  };

  return (
    <Popover
      open={isAddPopoverOpen && isCurrentGroupPopover}
      onOpenChange={handleGroupPopoverOpenChange}
    >
      <div className="flex items-center justify-between mb-2">
        <Label className="text-xs font-medium text-muted-foreground">
          {group.label}
        </Label>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAddOption(group.id)}
            className="p-0 hover:bg-accent/50 h-6 w-6"
          >
            <Plus className="h-3! w-3! text-muted-foreground!" />
          </Button>
        </PopoverTrigger>
      </div>
      {isCurrentGroupPopover && pendingOption && (
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
