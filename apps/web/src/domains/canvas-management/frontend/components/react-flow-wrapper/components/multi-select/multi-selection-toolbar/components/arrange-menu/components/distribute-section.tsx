import {
  AlignHorizontalSpaceBetween,
  AlignVerticalSpaceBetween,
} from 'lucide-react';

import { ToolbarIconButton } from '@/components/ssota-ui/toolbar-icon-button';
import { Box } from '@/components/ui/box';

/**
 * Distribute Section Component
 *
 * Presentational 컴포넌트: Props만 받아서 렌더링
 * - Context 의존성 없음
 * - Storybook에서 독립적으로 테스트 가능
 */
export interface DistributeSectionProps {
  onDistribute: (direction: 'horizontal' | 'vertical') => void;
  selectedBlockCount: number;
}

export function DistributeSection({
  onDistribute,
  selectedBlockCount,
}: DistributeSectionProps): React.JSX.Element {
  return (
    <Box className="flex flex-col gap-1">
      <Box className="text-xs font-medium text-muted-foreground px-1">
        Distribute
      </Box>
      <Box className="flex gap-1">
        <ToolbarIconButton
          icon={<AlignHorizontalSpaceBetween className="h-4 w-4" />}
          tooltip="Distribute Horizontally"
          onClick={() => onDistribute('horizontal')}
          disabled={selectedBlockCount < 2}
        />
        <ToolbarIconButton
          icon={<AlignVerticalSpaceBetween className="h-4 w-4" />}
          tooltip="Distribute Vertically"
          onClick={() => onDistribute('vertical')}
          disabled={selectedBlockCount < 2}
        />
      </Box>
    </Box>
  );
}
