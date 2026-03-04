'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check } from 'lucide-react';
import type { PropertyUIDefinition } from '../types';
import { getBadgeStyleObject } from '../utils/badge-style.utils';

export interface MultiSelectPropertyProps {
  value: string[] | undefined;
  propertyDef: PropertyUIDefinition;
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function MultiSelectProperty({
  value,
  propertyDef,
  onChange,
  disabled,
}: MultiSelectPropertyProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localValues, setLocalValues] = useState<string[]>(value || []);

  // Sync local values with prop value
  useEffect(() => {
    setLocalValues(value || []);
  }, [value]);

  const currentValues = localValues;
  const allOptions = propertyDef.options || [];

  const selectedOptions = allOptions.filter(opt =>
    currentValues.includes(opt.value)
  );

  const handleToggleOption = (optionValue: string) => {
    if (disabled) return;

    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter(v => v !== optionValue)
      : [...currentValues, optionValue];

    // Optimistic update
    setLocalValues(newValues);
    // Call parent onChange
    onChange(newValues);
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
          className="w-full h-auto min-h-7 px-2 py-0.5 text-xs justify-start font-normal text-left hover:bg-muted/50 select-none cursor-pointer"
          disabled={disabled}
        >
          {selectedOptions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {selectedOptions.map(opt => (
                <Badge
                  key={opt.value}
                  className="h-5 px-1.5 gap-1.5 font-medium"
                  style={getBadgeStyleObject(opt.color)}
                >
                  <span className="text-xs">{opt.label}</span>
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">
              {propertyDef.placeholder || 'Select options'}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 max-h-64 overflow-y-auto">
          {allOptions.map(option => {
            const isSelected = currentValues.includes(option.value);

            return (
              <Button
                key={option.value}
                variant="ghost"
                size="sm"
                className={`w-full justify-start h-7 px-2 mb-0.5 ${
                  isSelected ? 'bg-accent' : ''
                }`}
                onClick={() => handleToggleOption(option.value)}
              >
                <div className="flex items-center gap-1.5 w-full">
                  <div className="w-3.5 h-3.5 flex items-center justify-center">
                    {isSelected && <Check className="h-2.5 w-2.5" />}
                  </div>
                  <Badge
                    className="h-5 px-1.5 gap-1.5 font-medium"
                    style={getBadgeStyleObject(option.color)}
                  >
                    <span className="text-xs">{option.label}</span>
                  </Badge>
                </div>
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
