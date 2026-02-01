/**
 * Landing Viewport Adjustment Hook
 *
 * useViewportAdjustment의 모킹 버전
 * - useSidebar 미사용 (레이아웃 고정)
 * - 에디터 패널 열림 시 블록을 적절한 위치로 이동
 */

'use client';

import { useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { getAbsoluteNodePosition } from '@/domains/canvas-management/frontend/hooks/group/utils/get-absolute-node-position';

/** 랜딩 데모용 고정 레이아웃 (사이드바 expanded 기준) */
const LANDING_LAYOUT_CONFIG = {
  editorRatio: 0.36,
  leftPaddingRatio: 0.07,
  rightPaddingRatio: 0.05,
  centerRatio: 0.35,
  preferredZoom: 1.2,
} as const;

export function useLandingViewportAdjustment(
  blockMountId: string,
  isOpen: boolean
) {
  const { setCenter, getNode, getNodes } = useReactFlow();

  useEffect(() => {
    if (!isOpen) return;

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

      const layoutConfig = LANDING_LAYOUT_CONFIG;
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
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, blockMountId, getNode, getNodes, setCenter]);
}
