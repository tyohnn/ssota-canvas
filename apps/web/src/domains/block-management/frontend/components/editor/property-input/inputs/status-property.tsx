'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { PropertyUIDefinition } from '../../../../../shared/schemas/ui/block-ui-schema.interface';
import { getBadgeStyleObject } from '../utils/badge-style.utils';

// Status groups with default options
const statusGroups = {
  todo: {
    label: 'To Do',
    color: 'bg-gray-100 border-gray-300 text-gray-900',
    dotColor: 'bg-gray-500',
  },
  inProgress: {
    label: 'In Progress',
    color: 'bg-blue-100 border-blue-300 text-blue-900',
    dotColor: 'bg-blue-500',
  },
  done: {
    label: 'Complete',
    color: 'bg-emerald-100 border-emerald-300 text-emerald-900',
    dotColor: 'bg-emerald-500',
  },
};

export interface StatusPropertyProps {
  value: string | undefined;
  propertyDef: PropertyUIDefinition;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function StatusProperty({
  value,
  propertyDef,
  onChange,
  disabled,
}: StatusPropertyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const allOptions = propertyDef.options || [];

  // Group options by their status type
  const groupedOptions = {
    todo: allOptions.filter(opt => (opt as any).group === 'todo'),
    inProgress: allOptions.filter(opt => (opt as any).group === 'inProgress'),
    done: allOptions.filter(opt => (opt as any).group === 'done'),
  };

  const currentOption = allOptions.find(opt => opt.value === localValue);

  const handleStatusSelect = (newValue: string) => {
    if (disabled) return;
    // Optimistic update
    setLocalValue(newValue);
    // Call parent onChange
    onChange(newValue);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!disabled) {
      setIsOpen(open);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-7 px-2 py-0.5 text-xs justify-start font-normal text-left hover:bg-muted/50 select-none cursor-pointer"
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
              {propertyDef.placeholder || '상태 선택'}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2">
          {Object.entries(statusGroups).map(([groupKey, groupConfig]) => {
            const groupOptions =
              groupedOptions[groupKey as keyof typeof groupedOptions];
            if (groupOptions.length === 0) return null;

            return (
              <div key={groupKey} className="mb-3 last:mb-0">
                <div className="mb-2 px-2">
                  <h4 className="text-xs font-medium text-muted-foreground">
                    {groupConfig.label}
                  </h4>
                </div>
                <div className="space-y-1">
                  {groupOptions.map(option => (
                    <Button
                      key={option.value}
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start h-8 px-2 ${
                        value === option.value ? 'bg-accent' : ''
                      }`}
                      onClick={() => handleStatusSelect(option.value)}
                    >
                      <Badge
                        className="gap-1.5 h-5"
                        style={getBadgeStyleObject(option.color)}
                      >
                        <span className="text-xs">{option.label}</span>
                      </Badge>
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
