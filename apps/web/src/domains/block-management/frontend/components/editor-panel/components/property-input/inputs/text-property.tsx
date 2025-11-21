'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { PropertyUIDefinition } from '@/domains/block-management/frontend/types/block-editor-schema.interface';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 원본 값 저장 (서버에 저장된 값, optimistic update와 비교용)
  const originalValueRef = useRef(value || '');

  // Props와 동기화 (편집 중이 아닐 때만)
  useEffect(() => {
    if (!isEditing && value !== undefined) {
      setTextValue(value || '');
      originalValueRef.current = value || '';
    }
  }, [value, isEditing]);

  const handleLabelClick = () => {
    if (disabled) return;
    // 편집 시작 시 현재 값을 원본으로 저장
    originalValueRef.current = textValue;
    setIsEditing(true);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.currentTarget.value;
    // 단일 상태만 업데이트
    setTextValue(newValue);
    // React Flow 노드 즉시 업데이트 (디바운스 없음)
    onImmediateChange?.(newValue);
  };

  const handleInputBlur = async () => {
    // 편집 모드 종료
    setIsEditing(false);

    // 원본 값(서버에 저장된 값)과 비교
    if (textValue !== originalValueRef.current) {
      await onChange(textValue);

      // 서버 저장 성공 후 원본 값 업데이트
      originalValueRef.current = textValue;
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
      setTextValue(originalValueRef.current);
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
