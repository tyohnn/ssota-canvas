'use client';

import { useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { getAbsoluteNodePosition } from '@/domains/canvas-management/frontend/hooks/group/utils/get-absolute-node-position';

/** Tutorial layout: editor panel on right, block visible on left */
const TUTORIAL_LAYOUT_CONFIG = {
  editorRatio: 0.36,
  leftPaddingRatio: 0.07,
  rightPaddingRatio: 0.05,
  centerRatio: 0.35,
  preferredZoom: 0.9,
} as const;

/**
 * Adjusts viewport when tutorial editor panel opens so the selected block
 * stays visible and centered in the remaining canvas area.
 * Must be called inside ReactFlowProvider.
 */
export function useMockViewportAdjustment(
  blockMountId: string | null,
  isOpen: boolean
) {
  const { setCenter, getNode, getNodes } = useReactFlow();

  useEffect(() => {
    if (!isOpen || !blockMountId) return;

    // Delay so panel is mounted and flex layout has updated canvas width before we read dimensions and run setCenter
    const VIEWPORT_DELAY_MS = 120;
    const timer = setTimeout(() => {
      const node = getNode(blockMountId);
      if (!node) return;

      const allNodes = getNodes();
      const position = getAbsoluteNodePosition(node, allNodes);

      const viewportElement = document.querySelector(
        '.react-flow__viewport'
      )?.parentElement;
      if (!viewportElement) return;

      const viewportWidth = viewportElement.clientWidth;
      const viewportHeight = viewportElement.clientHeight;
      const canvasWidth = viewportWidth;

      const layoutConfig = TUTORIAL_LAYOUT_CONFIG;
      const editorPanelWidth = canvasWidth * layoutConfig.editorRatio;
      const leftPadding = canvasWidth * layoutConfig.leftPaddingRatio;
      const rightPadding = canvasWidth * layoutConfig.rightPaddingRatio;

      const availableWidth =
        canvasWidth - leftPadding - rightPadding - editorPanelWidth;

      const nodeWidth = (node.width as number) ?? 400;
      const nodeHeight = (node.height as number) ?? 260;

      const requiredZoom = (availableWidth * 0.85) / nodeWidth;
      const targetZoom = Math.min(
        Math.max(Math.min(requiredZoom, layoutConfig.preferredZoom), 0.3),
        1.6
      );

      const screenCenterX =
        leftPadding + availableWidth * layoutConfig.centerRatio;
      const screenCenterY = viewportHeight / 2;

      const nodeCenterX = position.x + nodeWidth / 2;
      const nodeCenterY = position.y + nodeHeight / 2;

      const offsetX = (canvasWidth / 2 - screenCenterX) / targetZoom;
      const targetX = nodeCenterX + offsetX;
      const targetY = nodeCenterY;

      setCenter(targetX, targetY, {
        zoom: targetZoom,
        duration: 500,
      });
    }, VIEWPORT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isOpen, blockMountId, getNode, getNodes, setCenter]);
}
