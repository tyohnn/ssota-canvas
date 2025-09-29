'use client';

import React, { useState } from 'react';
import { Input } from '@workspace/ui/components/ui/input';
import { Button } from '@workspace/ui/components/ui/button';
import { SchemaField } from '@/domains/blocks/types/common.node';
import { useNodeFieldUpdate } from '../useNodeFormDataUpdate';
import { Node } from '@xyflow/react';

export function EmailProperty({
  data,
  field,
  node,
}: {
  data: string | undefined;
  field: SchemaField;
  node: Node;
}) {
  const { updateField } = useNodeFieldUpdate();
  const value = data || '';
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLabelClick = () => {
    setIsEditing(true);
    setInputValue(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.currentTarget.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    if (inputValue !== value) {
      updateField(node, field.path, inputValue);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      if (inputValue !== value) {
        updateField(node, field.path, inputValue);
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(value);
    }
  };

  if (isEditing) {
    return (
      <Input
        className="h-7 text-xs"
        type="email"
        placeholder={field.placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        autoFocus
      />
    );
  }

  return (
    <Button
      variant="ghost"
      className="w-full h-auto min-h-7 px-2 py-1 text-sm justify-start font-normal text-left hover:bg-muted/50 cursor-pointer"
      onClick={handleLabelClick}
    >
      {value || (
        <span className="text-muted-foreground">
          {field.placeholder || 'Click to edit email'}
        </span>
      )}
    </Button>
  );
}
