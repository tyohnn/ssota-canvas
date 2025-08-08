import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  PageBlockType,
  // DynamicPageDefinition,
  // DynamicPageSelector,
} from "@/domains/workflow-canvas/policy";

/**
 * 🎯 COMPONENT SEARCH HOOK
 * ========================
 *
 * 📋 훅 역할:
 * - 워크스페이스 컴포넌트 검색 및 필터링 관리
 * - 실시간 검색 및 추천 기능 제공
 * - 검색 성능 최적화 및 디바운싱
 *
 * 🔧 주요 기능:
 * - 텍스트 기반 실시간 검색
 * - 타입/카테고리별 필터링
 * - 컨텍스트 기반 추천
 * - 검색 기록 및 최근 사용 관리
 *
 * 📦 반환값:
 * - 검색 메서드, 필터링, 추천, 상태 관리
 */

export interface ComponentSearchState {
  // 검색 쿼리 및 필터
  query: string;
  filters: any;

  // 검색 결과
  searchResults: any | null;
  recommendations: any[];
  recentComponents: any[];

  // UI 상태
  isSearching: boolean;
  isLoadingRecommendations: boolean;
  hasSearched: boolean;

  // 미리보기
  previewComponent?: any;

  // 에러 상태
  error?: string;
}

export interface ComponentSearchActions {
  // 검색
  search: (query: string, additionalFilters?: Partial<any>) => Promise<any>;
  clearSearch: () => void;

  // 필터링
  setFilters: (filters: Partial<any>) => void;
  addFilter: (key: keyof any, value: any) => void;
  removeFilter: (key: keyof any) => void;
  clearFilters: () => void;

  // 추천
  loadRecommendations: (
    canvasType?: PageBlockType,
    maxCount?: number
  ) => Promise<any[]>;
  refreshRecommendations: () => Promise<void>;

  // 최근 사용
  loadRecentComponents: () => Promise<any[]>;
  markComponentAsUsed: (componentId: string) => void;

  // 미리보기
  showPreview: (component: any) => void;
  clearPreview: () => void;

  // 상태 관리
  clearError: () => void;
  reset: () => void;
}

export type UseComponentSearchReturn = ComponentSearchState &
  ComponentSearchActions;

/**
 * 컴포넌트 검색 및 추천을 위한 React 훅
 * 워크스페이스의 기존 컴포넌트 발견 및 선택 지원
 */
export function useComponentSearch(
  workspaceId: string,
  canvasType?: PageBlockType
): UseComponentSearchReturn {
  // 검색 엔진 및 추천 시스템 인스턴스
  const selector = useMemo(
    () => null as any, // new DynamicComponentSelector(workspaceId),
    [workspaceId]
  );

  const recommendationEngine = useMemo(
    () => null as any, // new ComponentRecommendationEngine(selector),
    [selector]
  );

  // 상태 관리
  const [state, setState] = useState<ComponentSearchState>({
    query: "",
    filters: {},
    searchResults: null,
    recommendations: [],
    recentComponents: [],
    isSearching: false,
    isLoadingRecommendations: false,
    hasSearched: false,
  });

  // 디바운싱을 위한 타이머
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const SEARCH_DEBOUNCE_MS = 300;

  // 검색 함수 (디바운싱 적용)
  const search = useCallback(
    async (
      query: string,
      additionalFilters: Partial<any> = {}
    ): Promise<any> => {
      // 이전 검색 취소
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // 쿼리 즉시 업데이트 (UI 반응성)
      setState((prev) => ({
        ...prev,
        query,
        error: undefined,
      }));

      return new Promise((resolve, reject) => {
        searchTimeoutRef.current = setTimeout(async () => {
          setState((prev) => ({ ...prev, isSearching: true }));

          try {
            const combinedFilters: any = {
              ...state.filters,
              ...additionalFilters,
              searchQuery: query,
            };

            const results = await selector.searchComponents(
              canvasType || PageBlockType.TASK,
              combinedFilters,
              true // includeCreateNew
            );

            setState((prev) => ({
              ...prev,
              isSearching: false,
              hasSearched: true,
              searchResults: results,
              filters: combinedFilters,
            }));

            resolve(results);
          } catch (error) {
            setState((prev) => ({
              ...prev,
              isSearching: false,
              error: error instanceof Error ? error.message : "Search failed",
            }));
            reject(error);
          }
        }, SEARCH_DEBOUNCE_MS);
      });
    },
    [selector, state.filters, canvasType]
  );

  // 검색 초기화
  const clearSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setState((prev) => ({
      ...prev,
      query: "",
      searchResults: null,
      hasSearched: false,
    }));
  }, []);

  // 필터 설정
  const setFilters = useCallback(
    (filters: Partial<any>) => {
      setState((prev) => ({
        ...prev,
        filters: { ...prev.filters, ...filters },
      }));

      // 검색이 진행된 상태라면 필터 변경시 재검색
      if (state.hasSearched) {
        search(state.query, filters);
      }
    },
    [state.hasSearched, state.query, search]
  );

  // 필터 추가
  const addFilter = useCallback(
    (key: keyof any, value: any) => {
      setFilters({ [key]: value });
    },
    [setFilters]
  );

  // 필터 제거
  const removeFilter = useCallback((key: keyof any) => {
    setState((prev) => {
      const newFilters = { ...prev.filters };
      delete newFilters[key];
      return { ...prev, filters: newFilters };
    });
  }, []);

  // 필터 전체 초기화
  const clearFilters = useCallback(() => {
    setState((prev) => ({ ...prev, filters: {} }));
  }, []);

  // 추천 컴포넌트 로드
  const loadRecommendations = useCallback(
    async (
      targetCanvasType?: PageBlockType,
      maxCount: number = 5
    ): Promise<any[]> => {
      setState((prev) => ({
        ...prev,
        isLoadingRecommendations: true,
        error: undefined,
      }));

      try {
        const recommendations = await recommendationEngine.getRecommendations(
          targetCanvasType || canvasType || PageBlockType.TASK,
          [], // currentNodes - 실제 구현에서는 현재 캔버스 노드들 전달
          maxCount
        );

        setState((prev) => ({
          ...prev,
          isLoadingRecommendations: false,
          recommendations,
        }));

        return recommendations;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoadingRecommendations: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to load recommendations",
        }));
        throw error;
      }
    },
    [recommendationEngine, canvasType]
  );

  // 추천 새로고침
  const refreshRecommendations = useCallback(async () => {
    await loadRecommendations();
  }, [loadRecommendations]);

  // 최근 사용 컴포넌트 로드
  const loadRecentComponents = useCallback(async (): Promise<any[]> => {
    try {
      const recentComponents = await selector.getReusableComponents();

      setState((prev) => ({
        ...prev,
        recentComponents: recentComponents.slice(0, 10), // 최근 10개만
      }));

      return recentComponents;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to load recent components",
      }));
      throw error;
    }
  }, [selector]);

  // 컴포넌트 사용 기록
  const markComponentAsUsed = useCallback((componentId: string) => {
    // TODO: 실제 구현에서는 서버액션을 통해 사용 기록 업데이트
    console.log(`Component ${componentId} marked as used`);

    // 로컬 상태에서 최근 사용 목록 업데이트
    setState((prev) => {
      const component = prev.searchResults?.components.find(
        (c: any) => c.id === componentId
      );
      if (component) {
        const updatedRecent = [
          component,
          ...prev.recentComponents.filter((c) => c.id !== componentId),
        ].slice(0, 10);

        return { ...prev, recentComponents: updatedRecent };
      }
      return prev;
    });
  }, []);

  // 컴포넌트 미리보기
  const showPreview = useCallback((component: any) => {
    const preview = component; // anyGenerator.generatePreview(component);
    setState((prev) => ({ ...prev, previewComponent: preview }));
  }, []);

  // 미리보기 초기화
  const clearPreview = useCallback(() => {
    setState((prev) => ({ ...prev, previewComponent: undefined }));
  }, []);

  // 에러 초기화
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: undefined }));
  }, []);

  // 상태 초기화
  const reset = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setState({
      query: "",
      filters: {},
      searchResults: null,
      recommendations: [],
      recentComponents: [],
      isSearching: false,
      isLoadingRecommendations: false,
      hasSearched: false,
    });
  }, []);

  // 초기 추천 로드
  useEffect(() => {
    if (canvasType) {
      loadRecommendations(canvasType);
      loadRecentComponents();
    }
  }, [canvasType, loadRecommendations, loadRecentComponents]);

  // 컴포넌트 언마운트시 타이머 정리
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    // 상태
    ...state,

    // 액션
    search,
    clearSearch,
    setFilters,
    addFilter,
    removeFilter,
    clearFilters,
    loadRecommendations,
    refreshRecommendations,
    loadRecentComponents,
    markComponentAsUsed,
    showPreview,
    clearPreview,
    clearError,
    reset,
  };
}

/**
 * 사용 예시:
 *
 * ```typescript
 * function ComponentSearchPanel() {
 *   const search = useComponentSearch('workspace-123', PageBlockType.TASK);
 *
 *   const handleSearch = (query: string) => {
 *     search.search(query);
 *   };
 *
 *   const handleFilterByType = (nodeType: string) => {
 *     search.addFilter('nodeTypes', [nodeType]);
 *   };
 *
 *   return (
 *     <div>
 *       <input
 *         value={search.query}
 *         onChange={(e) => handleSearch(e.target.value)}
 *         placeholder="Search components..."
 *       />
 *
 *       <div>
 *         <button onClick={() => handleFilterByType('artifact_template')}>
 *           Templates
 *         </button>
 *         <button onClick={() => handleFilterByType('data')}>
 *           Data
 *         </button>
 *       </div>
 *
 *       {search.isSearching && <p>Searching...</p>}
 *
 *       {search.searchResults && (
 *         <div>
 *           <h3>Results ({search.searchResults.totalCount})</h3>
 *           {search.searchResults.components.map(component => (
 *             <div
 *               key={component.id}
 *               onMouseEnter={() => search.previewComponent(component)}
 *               onClick={() => search.markComponentAsUsed(component.id)}
 *             >
 *               {component.name}
 *             </div>
 *           ))}
 *         </div>
 *       )}
 *
 *       {search.recommendations.length > 0 && (
 *         <div>
 *           <h3>Recommended</h3>
 *           {search.recommendations.map(rec => (
 *             <div key={rec.id}>{rec.name}</div>
 *           ))}
 *         </div>
 *       )}
 *
 *       {search.error && <p>Error: {search.error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
