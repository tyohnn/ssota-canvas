import {
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignHorizontalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignVerticalJustifyStart,
} from 'lucide-react';

import { ToolbarIconButton } from '@/components/ssota-ui/toolbar-icon-button';
import { Box } from '@/components/ui/box';

import type { AlignmentType } from '../../../core/types';

/**
 * Alignments Section Component
 *
 * Presentational 컴포넌트: Props만 받아서 렌더링
 * - Context 의존성 없음
 * - Storybook에서 독립적으로 테스트 가능
 */
export interface AlignmentsSectionProps {
  onAlign: (alignmentType: AlignmentType) => void;
}

export function AlignmentsSection({
  onAlign,
}: AlignmentsSectionProps): React.JSX.Element {
  return (
    <Box className="flex flex-col gap-1">
      <Box className="text-xs font-medium text-muted-foreground px-1">
        Alignments
      </Box>
      {/* Row 1: Horizontal alignments */}
      <Box className="flex gap-1">
        <ToolbarIconButton
          icon={<AlignHorizontalJustifyStart className="h-4 w-4" />}
          tooltip="Align Left"
          onClick={() => onAlign('left')}
          tooltipSide="top"
        />
        <ToolbarIconButton
          icon={<AlignHorizontalJustifyCenter className="h-4 w-4" />}
          tooltip="Align Center"
          onClick={() => onAlign('center')}
          tooltipSide="top"
        />
        <ToolbarIconButton
          icon={<AlignHorizontalJustifyEnd className="h-4 w-4" />}
          tooltip="Align Right"
          onClick={() => onAlign('right')}
          tooltipSide="top"
        />
      </Box>
      {/* Row 2: Vertical alignments */}
      <Box className="flex gap-1">
        <ToolbarIconButton
          icon={<AlignVerticalJustifyStart className="h-4 w-4" />}
          tooltip="Align Top"
          onClick={() => onAlign('top')}
        />
        <ToolbarIconButton
          icon={<AlignVerticalJustifyCenter className="h-4 w-4" />}
          tooltip="Align Middle"
          onClick={() => onAlign('middle')}
        />
        <ToolbarIconButton
          icon={<AlignVerticalJustifyEnd className="h-4 w-4" />}
          tooltip="Align Bottom"
          onClick={() => onAlign('bottom')}
        />
      </Box>
    </Box>
  );
}
