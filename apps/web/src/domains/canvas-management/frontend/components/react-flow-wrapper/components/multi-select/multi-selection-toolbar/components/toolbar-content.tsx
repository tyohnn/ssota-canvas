import { Copy, Trash2 } from 'lucide-react';

import { ToolbarIconButton } from '@/components/ssota-ui/toolbar-icon-button';
import { Box } from '@/components/ui/box';
import { TooltipProvider } from '@/components/ui/tooltip';

import type { AlignmentType } from '../core/types';
import { ArrangeMenu } from './arrange-menu';

/**
 * Toolbar Content Component
 *
 * Presentational 컴포넌트: 전체 툴바 컨텐츠 렌더링
 * - Context 의존성 없음
 * - Props만 받아서 렌더링
 * - Storybook에서 독립적으로 테스트 가능
 */
export interface ToolbarContentProps {
  onAlign: (alignmentType: AlignmentType) => void;
  onDistribute: (direction: 'horizontal' | 'vertical') => void;
  onDuplicate: () => void | Promise<void>;
  onDelete: () => void | Promise<void>;
  selectedBlockCount: number;
}

export function ToolbarContent({
  onAlign,
  onDistribute,
  onDuplicate,
  onDelete,
  selectedBlockCount,
}: ToolbarContentProps): React.JSX.Element {
  return (
    <Box className="bg-background border border-border rounded-lg shadow-lg p-1 flex items-center gap-1">
      <TooltipProvider delayDuration={300}>
        <ArrangeMenu
          onAlign={onAlign}
          onDistribute={onDistribute}
          selectedBlockCount={selectedBlockCount}
        />
        <ToolbarIconButton
          icon={<Copy className="h-3 w-3" />}
          tooltip="Duplicate"
          onClick={onDuplicate}
          tooltipSide="top"
        />
        <ToolbarIconButton
          icon={<Trash2 className="h-3 w-3" />}
          tooltip="Delete"
          onClick={onDelete}
          variant="destructive"
          tooltipSide="top"
        />
      </TooltipProvider>
    </Box>
  );
}
