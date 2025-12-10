/**
 * Add Button Component
 *
 * Zone의 끝에 위치하는 버튼 (블록과 가까운 쪽)
 */

'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@workspace/ui/lib/utils';
import type { AddButtonDirection } from './core/use-add-buttons.business';

interface AddButtonProps {
  direction: AddButtonDirection;
  onClick: () => void;
  isHovered: boolean;
}

export function AddButton({ direction, onClick, isHovered }: AddButtonProps) {
  return (
    <button
      onClick={e => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'z-50 nodrag nopan',
        'w-7 h-7 rounded-full',
        'bg-blue-500 hover:bg-blue-600',
        'text-white',
        'flex items-center justify-center',
        'shadow-lg hover:shadow-xl',
        'transition-all duration-200',
        'hover:scale-110',
        'cursor-pointer',
        // hover 상태에 따라 투명도 조절
        isHovered ? 'opacity-100' : 'opacity-30'
      )}
      aria-label={`Add block ${direction}`}
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
