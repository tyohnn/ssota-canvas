'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@workspace/ui/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from '@workspace/ui/components/ui/sonner';
import { cn } from '@workspace/ui/lib/utils';
import type { PropertyUIDefinition } from '@/domains/block-management/frontend/types/block-editor-schema.interface';

export interface UrlPropertyProps {
  value: string | undefined;
  propertyDef: PropertyUIDefinition;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function UrlProperty({
  value,
  propertyDef,
  onChange,
  disabled,
}: UrlPropertyProps) {
  const [localValue, setLocalValue] = useState(value || '');
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentValue) return;

    try {
      await navigator.clipboard.writeText(currentValue);
      setCopied(true);
      toast('URL 복사 완료', {
        description: 'URL이 클립보드에 복사되었습니다.',
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      toast('복사 실패', {
        description: 'URL 복사에 실패했습니다.',
        duration: 2000,
      });
    }
  };

  if (isEditing) {
    return (
      <Input
        type="url"
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
      className={cn(
        'group relative text-xs p-2 pr-10 border border-transparent hover:border-border rounded cursor-text',
        currentValue && 'pr-10'
      )}
      onClick={handleLabelClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {currentValue ? (
        <a
          href={currentValue}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground hover:underline truncate block"
          onClick={e => e.stopPropagation()}
        >
          {currentValue}
        </a>
      ) : (
        <span className="text-muted-foreground">{propertyDef.placeholder}</span>
      )}

      {/* 복사 버튼 (호버 시 표시) */}
      {currentValue && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            copied && 'opacity-100'
          )}
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      )}
    </div>
  );
}
