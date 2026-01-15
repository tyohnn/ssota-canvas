'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import type { PropertyUIDefinition } from '@/domains/block-management/frontend/types/block-editor-schema.interface';

export interface EmailPropertyProps {
  value: string | undefined;
  propertyDef: PropertyUIDefinition;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function EmailProperty({
  value,
  propertyDef,
  onChange,
  disabled,
}: EmailPropertyProps) {
  const [localValue, setLocalValue] = useState(value || '');
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    setLocalValue(value || '');
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
    if (inputValue !== currentValue) {
      setLocalValue(inputValue);
      onChange(inputValue);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      if (inputValue !== currentValue) {
        setLocalValue(inputValue);
        onChange(inputValue);
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(currentValue);
    }
  };

  if (isEditing) {
    return (
      <Input
        type="email"
        className="text-xs"
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
      className="text-xs p-2 border border-transparent hover:border-border rounded cursor-text"
      onClick={handleLabelClick}
    >
      {currentValue || (
        <span className="text-muted-foreground">{propertyDef.placeholder}</span>
      )}
    </div>
  );
}
