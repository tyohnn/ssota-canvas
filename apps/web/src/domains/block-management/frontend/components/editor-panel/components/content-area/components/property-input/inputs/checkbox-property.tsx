'use client';

import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { PropertyUIDefinition } from '@/domains/block-management/frontend/types/block-editor-schema.interface';

export interface CheckboxPropertyProps {
  value: boolean | undefined;
  propertyDef: PropertyUIDefinition;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

export function CheckboxProperty({
  value,
  propertyDef,
  onChange,
  disabled,
}: CheckboxPropertyProps) {
  const [localValue, setLocalValue] = useState(value || false);

  // Sync local value with prop value
  useEffect(() => {
    setLocalValue(value || false);
  }, [value]);

  const handleChange = (checked: boolean) => {
    // Optimistic update
    setLocalValue(checked);
    // Call parent onChange
    onChange(checked);
  };

  return (
    <div className="flex items-center h-7 px-2">
      <Checkbox
        checked={localValue}
        onCheckedChange={handleChange}
        disabled={disabled}
      />
    </div>
  );
}
