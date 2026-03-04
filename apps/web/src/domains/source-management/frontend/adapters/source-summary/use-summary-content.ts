/**
 * useSummaryContent
 *
 * 역할: "선택된 언어의 요약 내용은?"
 *
 * - source_summaries에서 selectedLanguage에 해당하는 요약 조회 → currentSummary, isLoading, error
 * - isAlreadyExtracted일 때만 조회 (추출 안 된 언어는 API 호출 안 함)
 */

'use client';

import { useSourceSummary } from '@/domains/source-management/frontend/hooks';

import type { SummaryContentDisplay } from './types';

/** API DTO → UI 표시용 { summary, keywords } 변환 */
function sourceSummaryToDisplay(
  dto: {
    summary: string;
    keywords: string[];
    language: string;
    updatedAt: Date | string;
    sourceId: string;
  }
): SummaryContentDisplay {
  return {
    summary: dto.summary,
    keywords: dto.keywords ?? [],
  };
}

export interface UseSummaryContentParams {
  blockSlug: string;
  sourceId: string | undefined;
  selectedLanguage: string;
  /** 요약 조회 활성화 여부 (이미 추출된 언어이거나 완료된 job의 언어일 때 true) */
  isAlreadyExtracted: boolean;
  /** Block 기반 조회 시 필요. Canvas/Drive deps에서 주입 */
  workspaceId: string;
  readonly?: boolean;
  publishToken?: string;
}

export interface UseSummaryContentResult {
  currentSummary: SummaryContentDisplay | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useSummaryContent({
  blockSlug,
  sourceId,
  selectedLanguage,
  isAlreadyExtracted,
  workspaceId,
  readonly = false,
  publishToken,
}: UseSummaryContentParams): UseSummaryContentResult {
  // 1. source_summaries 조회 (readonly면 publish page API 사용)
  const sourceSummary = useSourceSummary({
    blockId: blockSlug,
    language: selectedLanguage,
    sourceId,
    publishToken,
    readonly,
    workspaceId,
    isAlreadyExtracted,
  });

  // 3. DTO → Display 변환 (sourceId 없으면 undefined)
  const currentSummary: SummaryContentDisplay | undefined =
    sourceId && sourceSummary.summary
      ? sourceSummaryToDisplay(sourceSummary.summary)
      : undefined;

  return {
    currentSummary,
    isLoading: sourceSummary.isLoading,
    error: sourceSummary.error,
    refetch: sourceSummary.refetch,
  };
}
