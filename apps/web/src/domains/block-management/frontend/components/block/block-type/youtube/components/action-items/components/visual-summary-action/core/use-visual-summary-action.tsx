/**
 * Visual Summary Action Main Hook
 * 
 * 의존성 주입 및 UI/비즈니스 훅 오케스트레이션
 */

'use client';

import React, { useMemo, useCallback } from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useCanvasMetadata } from '@/domains/canvas-management/frontend/contexts/canvas-metadata-context';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';
import { useAIActionContext } from '@/domains/ai-actions/frontend/contexts/ai-action-context';
import {
  type YoutubeBlockProperties,
  YoutubeBlockPropertiesVO,
} from '@/domains/block-management/shared/value-objects/block-properties';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { VisualTemplate } from '@/domains/ai-actions/shared/types/template.types';
import { getAllTemplates } from '@/domains/ai-actions/backend/prompt/visual-summary';
import { useVisualSummaryActionUI } from './use-visual-summary-action.ui';
import { useVisualSummaryActionBusiness } from './use-visual-summary-action.business';
import type { VisualSummaryActionUIReturn } from './use-visual-summary-action.ui';
import type { VisualSummaryActionBusinessReturn } from './use-visual-summary-action.business';

export interface VisualSummaryActionReturn
  extends VisualSummaryActionUIReturn,
  VisualSummaryActionBusinessReturn {
  // UI 계산 (메인 훅에서 계산)
  getIcon: () => React.ReactNode;
  isLoading: boolean;
  isSuccess: boolean;
  isDisabled: boolean;

  // 추가 통합 값
  templates: any[];
  readonly: boolean;
}

interface UseVisualSummaryActionProps {
  blockId: string;
  blockData: BlockNodeData;
}

/**
 * Visual Summary Action 메인 훅
 * 
 * 1. 외부 의존성 수집 (React Flow, Context 등)
 * 2. UI/비즈니스 훅 오케스트레이션
 * 3. 통합된 Context Value 반환
 */
export function useVisualSummaryAction(
  props: UseVisualSummaryActionProps
): VisualSummaryActionReturn {
  const { blockId, blockData } = props;

  // ============================================================================
  // 1. Gather External Dependencies (The only place where external hooks are called)
  // ============================================================================

  // Framework Dependencies
  const { getNode } = useReactFlow();

  // Domain Dependencies
  const { pageId, workspaceId } = useCanvasMetadata();
  const { readonly, publishToken } = useCanvasReadOnly();
  const {
    isGenerating: isGeneratingFromContext,
    currentRunSourceBlockId,
  } = useAIActionContext();

  // ============================================================================
  // 2. Extract Data from Dependencies
  // ============================================================================

  // YouTube 블록 속성 파싱
  const properties = useMemo(() => {
    try {
      return YoutubeBlockPropertiesVO.fromJSON(blockData.properties as YoutubeBlockProperties);
    } catch (error) {
      console.warn('[VisualSummaryAction] Failed to parse YouTube properties:', error);
      return YoutubeBlockPropertiesVO.createDefault();
    }
  }, [blockData.properties]);

  const youtubeId = properties.youtubeId;

  // React Flow 노드에서 position/size 가져오기
  const node = getNode(blockData.blockMountId);
  const position = node?.position || { x: 0, y: 0 };
  const size = {
    width: typeof node?.width === 'number' ? node.width : 410,
    height: typeof node?.height === 'number' ? node.height : 288,
  };

  // ============================================================================
  // 3. UI Hook (순수 UI 상태만 관리)
  // ============================================================================

  const uiState = useVisualSummaryActionUI();

  // ============================================================================
  // 4. Business Hook (도메인 훅 조합)
  // ============================================================================

  const sourceId = blockData?.sourceId;

  const business = useVisualSummaryActionBusiness({
    pageId,
    workspaceId,
    blockId,
    sourceBlockPosition: position,
    sourceBlockSize: size,
    youtubeId,
    sourceId,
    selectedLanguage: uiState.selectedLanguage,
    readonly,
    publishToken,
    sourceTitle: properties.youtubeTitle,
    sourceChannelName: properties.channelName,
  });

  // ============================================================================
  // 4-1. 오케스트레이션: handleTemplateSelect 래핑 (UI 상태 업데이트 추가)
  // ============================================================================

  const handleTemplateSelect = useCallback(
    (template: VisualTemplate): boolean => {
      // 비즈니스 로직 실행 (검증 및 Visual Summary 생성)
      const started = business.handleTemplateSelect(template);
      // 템플릿 선택 ID 저장 (UI 표시용)
      if (started) {
        uiState.setSelectedTemplateId(template.id);
      }
      return started;
    },
    [business.handleTemplateSelect, uiState.setSelectedTemplateId]
  );

  // ============================================================================
  // 5. UI 계산 (메인 훅에서 비즈니스 데이터 기반으로 계산)
  // ============================================================================

  // 이 블록이 실행을 시작했을 때만 로딩/완료 아이콘 표시 (다른 블록은 기본 아이콘)
  const isThisBlockRunning = currentRunSourceBlockId === blockId;
  const isLoading =
    business.isSummaryLoading ||
    (isGeneratingFromContext && isThisBlockRunning);
  const isSuccess =
    !isLoading &&
    isThisBlockRunning &&
    !business.visualSummaryError &&
    business.messages.length > 0;
  const isDisabled = !business.videoSummary?.summary || !youtubeId || isLoading || business.isSummaryLoading;

  const getIcon = useCallback((): React.ReactNode => {
    if (isLoading) {
      return <Loader2 className="animate-spin" />;
    }
    if (isSuccess) {
      return <Check className="text-green-600" />;
    }
    return <Sparkles />;
  }, [isLoading, isSuccess]);

  // ============================================================================
  // 6. Return Combined Context Value
  // ============================================================================

  // 템플릿 목록 (정적 데이터)
  const templates = getAllTemplates();

  return {
    // UI 상태 (UI 훅에서 제공)
    ...uiState,

    // 비즈니스 데이터 (handleTemplateSelect는 래핑된 버전 사용)
    ...business,
    handleTemplateSelect,

    // UI 계산 (메인 훅에서 계산)
    getIcon,
    isLoading,
    isSuccess,
    isDisabled,

    // 추가 값
    templates,
    readonly,
  };
}
