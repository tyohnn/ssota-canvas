/**
 * Visual Summary Action Business Hook
 * 
 * 도메인 훅을 조합하여 컴포넌트 특화 비즈니스 로직 제공
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useVisualSummaryContext } from '@/domains/ai-visual-summary/frontend/contexts/visual-summary-context';
import {
  useAvailableSummaryLanguages,
  useProcessVideoSummary,
} from '@/domains/youtube-app-space/frontend/hooks/summary';
import type { VisualTemplate } from '@/domains/ai-visual-summary/shared/types/template.types';
import type { QueueTodo } from '@workspace/ui/components/ai-elements/queue';

export interface VisualSummaryActionBusinessReturn {
  // Video Summary
  videoSummary: { summary: string } | null | undefined;
  isSummaryLoading: boolean;
  summaryError: string | null;

  // Visual Summary
  isGenerating: boolean;
  visualSummaryError: Error | null;
  messages: any[];
  todos: QueueTodo[];

  // 비즈니스 로직 (검증 및 Visual Summary 생성만 수행, UI 상태 업데이트는 메인 훅에서 처리)
  // returns true if generation was started (so UI can switch to progress phase)
  handleTemplateSelect: (template: VisualTemplate) => boolean;
}

interface UseVisualSummaryActionBusinessProps {
  pageId: string;
  blockId: string;
  sourceBlockPosition: { x: number; y: number };
  sourceBlockSize: { width: number; height: number };
  youtubeId: string | undefined;
  selectedLanguage: string;
  readonly: boolean;
  publishToken?: string;
  sourceTitle?: string;
  sourceChannelName?: string;
}

/**
 * Visual Summary Action 비즈니스 훅
 * 
 * 도메인 훅을 조합하여 컴포넌트 특화 비즈니스 로직 제공
 */
export function useVisualSummaryActionBusiness(
  props: UseVisualSummaryActionBusinessProps
): VisualSummaryActionBusinessReturn {
  const {
    pageId,
    blockId,
    sourceBlockPosition,
    sourceBlockSize,
    youtubeId,
    selectedLanguage,
    readonly,
    publishToken,
    sourceTitle,
    sourceChannelName,
  } = props;

  // 추출된 요약 언어 목록 (Summary 섹션과 동일한 소스)
  const {
    languages: availableSummaryLanguages,
    isLoading: isLoadingLanguages,
  } = useAvailableSummaryLanguages({
    blockId,
    youtubeId: youtubeId || '',
    readonly,
    publishToken: readonly ? publishToken : undefined,
  });

  // 요청할 언어: 추출된 언어가 있으면 첫 번째 사용, 없으면 selectedLanguage (UI 기본값)
  const languageToFetch = useMemo(() => {
    if (availableSummaryLanguages.length > 0 && availableSummaryLanguages[0]) {
      return availableSummaryLanguages[0];
    }
    return selectedLanguage;
  }, [availableSummaryLanguages, selectedLanguage]);

  const hasAnySummary = availableSummaryLanguages.length > 0;

  // Video Summary 가져오기 (추출된 언어 중 하나로 요청)
  const {
    summary: videoSummary,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useProcessVideoSummary({
    blockId,
    youtubeId: youtubeId || '',
    language: languageToFetch,
    readonly,
    publishToken: readonly ? publishToken : undefined,
    enabled: !!youtubeId && hasAnySummary,
  });

  // Visual Summary Context 사용
  const {
    generateVisualSummary: generateVisualSummaryFromContext,
    isGenerating,
    error: visualSummaryError,
    messages,
    todos,
  } = useVisualSummaryContext();

  // 템플릿 선택 핸들러 (비즈니스 로직만 수행)
  // UI 상태 업데이트는 메인 훅에서 처리. returns true if generation was started.
  const handleTemplateSelect = useCallback(
    (template: VisualTemplate): boolean => {
      // 검증: Video Summary 확인
      if (!videoSummary?.summary) {
        console.warn(
          '[VisualSummaryAction] No video summary available. Please extract summary first.'
        );
        return false;
      }

      // 검증: YouTube ID 확인
      if (!youtubeId) {
        console.warn('[VisualSummaryAction] YouTube ID not available');
        return false;
      }

      // Visual Summary 생성 시작 (Context의 generateVisualSummary 사용)
      generateVisualSummaryFromContext({
        summary: videoSummary.summary,
        template,
        sourceBlockId: blockId,
        sourceBlockPosition,
        sourceBlockSize,
        sourceTitle,
        sourceChannelName,
      });
      return true;
    },
    [videoSummary, youtubeId, generateVisualSummaryFromContext, blockId, sourceBlockPosition, sourceBlockSize, sourceTitle, sourceChannelName]
  );

  return {
    // Video Summary
    videoSummary,
    isSummaryLoading: isSummaryLoading || (isLoadingLanguages && availableSummaryLanguages.length === 0),
    summaryError: summaryError || null,

    // Visual Summary
    isGenerating,
    visualSummaryError,
    messages,
    todos,

    // 비즈니스 로직
    handleTemplateSelect,
  };
}
