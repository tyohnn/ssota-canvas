'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import type { PropertyUIDefinition } from '../../../../../shared/schemas/ui/block-ui-schema.interface';
import { getBadgeStyleObject } from '../utils/badge-style.utils';

export interface SelectPropertyProps {
  value: string | undefined;
  propertyDef: PropertyUIDefinition;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SelectProperty({
  value,
  propertyDef,
  onChange,
  disabled,
}: SelectPropertyProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  const currentValue = localValue;
  const options = propertyDef.options || [];
  const currentOption = options.find(opt => opt.value === currentValue);

  const handleLabelClick = () => {
    if (disabled) return;
    setIsEditing(true);
  };

  const handleSelectChange = (newValue: string) => {
    // Optimistic update
    setLocalValue(newValue);
    setIsEditing(false);
    // Call parent onChange
    onChange(newValue);
  };

  const handleSelectOpenChange = (open: boolean) => {
    if (!open) {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Select
        value={currentValue}
        onValueChange={handleSelectChange}
        onOpenChange={handleSelectOpenChange}
        disabled={disabled}
        open={isEditing}
      >
        <SelectTrigger className="h-7 text-xs focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-[color,box-shadow] border-ring ring-ring/50 ring-[3px]">
          <SelectValue>
            {currentOption ? (
              <Badge
                className="gap-1.5 h-5"
                style={getBadgeStyleObject(currentOption.color)}
              >
                <span className="text-xs">{currentOption.label}</span>
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">
                {propertyDef.placeholder || 'Select option'}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              <Badge
                className="gap-1.5 h-5"
                style={getBadgeStyleObject(option.color)}
              >
                <span className="text-xs">{option.label}</span>
              </Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Button
      variant="ghost"
      className="w-full h-7 px-2 py-0.5 text-xs justify-start font-normal text-left hover:bg-muted/50 cursor-pointer"
      onClick={handleLabelClick}
      disabled={disabled}
    >
      {currentOption ? (
        <Badge
          className="gap-1.5 h-5"
          style={getBadgeStyleObject(currentOption.color)}
        >
          <span className="text-xs">{currentOption.label}</span>
        </Badge>
      ) : (
        <span className="text-xs text-muted-foreground">
          {propertyDef.placeholder || 'Click to select'}
        </span>
      )}
    </Button>
  );
}
