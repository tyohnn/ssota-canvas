import { Box } from '@/components/ui/box';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

import { AlignmentsSection } from './components/alignments-section';
import { DistributeSection } from './components/distribute-section';
import { TriggerButton } from './components/trigger-button';
import type { ArrangeMenuProps } from './core/types';

/**
 * Arrange Menu Component
 *
 * Presentational 컴포넌트: Props만 받아서 렌더링
 * - Context 의존성 없음
 * - Storybook에서 독립적으로 테스트 가능
 */
export function ArrangeMenu({
  onAlign,
  onDistribute,
  selectedBlockCount,
}: ArrangeMenuProps): React.JSX.Element {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <TriggerButton className="h-8 w-8 p-0" />
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-2"
        side="left"
        align="start"
        // 팝업 내부 클릭 시 캔버스 이벤트 전파 방지
        onPointerDown={e => e.stopPropagation()}
        onEscapeKeyDown={e => e.stopPropagation()}
      >
        <Box className="flex flex-col gap-2">
          <AlignmentsSection onAlign={onAlign} />
          <Separator />
          <DistributeSection
            onDistribute={onDistribute}
            selectedBlockCount={selectedBlockCount}
          />
        </Box>
      </PopoverContent>
    </Popover>
  );
}
