/**
 * Card View View Component
 *
 * Presentational component: 렌더링만 담당
 * - Props만 받음
 * - Hook 사용 없음
 * - Context 사용 없음
 * - Storybook에서 독립적으로 테스트 가능
 */

'use client';

import { Plus } from 'lucide-react';

import { Badge } from '@workspace/ui/components/ui/badge';
import { cn } from '@workspace/ui/lib/utils';

import { Box } from '@/components/ui/box';

import type { CardViewViewProps } from '../core/types';
import { CustomPropertyRow } from './custom-property-row';

/**
 * Card View View
 *
 * Presentational 컴포넌트 (렌더링만)
 */
export function CardViewView({
  title,
  blockType,
  customProperties,
  className,
  selected = false,
  onOpenEditorPanel,
  readonly = false,
}: CardViewViewProps) {
  return (
    <Box
      className={cn(
        'w-full h-full p-4 overflow-auto',
        'bg-background border-2 border-border rounded-lg',
        'shadow-md',
        // 호버 효과 (선택되지 않았을 때만)
        !selected && 'hover:shadow-xl',
        // 선택 효과
        selected && 'ring-2 ring-blue-400 dark:ring-blue-500',
        selected && 'shadow-xl',
        // Transition
        'transition-all duration-300 ease-out',
        'flex flex-col gap-3',
        className
      )}
    >
      {/* 블록 타입 배지 */}
      {blockType && (
        <Box>
          <Badge variant="secondary" className="shrink-0 cursor-default">
            {blockType}
          </Badge>
        </Box>
      )}

      {/* 제목 */}
      <Box className="font-semibold text-lg">{title}</Box>

      {/* 커스텀 속성들 */}
      <Box className="flex-1">
        {customProperties.length === 0 ? (
          // readonly일 때는 add property 버튼 숨김
          !readonly && (
            <Box
              className="py-2"
              onClick={
                selected
                  ? e => {
                    e.stopPropagation();
                    onOpenEditorPanel();
                  }
                  : undefined
              }
              onMouseDown={selected ? e => e.stopPropagation() : undefined}
            >
              <Box
                className={cn(
                  'w-fit flex items-center justify-start text-xs pl-1 pr-2 py-1 gap-1 rounded-md transition-colors',
                  selected
                    ? 'cursor-pointer text-muted-foreground hover:bg-accent/50 hover:text-foreground dark:hover:bg-accent/50'
                    : 'hidden opacity-50'
                )}
              >
                <Plus className="w-3 h-3" />
                Add Property
              </Box>
            </Box>
          )
        ) : (
          <Box className="space-y-0">
            {customProperties.map(({ property, value }) => (
              <CustomPropertyRow
                key={property.id}
                property={property}
                value={value}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
