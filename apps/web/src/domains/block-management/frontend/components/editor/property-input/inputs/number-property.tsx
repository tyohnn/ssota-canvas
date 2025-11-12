'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import type { PropertyUIDefinition } from '../../../../../shared/schemas/ui/block-ui-schema.interface';

export interface NumberPropertyProps {
  value: number | string | undefined;
  propertyDef: PropertyUIDefinition;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function NumberProperty({
  value,
  propertyDef,
  onChange,
  disabled,
}: NumberPropertyProps) {
  const [localValue, setLocalValue] = useState(value?.toString() || '');
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value?.toString() || '');
  }, [value]);

  const currentValue = localValue;

  const handleLabelClick = () => {
    if (disabled) return;
    setIsEditing(true);
    setInputValue(currentValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.currentTarget.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const numValue = Number(inputValue);
    if (!isNaN(numValue) && inputValue !== currentValue) {
      // Optimistic update
      setLocalValue(inputValue);
      // Call parent onChange
      onChange(numValue);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      const numValue = Number(inputValue);
      if (!isNaN(numValue) && inputValue !== currentValue) {
        // Optimistic update
        setLocalValue(inputValue);
        // Call parent onChange
        onChange(numValue);
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(currentValue);
    }
  };

  if (isEditing) {
    return (
      <Input
        type="number"
        className="text-xs h-7"
        placeholder={propertyDef.placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        disabled={disabled}
        autoFocus
      />
    );
  }

  return (
    <div
      className="text-xs px-2 py-1 border border-transparent hover:border-border rounded cursor-text"
      onClick={handleLabelClick}
    >
      {currentValue || (
        <span className="text-muted-foreground">{propertyDef.placeholder}</span>
      )}
    </div>
  );
}
