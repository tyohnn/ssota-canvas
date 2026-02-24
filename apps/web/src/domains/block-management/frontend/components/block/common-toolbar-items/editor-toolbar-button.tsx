/**
 * Editor Toolbar Button Component
 *
 * 블록 mount toolbar 공통: 에디터 패널 열기 버튼
 * - 아이콘: ChevronsRight (>>)
 * - 텍스트: Editor
 */

'use client';

import { ChevronsRight } from 'lucide-react';

import { ToolbarIconButton } from '@workspace/ui/components/ssota-ui/toolbar-icon-button';

export interface EditorToolbarButtonProps {
  onClick: () => void;
  /** @default "h-6 gap-1 px-2 rounded-sm" */
  className?: string;
  /** @default "size-3.5 shrink-0" */
  iconClassName?: string;
  onMouseDown?: React.MouseEventHandler<HTMLButtonElement>;
}

export function EditorToolbarButton({
  onClick,
  className = 'h-6 gap-1 px-2 rounded-sm',
  iconClassName = 'size-3.5 shrink-0',
  onMouseDown,
}: EditorToolbarButtonProps) {
  return (
    <ToolbarIconButton
      icon={
        <>
          <span className="text-xs">Editor</span>
          <ChevronsRight className={iconClassName} />
        </>
      }
      tooltip="Open Editor"
      tooltipSide="top"
      tooltipOffset={5}
      onClick={onClick}
      onMouseDown={onMouseDown}
      className={className}
      iconClassName={undefined}
    />
  );
}
