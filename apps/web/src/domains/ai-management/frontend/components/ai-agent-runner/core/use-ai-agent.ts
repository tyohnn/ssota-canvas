'use client';

import { useCallback, useEffect, useMemo } from 'react';

import { useReactFlow } from '@xyflow/react';

import {
  CanvasMetadata,
  useCanvasMetadata,
} from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasSelection } from '@/domains/canvas-management/frontend/hooks/use-canvas-selection';

import { ClientContext } from './types';
import {
  AIAgentBusinessLogic,
  useAIAgentBusiness,
} from './use-ai-agent.business';
import { useAIAgentUI } from './use-ai-agent.ui';

/**
 * useAIAgent Props
 */
export interface UseAIAgentProps {
  canvasMetadataOverride?: CanvasMetadata;
  businessLogic?: AIAgentBusinessLogic; // Optional injection
}

/**
 * useAIAgent
 * UI State + Business Logic 통합
 *
 * Optional Injection 지원:
 * - Production: 기본 비즈니스 로직 사용
 * - Test/Mock: 커스텀 로직 주입 가능
 * - NoCode: UI 로직만 분리하여 사용
 */
export function useAIAgent({
  canvasMetadataOverride,
  businessLogic,
}: UseAIAgentProps) {
  const canvasMetadata = useCanvasMetadata(canvasMetadataOverride);
  const { pageId, workspaceId, orgId } = canvasMetadata;

  // UI State (디자이너 영역)
  const uiState = useAIAgentUI();

  // Business Logic (엔지니어 영역)
  const defaultBusiness = useAIAgentBusiness({ pageId, workspaceId, orgId });
  const business = businessLogic ?? defaultBusiness;

  // Agent 상태 계산
  const agentState = useMemo(
    () => ({
      isRunning: business.isAgentRunning,
      currentStep: 0, // TODO: 실제 단계 추적
      maxSteps: 10,
      error: business.error?.message || null,
    }),
    [business.isAgentRunning, business.error]
  );

  // Agent 완료 시 자동 포커싱
  useEffect(() => {
    if (!business.isAgentRunning && business.messages.length > 0) {
      uiState.focusConversation();
      uiState.autoUnfocus();
    }
  }, [business.isAgentRunning, business.messages.length]);

  // Canvas 상태 접근
  const { getSelectedBlocks } = useCanvasSelection();
  const { getNodes, getViewport } = useReactFlow();

  /**
   * 메시지 전송 (컨텍스트 자동 수집)
   */
  const sendMessage = useCallback(
    (text: string) => {
      // Client Context 수집 (Canvas Store에서 실제 데이터)
      const selectedBlockIds = getSelectedBlocks();
      const allNodes = getNodes();
      const viewport = getViewport();

      // 기준점 계산: 선택된 블럭이 있으면 그 중심, 없으면 viewport 중앙
      let referenceCenterX: number;
      let referenceCenterY: number;

      if (selectedBlockIds.length > 0) {
        // 선택된 블럭들의 중심점 계산
        const selectedNodes = allNodes.filter(node =>
          selectedBlockIds.includes(node.id)
        );
        const sumX = selectedNodes.reduce(
          (sum, node) => sum + node.position.x,
          0
        );
        const sumY = selectedNodes.reduce(
          (sum, node) => sum + node.position.y,
          0
        );
        referenceCenterX = sumX / selectedNodes.length;
        referenceCenterY = sumY / selectedNodes.length;
      } else {
        // Viewport 중앙 좌표 계산
        const canvasWidth =
          typeof window !== 'undefined' ? window.innerWidth : 1920;
        const canvasHeight =
          typeof window !== 'undefined' ? window.innerHeight : 1080;
        referenceCenterX = (canvasWidth / 2 - viewport.x) / viewport.zoom;
        referenceCenterY = (canvasHeight / 2 - viewport.y) / viewport.zoom;
      }

      // Zoom 레벨이 75% (0.75) 이상일 때만 nearby 블럭 계산
      let visibleBlockIds: string[] = [];

      if (viewport.zoom >= 0.75) {
        // 근처 블럭 필터링 (기준점 기준 1000px 이내)
        const NEARBY_DISTANCE_THRESHOLD = 1000;
        const MAX_NEARBY_BLOCKS = 10;

        // 모든 블록의 거리 계산 및 정렬
        const nodesWithDistance = allNodes
          .map(node => {
            const dx = node.position.x - referenceCenterX;
            const dy = node.position.y - referenceCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return { node, distance };
          })
          .filter(item => item.distance <= NEARBY_DISTANCE_THRESHOLD)
          .sort((a, b) => a.distance - b.distance); // 가까운 순으로 정렬

        // 가까운 순으로 최대 10개까지만 선택
        visibleBlockIds = nodesWithDistance
          .slice(0, MAX_NEARBY_BLOCKS)
          .map(item => item.node.id);
      }

      // 최근 수정된 블럭 (향후 구현 가능, 현재는 빈 배열)
      const recentlyModifiedBlockIds: string[] = [];

      const context: ClientContext = {
        pageId,
        workspaceId,
        orgId,
        selectedBlockIds,
        visibleBlockIds,
        recentlyModifiedBlockIds,
      };

      business.sendMessage(text, context);
    },
    [business, getSelectedBlocks, getNodes, getViewport]
  );

  return {
    // Agent 상태
    messages: business.messages,
    agentState,

    // UI 상태
    isHovered: uiState.isHovered,
    isFocused: uiState.isFocused,

    // 액션
    sendMessage,
    setHovered: uiState.setHovered,
    focusConversation: uiState.focusConversation,
  };
}
