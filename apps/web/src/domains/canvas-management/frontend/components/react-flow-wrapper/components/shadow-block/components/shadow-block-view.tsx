import { Box } from '@/components/ui/box';

import type { ShadowBlockViewProps } from '../core/types';

/**
 * ShadowBlockView Component
 *
 * Presentational 컴포넌트 - 순수 렌더링만 담당 (Props만 사용, Hook 없음)
 * Storybook에서 독립적으로 테스트 가능
 */
export function ShadowBlockView({
  renderInfo,
  blockInfo,
}: ShadowBlockViewProps) {
  const { screenPosition, blockWidth, blockHeight, PreviewComponent } =
    renderInfo;

  return (
    <Box
      className="fixed pointer-events-none z-50"
      style={{
        left: screenPosition.x - blockWidth / 2,
        top: screenPosition.y - blockHeight / 2,
        cursor: 'crosshair',
      }}
    >
      <PreviewComponent
        blockType={blockInfo.blockType}
        width={blockInfo.width}
        height={blockInfo.height}
      />

      <Box className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-blue-600 whitespace-nowrap">
        Click to create block • ESC to cancel
      </Box>
    </Box>
  );
}
