/**
 * useSummaryLanguages
 *
 * 역할: "어떤 언어가 있고, 지금 어떤 걸 선택했는가?"
 *
 * - source_summaries에서 사용 가능한 언어 목록 조회 → availableLanguages, selectedLanguage
 * - Job 처리 중이면 job 언어로, 블록 액션에서 Summary 탭 진입 시 initialTabLanguage로 동기화
 */

'use client';

import { useState, useMemo, useEffect } from 'react';

import { useSourceSummaryLanguages } from '@/domains/source-management/frontend/hooks';
import type { SourceJob } from '@/domains/source-management/frontend/hooks';

/**
 * languageStateMap: blockSlug → 마지막 선택 언어 (모듈 레벨 Map)
 *
 * - 존재 이유: 에디터 패널은 블록 전환 시 닫혔다가 열리며 컴포넌트가 언마운트됨. React useState는
 *   초기화되지만 모듈 레벨 Map은 유지되어, 패널 재오픈 시 "이 블록에서 마지막으로 선택한 언어"를 복원
 * - 예: 블록 A Summary 탭에서 한국어 선택 → 다른 블록 클릭 → 블록 A 다시 열기 → 한국어로 복원
 * - 저장: 사용자가 언어 선택 시 / Job 처리 중 job 언어로 동기화 시 / initialTabLanguage 전달 시 (블록 액션 버튼에서 Summary 탭 진입할 때 initialTabLanguage 전달함)
 * - 조회: 마운트 시 initialLanguage 결정, effect 4에서 selectedLanguage 동기화
 */
const languageStateMap = new Map<string, string>();

export interface UseSummaryLanguagesParams {
  blockSlug: string;
  workspaceId: string | undefined;
  sourceId: string | undefined;
  readonly?: boolean;
  publishToken?: string;
  job: SourceJob | null;
  initialJob: SourceJob | null;
  isJobProcessing: boolean;
  /** initialTab.tabOptions.language (Summary 탭 진입 시 언어) */
  initialTabLanguage?: string;
}

export interface UseSummaryLanguagesResult {
  availableLanguages: string[];
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
  isLoadingLanguages: boolean;
  languagesError: unknown;
}

export function useSummaryLanguages({
  blockSlug,
  workspaceId,
  sourceId,
  readonly = false,
  publishToken,
  job,
  initialJob,
  isJobProcessing,
  initialTabLanguage,
}: UseSummaryLanguagesParams): UseSummaryLanguagesResult {
  /**
   * 1. source_summaries 기반 사용 가능 언어 목록 API 조회
   * - block_id 기준으로 추출된 요약 언어 목록 (예: ['en', 'ko'])
   * - readonly(Published) 모드면 publishToken으로 별도 API 사용
   */
  const sourceLanguages = useSourceSummaryLanguages({
    blockId: blockSlug,
    workspaceId,
    sourceId,
    publishToken,
    readonly,
  });

  /** 2. sourceId 없으면 API 미호출 → 빈 배열, 로딩/에러는 비활성화 */
  const availableLanguages = sourceId ? sourceLanguages.languages : [];
  const isLoadingLanguages = !!sourceId && sourceLanguages.isLoading;
  const languagesError = sourceId ? sourceLanguages.error : null;

  /**
   * 3. 초기 선택 언어 (useState 초기값)
   * - 우선순위: languageStateMap 저장값 > API 첫 번째 > 'en'
   * - 패널 재오픈 시 이전 선택 복원 (languageStateMap은 모듈 레벨이라 마운트 후에도 유지)
   */
  const initialLanguage = useMemo(() => {
    const stored = languageStateMap.get(blockSlug);
    if (stored) return stored;
    const first = availableLanguages[0];
    return first ?? 'en';
  }, [blockSlug, availableLanguages]);

  const [selectedLanguage, setSelectedLanguage] =
    useState<string>(initialLanguage);

  /**
   * 4. useSourceSummaryLanguages API 로딩 완료 후 selectedLanguage ↔ languageStateMap 동기화
   * - 저장값 없으면: availableLanguages 첫 번째로 설정 후 Map에 저장
   * - 저장값 있으면: selectedLanguage가 다르면 저장값으로 덮어씀 (다른 탭에서 변경됐을 수 있음)
   */
  useEffect(() => {
    if (isLoadingLanguages) return;
    const stored = languageStateMap.get(blockSlug);
    if (!stored) {
      if (availableLanguages.length > 0) {
        const firstAvailable = availableLanguages[0];
        if (firstAvailable && firstAvailable !== selectedLanguage) {
          setSelectedLanguage(firstAvailable);
          languageStateMap.set(blockSlug, firstAvailable);
        }
      }
    } else if (stored !== selectedLanguage) {
      setSelectedLanguage(stored);
    }
  }, [blockSlug, availableLanguages, isLoadingLanguages, selectedLanguage]);

  /**
   * 5. Job 처리 중일 때 선택 언어를 job 언어로 동기화
   * - job: Realtime 구독으로 받는 최신 job (INSERT/UPDATE 이벤트)
   * - initialJob: 패널 오픈 시 API로 조회한 in-progress job (Realtime 이벤트 오기 전 초기값)
   * - job ?? initialJob: Realtime이 아직 안 왔으면 initialJob 사용 (예: 패널 막 열었을 때)
   */
  useEffect(() => {
    const jobLanguage = job?.language ?? initialJob?.language;
    if (!blockSlug || !jobLanguage) return;
    if (isJobProcessing) {
      languageStateMap.set(blockSlug, jobLanguage);
      setSelectedLanguage(jobLanguage);
    }
  }, [blockSlug, isJobProcessing, job?.language, initialJob?.language]);

  // 6. 블록 액션에서 Summary 탭 진입 시 지정된 initialTabLanguage로 선택
  useEffect(() => {
    if (!blockSlug || !initialTabLanguage) return;
    languageStateMap.set(blockSlug, initialTabLanguage);
    setSelectedLanguage(initialTabLanguage);
  }, [blockSlug, initialTabLanguage]);

  // 7. 언어 선택 시 state + languageStateMap 갱신
  const handleSetSelectedLanguage = (language: string) => {
    setSelectedLanguage(language);
    languageStateMap.set(blockSlug, language);
  };

  return {
    availableLanguages,
    selectedLanguage,
    setSelectedLanguage: handleSetSelectedLanguage,
    isLoadingLanguages,
    languagesError,
  };
}
