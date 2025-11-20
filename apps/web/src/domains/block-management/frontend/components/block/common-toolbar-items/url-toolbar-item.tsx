'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { Check, X, type LucideIcon } from 'lucide-react';
import { Button } from '@workspace/ui/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@workspace/ui/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@workspace/ui/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface UrlToolbarItemProps {
  blockId: string;
  blockMountId?: string;
  currentValue: string;
  disabled?: boolean;
  onValueChange?: (url: string) => Promise<void>;
  // 커스터마이징 옵션
  icon: LucideIcon;
  label: string;
  placeholder?: string;
  validateUrl?: (url: string) => boolean;
}

/**
 * URL Toolbar Item (공통)
 *
 * URL 편집을 위한 공통 툴바 아이템
 * - Popover로 URL 입력 폼 표시
 * - URL 변경 시 메타데이터 자동 fetch
 * - Link, YouTube 등 URL 기반 블록에서 재사용 가능
 */
export function UrlToolbarItem({
  blockId,
  blockMountId,
  currentValue,
  disabled = false,
  onValueChange,
  icon: Icon,
  label,
  placeholder = 'https://...',
  validateUrl,
}: UrlToolbarItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [draftUrl, setDraftUrl] = useState(currentValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // currentValue가 변경되면 draftUrl 동기화
  useEffect(() => {
    setDraftUrl(currentValue);
  }, [currentValue]);

  // Popover 열렸을 때 input에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (!onValueChange || isSubmitting) return;

      const trimmedUrl = draftUrl.trim();

      // URL이 비어있거나 변경되지 않았으면 그냥 닫기
      if (!trimmedUrl || trimmedUrl === currentValue) {
        setIsOpen(false);
        return;
      }

      // URL 형식 검증 (커스텀 validator가 있으면 사용, 없으면 기본 URL 검증)
      if (validateUrl) {
        if (!validateUrl(trimmedUrl)) {
          return;
        }
      } else {
        try {
          new URL(trimmedUrl);
        } catch {
          // 유효하지 않은 URL
          return;
        }
      }

      setIsSubmitting(true);
      try {
        await onValueChange(trimmedUrl);
        setIsOpen(false);
      } catch (error) {
        console.error('Failed to update URL:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [draftUrl, currentValue, onValueChange, isSubmitting, validateUrl]
  );

  const handleCancel = useCallback(() => {
    setDraftUrl(currentValue);
    setIsOpen(false);
  }, [currentValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();

      if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        handleCancel();
      }
    },
    [handleSubmit, handleCancel]
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              disabled={disabled}
              onMouseDown={e => e.stopPropagation()}
            >
              <Icon className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" hasArrow={false} sideOffset={10}>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        className="w-80 p-3"
        side="top"
        align="center"
        onMouseDown={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <form onSubmit={handleSubmit} className="space-y-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              {label}
            </label>
            <input
              ref={inputRef}
              type="url"
              value={draftUrl}
              onChange={e => setDraftUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                'w-full px-2 py-1.5 text-sm rounded-md',
                'border border-input bg-background',
                'text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              disabled={isSubmitting}
              onMouseDown={e => e.stopPropagation()}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              취소
            </Button>
            <Button
              type="submit"
              variant="default"
              size="sm"
              className="h-7 px-2"
              disabled={isSubmitting}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
