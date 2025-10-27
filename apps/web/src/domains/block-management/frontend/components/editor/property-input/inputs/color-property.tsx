'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import type { PropertyUIDefinition } from '../../../../../shared/schemas/ui/block-ui-schema.interface';

export interface ColorPropertyProps {
  value: string | undefined;
  propertyDef: PropertyUIDefinition;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ColorProperty({
  value,
  propertyDef,
  onChange,
  disabled,
}: ColorPropertyProps) {
  const [localValue, setLocalValue] = useState(value || '#000000');

  useEffect(() => {
    setLocalValue(value || '#000000');
  }, [value]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };

  const currentValue = localValue;

  return (
    <div className="flex items-center gap-2 h-7">
      <Input
        type="color"
        value={currentValue}
        onChange={handleColorChange}
        disabled={disabled}
        className="w-12 h-7 p-1 cursor-pointer"
      />
      <span className="text-xs text-muted-foreground">{currentValue}</span>
    </div>
  );
}
