'use client';

import React, { useState } from 'react';
import { Input } from '@workspace/ui/components/ui/input';
import { Button } from '@workspace/ui/components/ui/button';
import { SchemaField } from '@/domains/blocks/types/common.node';
import { useNodeFieldUpdate } from '../useNodeFormDataUpdate';
import { Node } from '@xyflow/react';

export function PhoneProperty({
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

  const isValidPhone = (phone: string) => {
    // 한국 전화번호 형식: 010-1234-5678, 02-123-4567, 031-123-4567 등
    const phoneRegex = /^(\d{2,3})-?(\d{3,4})-?(\d{4})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const formatPhoneNumber = (input: string) => {
    // 숫자만 추출
    const numbers = input.replace(/\D/g, '');

    // 한국 전화번호 형식에 맞게 포맷팅
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
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
        type="tel"
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
          {field.placeholder || 'Click to edit phone'}
        </span>
      )}
    </Button>
  );
}
