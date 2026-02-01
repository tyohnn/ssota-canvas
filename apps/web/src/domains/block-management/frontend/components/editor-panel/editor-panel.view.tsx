/**
 * Editor Panel View
 *
 * Presentational component for Editor Panel shell
 * - 동일한 레이아웃, 스타일, 전환 애니메이션
 */

'use client';

import React from 'react';
import { cn } from '@workspace/ui/lib/utils';

export interface EditorPanelViewProps {
  /** 패널이 확장(전체화면) 모드인지 */
  isExpanded: boolean;
  /** 슬라이드 인/아웃 표시 여부 (true: 보임, false: 숨김) */
  isVisible: boolean;
  /** 추가 className (pointer-events 등) */
  className?: string;
  children: React.ReactNode;
}

export function EditorPanelView({
  isExpanded,
  isVisible,
  className,
  children,
}: EditorPanelViewProps) {
  return (
    <div
      className={cn(
        'absolute z-50 bg-background backdrop-blur-md border-border shadow-2xl',
        isExpanded
          ? 'inset-0 border rounded-none'
          : 'bottom-0 right-0 w-full md:w-[50%] h-full md:h-[90%] border-l border-t rounded-tl-lg',
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0',
        className
      )}
      style={{
        transition:
          'all 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s ease-out, opacity 0.3s ease-out',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-panel-title"
    >
      <div className="flex flex-col h-full">{children}</div>
    </div>
  );
}
