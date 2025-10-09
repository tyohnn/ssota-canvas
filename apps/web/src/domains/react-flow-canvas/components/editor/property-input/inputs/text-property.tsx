'use client';

import React, { useState } from 'react';
import { Node } from '@xyflow/react';
import { Input } from '@workspace/ui/components/ui/input';
import { Textarea } from '@workspace/ui/components/ui/textarea';
import { SchemaField } from '@/domains/blocks/types/common.node';
import { useNodeFieldUpdate } from '../useNodeFormDataUpdate';

export function TextProperty({
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

  const isMultiLine = value.includes('\n');

  const handleLabelClick = () => {
    setIsEditing(true);
    setInputValue(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.currentTarget.value);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      if (e.shiftKey) {
        // Shift+Enter: 줄바꿈 추가
        const cursorPosition = e.currentTarget.selectionStart ?? 0;
        const newValue =
          inputValue.slice(0, cursorPosition) +
          '\n' +
          inputValue.slice(cursorPosition);
        setInputValue(newValue);
        // 커서 위치 조정
        setTimeout(() => {
          e.currentTarget.setSelectionRange(
            cursorPosition + 1,
            cursorPosition + 1
          );
        }, 0);
      } else {
        // Enter: 저장
        setIsEditing(false);
        if (inputValue !== value) {
          updateField(node, field.path, inputValue);
        }
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(value);
    }
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: 줄바꿈 추가 (기본 동작)
        return;
      } else {
        // Enter: 저장
        e.preventDefault();
        setIsEditing(false);
        if (inputValue !== value) {
          updateField(node, field.path, inputValue);
        }
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(value);
    }
  };

  if (isEditing) {
    if (isMultiLine || inputValue.includes('\n')) {
      return (
        <Textarea
          className="resize-none text-xs min-h-[60px]"
          rows={Math.max(2, inputValue.split('\n').length)}
          placeholder={field.placeholder}
          value={inputValue}
          onChange={handleTextareaChange}
          onBlur={handleInputBlur}
          onKeyDown={handleTextareaKeyDown}
          autoFocus
        />
      );
    } else {
      return (
        <Input
          className="text-xs"
          placeholder={field.placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          autoFocus
        />
      );
    }
  }

  if (isMultiLine) {
    return (
      <div
        className="text-xs min-h-[60px] p-2 border border-transparent hover:border-border rounded cursor-text"
        onClick={handleLabelClick}
      >
        {value || (
          <span className="text-muted-foreground">{field.placeholder}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className="text-xs p-2 border border-transparent hover:border-border rounded cursor-text"
      onClick={handleLabelClick}
    >
      {value || (
        <span className="text-muted-foreground">{field.placeholder}</span>
      )}
    </div>
  );
}
