/**
 * TriggerButton - Presentational Component
 *
 * 순수 UI 컴포넌트 (Framer 디자이너용)
 * - Radix UI 의존성 없음
 * - Context 의존성 없음
 * - Props만으로 동작
 *
 * 사용 시나리오:
 * - Framer: 버튼 디자인만 작업
 * - Test: 독립적인 컴포넌트 테스트
 * - 재사용: 다른 곳에서도 사용 가능
 */

'use client';

import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Box } from '@workspace/ui/components/ui/box';

export interface TriggerButtonProps {
  /**
   * 버튼 텍스트
   * @default 'Add Property'
   */
  title?: string;

  /**
   * Popover 열림 상태
   * @default false
   */
  isOpen?: boolean;

  /**
   * 추가 className
   */
  className?: string;
}

/**
 * 디자인만 있는 div 컴포넌트
 * PopoverTrigger가 자체적으로 버튼을 렌더링하므로, 스타일만 적용
 */
export function TriggerButton({
  title = 'Add Property',
  isOpen = false,
  className,
}: TriggerButtonProps) {
  return (
    <Box
      className={cn(
        'w-fit flex items-center justify-start text-xs px-2 py-1 gap-1 ml-1 rounded-md cursor-pointer transition-colors',
        isOpen
          ? 'bg-accent/50 text-foreground dark:bg-accent/50'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:bg-accent/50',
        className
      )}
    >
      <Plus className="w-3 h-3" />
      {title}
    </Box>
  );
}
