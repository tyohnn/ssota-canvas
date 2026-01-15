'use client';

import { CustomPropertyItemProvider } from './core/provider';
import type { CustomPropertyItemProps } from './core/types';
import { Label } from './components/label';
import { DetailPopover } from './components/property-detail-popover';
import { InputRenderer } from './components/input-renderer';
import { Popover, PopoverContent } from '@/components/ui/popover';
import { DetailPopoverTrigger } from './components/detail-popover-trigger';
import { useCustomPropertyItemContext } from './core/context';
import { InputBox } from './components/input-box';
import { Wrapper } from './components/wrapper';

function CustomPropertyItemContent() {
  const { popoverOpen, setPopoverOpen, blockId, property } =
    useCustomPropertyItemContext();

  return (
    <Wrapper>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <DetailPopoverTrigger open={popoverOpen}>
          <Label />
        </DetailPopoverTrigger>
        <PopoverContent side="left" align="center" className="w-fit p-3">
          <DetailPopover blockId={blockId} field={property} />
        </PopoverContent>
      </Popover>
      <InputBox>
        <InputRenderer type={property.type} />
      </InputBox>
    </Wrapper>
  );
}

export function CustomPropertyItem({ property }: CustomPropertyItemProps) {
  return (
    <CustomPropertyItemProvider property={property}>
      <CustomPropertyItemContent />
    </CustomPropertyItemProvider>
  );
}
