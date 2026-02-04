'use client';

import { useEffect, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { BLOCK_TYPE_SIZES } from '@/domains/block-management/shared/types/block-types';
import { useCanvasModeContext } from '@/domains/canvas-management/frontend/hooks/mode/canvas-mode-context';
import { ShadowBlockView } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/shadow-block/components/shadow-block-view';
import { getShadowPreview } from '@/domains/canvas-management/frontend/components/react-flow-wrapper/components/shadow-block/core/shadow-block-preview-registry';

/**
 * Mock Shadow Block
 *
 * Renders a cursor-following block preview when in block-creation mode.
 * Reuses real ShadowBlockView and getShadowPreview.
 */
export function MockShadowBlock() {
  const { isBlockCreationMode, getCurrentMode } = useCanvasModeContext();
  const reactFlow = useReactFlow();
  const [flowPosition, setFlowPosition] = useState<{ x: number; y: number } | null>(null);
  const [initialized, setInitialized] = useState(false);

  const mode = getCurrentMode();
  const isVisible =
    isBlockCreationMode() &&
    mode.type === 'block-creation' &&
    flowPosition !== null &&
    initialized;

  useEffect(() => {
    if (!isBlockCreationMode()) {
      setFlowPosition(null);
      setInitialized(false);
      return;
    }

    const handleMove = (e: MouseEvent) => {
      try {
        const flowPos = reactFlow.screenToFlowPosition({
          x: e.clientX,
          y: e.clientY,
        });
        setFlowPosition(flowPos);
        if (!initialized) setInitialized(true);
      } catch {
        // ignore when ReactFlow not ready
      }
    };

    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [isBlockCreationMode, reactFlow, initialized]);

  if (!isVisible || mode.type !== 'block-creation') {
    return null;
  }

  const blockType = mode.blockType ?? 'text';
  const blockSize = BLOCK_TYPE_SIZES[blockType] ?? BLOCK_TYPE_SIZES['text'];
  const blockWidth = (blockSize?.width ?? 200) / 2;
  const blockHeight = (blockSize?.height ?? 150) / 2;

  const screenPosition = reactFlow.flowToScreenPosition(flowPosition!);
  const renderInfo = {
    screenPosition,
    blockWidth,
    blockHeight,
    PreviewComponent: getShadowPreview(blockType),
  };
  const blockInfo = {
    blockType,
    width: blockWidth,
    height: blockHeight,
  };

  return <ShadowBlockView renderInfo={renderInfo} blockInfo={blockInfo} />;
}
