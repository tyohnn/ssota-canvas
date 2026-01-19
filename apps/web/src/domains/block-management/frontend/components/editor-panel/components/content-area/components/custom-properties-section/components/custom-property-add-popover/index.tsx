/**
 * Property Add Popover
 *
 * 커스텀 속성 추가 팝오버
 * - 속성 이름 입력
 * - 속성 타입 선택
 * - 속성 생성 및 추가
 */

'use client';

import * as React from 'react';
import { CustomPropertyAddPopoverProvider } from './core/provider';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { TriggerButton } from './components/trigger-button';
import { NameInput } from './components/name-input';
import { TypeGrid } from './components/type-grid';
import { Label } from './components/label';
import type { CustomPropertyAddPopoverProps } from './core/types';
import { useCustomPropertyAddPopoverContext } from './core/context';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import { cn } from '@/lib/utils';

function CustomPropertyAddPopoverWrapper(): React.JSX.Element {
  const { open, handleOpenChange } = useCustomPropertyAddPopoverContext();
  const { readonly } = useCanvasReadOnly();

  // readonly 모드에서는 버튼을 숨김
  if (readonly) {
    return <></>;
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger>
        <TriggerButton title="Add Property" isOpen={open} />
      </PopoverTrigger>
      <PopoverContent
        className={cn('w-[320px] p-3 space-y-3')}
        side="left"
        align="center"
        onEscapeKeyDown={() => handleOpenChange(false)}
      >
        <Label />
        <NameInput />
        <TypeGrid />
      </PopoverContent>
    </Popover>
  );
}

export function CustomPropertyAddPopover({
  blockId,
  businessLogic,
}: CustomPropertyAddPopoverProps): React.JSX.Element {
  return (
    <CustomPropertyAddPopoverProvider
      blockId={blockId}
      businessLogic={businessLogic}
    >
      <CustomPropertyAddPopoverWrapper />
    </CustomPropertyAddPopoverProvider>
  );
}
