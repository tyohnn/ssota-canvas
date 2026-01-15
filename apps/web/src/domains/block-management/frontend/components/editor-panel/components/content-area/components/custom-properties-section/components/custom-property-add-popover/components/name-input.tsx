/**
 * Property Name Input
 *
 * 팝오버 내에서 속성 이름을 입력하는 인풋 컴포넌트
 */

'use client';

import { type ChangeEvent, type KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { IconPicker } from '@/domains/workspace-management/frontend/components/shared/icon-picker';
import { cn } from '@/lib/utils';
import { useCustomPropertyAddPopoverContext } from '../core/context';
import { Box } from '@workspace/ui/components/ui/box';

export interface NameInputProps {
  placeholder?: string;
  className?: string;
}

export function NameInput({
  placeholder = 'Enter property name',
  className,
}: NameInputProps) {
  const {
    propertyName,
    setPropertyName,
    inputRef,
    handleOpenChange,
    icon,
    setIcon,
  } = useCustomPropertyAddPopoverContext();

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      handleOpenChange(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPropertyName(event.currentTarget.value);
  };

  const handleIconChange = (nextIcon: string) => {
    const trimmed = nextIcon.trim();
    setIcon(trimmed.length > 0 ? trimmed : null);
  };

  return (
    <Box className="flex items-start gap-1 mt-1">
      <IconPicker
        value={icon ?? undefined}
        onChange={handleIconChange}
        className="h-8 w-8"
        storageKey="property-add-popover-icon"
      />
      <Input
        id="custom-property-name"
        name="custom-property-name"
        ref={inputRef}
        value={propertyName}
        placeholder={placeholder}
        className={cn('h-8', className)}
        autoFocus
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
    </Box>
  );
}
