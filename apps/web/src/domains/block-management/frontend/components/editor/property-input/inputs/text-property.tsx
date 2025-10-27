'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { PropertyUIDefinition } from '../../../../../shared/schemas/ui/block-ui-schema.interface';

export interface TextPropertyProps {
  value: string | undefined;
  propertyDef: PropertyUIDefinition;
  onChange: (value: string) => void;
  onImmediateChange?: (value: string) => void;
  disabled?: boolean;
}

export function TextProperty({
  value,
  propertyDef,
  onChange,
  onImmediateChange,
  disabled,
}: TextPropertyProps) {
  // 단일 상태로 통합 (span과 textarea 모두 사용)
  const [textValue, setTextValue] = useState(value || '');
  const [isEditing, setIsEditing] = useState(false);
  const isInitialized = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 초기값 설정 (한 번만)
  useEffect(() => {
    if (!isInitialized.current && value !== undefined) {
      setTextValue(value || '');
      isInitialized.current = true;
    }
  }, [value]);

  const handleLabelClick = () => {
    if (disabled) return;
    setIsEditing(true);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.currentTarget.value;
    // 단일 상태만 업데이트
    setTextValue(newValue);
    // React Flow 노드 즉시 업데이트 (디바운스 없음)
    onImmediateChange?.(newValue);
  };

  const handleInputBlur = () => {
    // 편집 모드 종료
    setIsEditing(false);

    // 서버에 저장 (편집 종료 시에만)
    if (textValue !== value) {
      onChange(textValue);
    }
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: 줄바꿈 추가 (기본 동작 허용)
        // Textarea에서는 기본 동작을 사용하므로 아무것도 하지 않음
        return;
      } else {
        // Enter: 저장 및 종료 (blur와 동일한 로직)
        e.preventDefault();
        handleInputBlur();
      }
    } else if (e.key === 'Escape') {
      // Escape: 변경사항 취소 (원본 값으로 복원)
      setTextValue(value || '');
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Textarea
        ref={textareaRef}
        className="resize-none text-xs min-h-[50px] py-1 px-2"
        rows={Math.max(1, textValue.split('\n').length)}
        placeholder={propertyDef.placeholder}
        value={textValue}
        onChange={handleTextareaChange}
        onBlur={handleInputBlur}
        onKeyDown={handleTextareaKeyDown}
        disabled={disabled}
        autoFocus
      />
    );
  }

  return (
    <div
      className="text-xs min-h-[50px] py-1 px-2 border border-transparent hover:border-border rounded cursor-text whitespace-pre-wrap"
      onClick={handleLabelClick}
    >
      {textValue || (
        <span className="text-muted-foreground">{propertyDef.placeholder}</span>
      )}
    </div>
  );
}
