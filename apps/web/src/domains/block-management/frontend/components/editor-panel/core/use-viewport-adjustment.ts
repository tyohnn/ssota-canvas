/**
 * Viewport Adjustment Hook
 *
 * 에디터 패널 열림 시 블록을 적절한 위치로 이동
 */

'use client';

import { useEffect, useMemo, useRef } from 'react';

import { useReactFlow } from '@xyflow/react';

import { useSidebar } from '@workspace/ui/components/ui/sidebar';

import { getAbsoluteNodePosition } from '@/domains/canvas-management/frontend/hooks/group/utils/get-absolute-node-position';

import type { LayoutConfig } from './types';

export function useViewportAdjustment(blockMountId: string, isOpen: boolean) {
  const { setCenter, getNode, getNodes } = useReactFlow();
  const { state: sidebarState } = useSidebar();
  const prevSidebarStateRef = useRef(sidebarState);

  // 사이드바 상태별 레이아웃 설정
  const layoutConfig = useMemo<LayoutConfig>(() => {
    if (sidebarState === 'collapsed') {
      return {
        editorRatio: 0.37,
        leftPaddingRatio: 0.03,
        rightPaddingRatio: 0.1,
        centerRatio: 0.45,
        preferredZoom: 2.0,
      };
    }

    return {
      editorRatio: 0.36,
      leftPaddingRatio: 0.07,
      rightPaddingRatio: 0.05,
      centerRatio: 0.35,
      preferredZoom: 1.7,
    };
  }, [sidebarState]);

  // Viewport 조정 (에디터 열림 또는 사이드바 상태 변경 시)
  useEffect(() => {
    if (!isOpen) return;

    // 사이드바 상태가 변경됐는지 확인
    const sidebarStateChanged = prevSidebarStateRef.current !== sidebarState;
    prevSidebarStateRef.current = sidebarState;

    // 사이드바 변경 시에만 transition 대기, 에디터만 열 때는 즉시 실행
    const SIDEBAR_TRANSITION_DURATION = sidebarStateChanged ? 350 : 0;

    const timer = setTimeout(() => {
      const node = getNode(blockMountId);
      if (!node) return;

      const allNodes = getNodes();
      // 그룹 자식이면 상대좌표 → 절대좌표로 변환 후 뷰포트 계산
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
    }, SIDEBAR_TRANSITION_DURATION);

    return () => clearTimeout(timer);
  }, [isOpen, sidebarState, blockMountId, getNode, getNodes, setCenter, layoutConfig]);
}
