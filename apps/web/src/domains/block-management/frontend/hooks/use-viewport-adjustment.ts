/**
 * Viewport Adjustment Hook
 *
 * 에디터 패널 열림 시 블록을 적절한 위치로 이동.
 */

'use client';

import { useEffect, useMemo, useRef } from 'react';

import { useReactFlow } from '@xyflow/react';

import { useSidebar } from '@workspace/ui/components/ui/sidebar';

import { useCanvasLayoutOptional } from '@/app/(dashboard)/contexts/canvas-layout-context';
import { getAbsoluteNodePosition } from '@/domains/canvas-management/frontend/hooks/group/utils/get-absolute-node-position';

export interface LayoutConfig {
  editorRatio: number;
  leftPaddingRatio: number;
  rightPaddingRatio: number;
  centerRatio: number;
  preferredZoom: number;
}

const LAYOUT_TRANSITION_DURATION = 350;

export function useViewportAdjustment(blockMountId: string, isOpen: boolean) {
  const { setCenter, getNode, getNodes } = useReactFlow();
  const { state: sidebarState } = useSidebar();
  const canvasLayout = useCanvasLayoutOptional();
  const rightSidebarOpen = canvasLayout?.rightSidebarOpen ?? false;
  const prevSidebarStateRef = useRef(sidebarState);
  const prevRightSidebarOpenRef = useRef(rightSidebarOpen);

  const layoutConfig = useMemo<LayoutConfig>(() => {
    const leftCollapsed = sidebarState === 'collapsed';
    const rightOpen = rightSidebarOpen;

    if (leftCollapsed && !rightOpen) {
      return {
        editorRatio: 0.37,
        leftPaddingRatio: 0.03,
        rightPaddingRatio: 0.1,
        centerRatio: 0.45,
        preferredZoom: 2.0,
      };
    }
    if (leftCollapsed && rightOpen) {
      return {
        editorRatio: 0.36,
        leftPaddingRatio: 0.03,
        rightPaddingRatio: 0.08,
        centerRatio: 0.42,
        preferredZoom: 1.9,
      };
    }
    if (!leftCollapsed && rightOpen) {
      return {
        editorRatio: 0.36,
        leftPaddingRatio: 0.07,
        rightPaddingRatio: 0.06,
        centerRatio: 0.34,
        preferredZoom: 1.7,
      };
    }

    return {
      editorRatio: 0.36,
      leftPaddingRatio: 0.07,
      rightPaddingRatio: 0.05,
      centerRatio: 0.35,
      preferredZoom: 1.7,
    };
  }, [sidebarState, rightSidebarOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const sidebarStateChanged = prevSidebarStateRef.current !== sidebarState;
    const rightSidebarChanged =
      prevRightSidebarOpenRef.current !== rightSidebarOpen;
    prevSidebarStateRef.current = sidebarState;
    prevRightSidebarOpenRef.current = rightSidebarOpen;

    const layoutChanged = sidebarStateChanged || rightSidebarChanged;
    const delay = layoutChanged ? LAYOUT_TRANSITION_DURATION : 0;

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

      const editorPanelWidth = canvasWidth * layoutConfig.editorRatio;
      const leftPadding = canvasWidth * layoutConfig.leftPaddingRatio;
      const rightPadding = canvasWidth * layoutConfig.rightPaddingRatio;

      const availableWidth =
        canvasWidth - leftPadding - rightPadding - editorPanelWidth;

      const nodeWidth = node.width || 200;
      const nodeHeight = node.height || 100;

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
    }, delay);

    return () => clearTimeout(timer);
  }, [
    isOpen,
    sidebarState,
    rightSidebarOpen,
    blockMountId,
    getNode,
    getNodes,
    setCenter,
    layoutConfig,
  ]);
}
