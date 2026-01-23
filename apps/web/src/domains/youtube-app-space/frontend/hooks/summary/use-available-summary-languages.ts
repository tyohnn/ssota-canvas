/**
 * 사용 가능한 요약 언어 목록 조회 Hook
 *
 * readonly 모드에 따라 다른 액션 사용:
 * - readonly: false → getAvailableSummaryLangListAction (일반 모드)
 * - readonly: true → getAvailableSummaryLangListForPublishedPageAction (퍼블릭 페이지)
 */

'use client';

import { useQuery } from '@tanstack/react-query';

import {
  getAvailableSummaryLangListAction
} from '../../../actions/summary/get-available-summary-lang.action';
import { getAvailableSummaryLangListForPublishedPageAction } from '../../../actions/summary/get-available-summary-lang-for-published-page.action';

export interface UseAvailableSummaryLanguagesParams {
  blockId: string;
  youtubeId: string;
  readonly: boolean;
  publishToken?: string; // readonly 모드에서만 사용
}

export interface UseAvailableSummaryLanguagesResult {
  languages: string[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * 사용 가능한 요약 언어 목록 조회 Hook
 */
export function useAvailableSummaryLanguages({
  blockId,
  youtubeId,
  readonly,
  publishToken,
}: UseAvailableSummaryLanguagesParams): UseAvailableSummaryLanguagesResult {
  const queryKey = readonly
    ? ['available-summary-languages-published', blockId, youtubeId, publishToken]
    : ['available-summary-languages', blockId, youtubeId];

  const enabled = !!blockId && !!youtubeId && (readonly ? !!publishToken : true);
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (readonly) {
        // 퍼블릭 페이지 모드
        if (!publishToken) {
          throw new Error('Publish token is required for published page mode');
        }

        const result = await getAvailableSummaryLangListForPublishedPageAction({
          publishToken,
          blockId,
          youtubeId,
        });

        if (result.success) {
          return result.data.languages;
        }

        throw new Error(result.error);
      } else {
        // 일반 모드
        const result = await getAvailableSummaryLangListAction({
          blockId,
          youtubeId,
        });

        if (result.success) {
          return result.data.languages;
        }

        throw new Error(result.error);
      }
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });

  // 캐시가 있으면 로딩 상태를 false로 설정
  // isLoading은 쿼리가 처음 실행될 때만 true이고, 캐시가 있으면 false가 되어야 함
  // 하지만 탭을 변경할 때마다 컴포넌트가 마운트되면서 쿼리가 다시 실행될 수 있으므로
  // 데이터가 있으면 로딩 상태를 false로 설정
  const isLoadingState = isLoading && !data;

  return {
    languages: data || [],
    isLoading: isLoadingState,
    error: error?.message || null,
    refetch,
  };
}