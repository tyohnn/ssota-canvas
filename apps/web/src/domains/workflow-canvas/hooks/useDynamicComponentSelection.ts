import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { PageBlockType } from "@/domains/workflow-canvas/policy";

/**
 * 🎯 DYNAMIC PAGE SELECTION HOOK
 * ===================================
 *
 * 📋 훅 역할:
 * - 태스크 캔버스의 hover → list → select 플로우 관리
 * - 동적 페이지 선택 UI 상태 및 인터랙션 처리
 * - 기존 페이지 + "새로 생성" 옵션 통합 관리
 *
 * 🔧 주요 기능:
 * - 카테고리 호버시 페이지 옵션 로드
 * - 페이지 선택 및 미리보기 제공
 * - 반응형 UI 지원 (모바일 대응)
 * - 선택 플로우 상태 관리
 *
 * 📦 반환값:
 * - 선택 플로우 메서드, UI 상태, 옵션 관리
 */

export interface DynamicPageSelectionState {
  // 현재 선택 플로우 상태
  currentStep: "idle" | "hovering" | "listing" | "selecting" | "confirming";

  // 현재 카테고리 및 옵션
  activeCategory?: string;
  availableOptions: any[];

  // 선택된 옵션
  selectedOption?: any;
  selectionPosition?: { x: number; y: number };

  // UI 상태
  isLoading: boolean;
  isVisible: boolean;
  error?: string;

  // 모바일/접근성 지원
  isMobileMode: boolean;
  keyboardNavigationIndex: number;
}

export interface DynamicPageSelectionActions {
  // 선택 플로우 시작/종료
  startCategoryHover: (
    categoryId: string,
    position: { x: number; y: number }
  ) => Promise<void>;
  endCategoryHover: () => void;

  // 옵션 선택
  selectOption: (
    option: any,
    position: { x: number; y: number }
  ) => Promise<any>;
  previewOption: (option: any) => void;
  clearPreview: () => void;

  // 키보드 네비게이션
  navigateUp: () => void;
  navigateDown: () => void;
  selectCurrent: () => Promise<any | null>;

  // 플로우 제어
  cancelSelection: () => void;
  confirmSelection: () => Promise<any | null>;

  // 상태 관리
  setMobileMode: (enabled: boolean) => void;
  clearError: () => void;
  reset: () => void;
}

export type UseDynamicPageSelectionReturn = DynamicPageSelectionState &
  DynamicPageSelectionActions;

/**
 * 동적 페이지 선택 플로우를 위한 React 훅
 * 태스크 캔버스의 hover → list → select 인터랙션 관리
 */
export function useDynamicPageSelection(
  workspaceId: string,
  canvasType: PageBlockType = PageBlockType.TASK
): UseDynamicPageSelectionReturn {
  // 선택 플로우 및 UI 핸들러 인스턴스 (임시로 비활성화)
  const selectionFlow = useMemo(
    () => null as any, // new DynamicPageSelectionFlow(workspaceId),
    [workspaceId]
  );

  const uiHandler = useMemo(
    () => null as any, // new DynamicPageUIHandler(workspaceId),
    [workspaceId]
  );

  // UI 상태 관리
  const [state, setState] = useState<DynamicPageSelectionState>({
    currentStep: "idle",
    availableOptions: [],
    isLoading: false,
    isVisible: false,
    isMobileMode: false,
    keyboardNavigationIndex: -1,
  });

  // 호버 타이머 관리 (PC 환경에서 호버 지연)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768 || "ontouchstart" in window;
      setState((prev) => ({ ...prev, isMobileMode: isMobile }));
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 카테고리 호버 시작
  const startCategoryHover = useCallback(
    async (categoryId: string, position: { x: number; y: number }) => {
      // 이전 타이머 취소
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      // 모바일에서는 즉시 시작, PC에서는 지연 후 시작
      const delay = state.isMobileMode ? 0 : 300;

      hoverTimeoutRef.current = setTimeout(async () => {
        setState((prev) => ({
          ...prev,
          currentStep: "hovering",
          activeCategory: categoryId,
          isLoading: true,
          isVisible: true,
          error: undefined,
        }));

        try {
          await uiHandler.onCategoryHover(categoryId);
          const uiState = uiHandler.getUIState();

          setState((prev) => ({
            ...prev,
            currentStep: "listing",
            availableOptions: uiState.availableOptions,
            isLoading: false,
            keyboardNavigationIndex:
              uiState.availableOptions.length > 0 ? 0 : -1,
          }));
        } catch (error) {
          setState((prev) => ({
            ...prev,
            currentStep: "idle",
            isLoading: false,
            isVisible: false,
            error:
              error instanceof Error ? error.message : "Failed to load options",
          }));
        }
      }, delay);
    },
    [uiHandler, state.isMobileMode]
  );

  // 카테고리 호버 종료
  const endCategoryHover = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    // 모바일에서는 호버 종료를 무시 (명시적 선택까지 유지)
    if (state.isMobileMode && state.currentStep !== "idle") {
      return;
    }

    setState((prev) => ({
      ...prev,
      currentStep: "idle",
      activeCategory: undefined,
      availableOptions: [],
      isVisible: false,
      selectedOption: undefined,
      keyboardNavigationIndex: -1,
    }));
  }, [state.isMobileMode, state.currentStep]);

  // 옵션 선택
  const selectOption = useCallback(
    async (option: any, position: { x: number; y: number }): Promise<any> => {
      setState((prev) => ({
        ...prev,
        currentStep: "selecting",
        selectedOption: option,
        selectionPosition: position,
        isLoading: true,
      }));

      try {
        const selection = await selectionFlow.selectOption(option, position);

        setState((prev) => ({
          ...prev,
          currentStep: "confirming",
          isLoading: false,
        }));

        return selection;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          currentStep: "listing",
          isLoading: false,
          error:
            error instanceof Error ? error.message : "Failed to select option",
        }));
        throw error;
      }
    },
    [selectionFlow]
  );

  // 옵션 미리보기
  const previewOption = useCallback((option: any) => {
    setState((prev) => ({
      ...prev,
      selectedOption: option,
    }));
  }, []);

  // 미리보기 초기화
  const clearPreview = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedOption: undefined,
    }));
  }, []);

  // 키보드 네비게이션 - 위로
  const navigateUp = useCallback(() => {
    setState((prev) => ({
      ...prev,
      keyboardNavigationIndex: Math.max(0, prev.keyboardNavigationIndex - 1),
    }));
  }, []);

  // 키보드 네비게이션 - 아래로
  const navigateDown = useCallback(() => {
    setState((prev) => ({
      ...prev,
      keyboardNavigationIndex: Math.min(
        prev.availableOptions.length - 1,
        prev.keyboardNavigationIndex + 1
      ),
    }));
  }, []);

  // 현재 키보드 선택 항목 선택
  const selectCurrent = useCallback(async (): Promise<any | null> => {
    const { keyboardNavigationIndex, availableOptions } = state;

    if (
      keyboardNavigationIndex >= 0 &&
      keyboardNavigationIndex < availableOptions.length
    ) {
      const option = availableOptions[keyboardNavigationIndex];
      if (option) {
        // 기본 위치로 선택 (키보드 네비게이션)
        return await selectOption(option, { x: 0, y: 0 });
      }
    }

    return null;
  }, [state, selectOption]);

  // 선택 취소
  const cancelSelection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      currentStep: "idle",
      activeCategory: undefined,
      availableOptions: [],
      selectedOption: undefined,
      selectionPosition: undefined,
      isVisible: false,
      keyboardNavigationIndex: -1,
    }));
  }, []);

  // 선택 확인
  const confirmSelection = useCallback(async (): Promise<any | null> => {
    const { selectedOption, selectionPosition } = state;

    if (selectedOption) {
      try {
        const selection = await selectionFlow.confirmSelection();

        setState((prev) => ({
          ...prev,
          currentStep: "idle",
          isVisible: false,
          selectedOption: undefined,
          selectionPosition: undefined,
        }));

        return selection;
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to confirm selection",
        }));
        throw error;
      }
    }

    return null;
  }, [state, selectionFlow]);

  // 모바일 모드 설정
  const setMobileMode = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, isMobileMode: enabled }));
  }, []);

  // 에러 초기화
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: undefined }));
  }, []);

  // 상태 초기화
  const reset = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    setState({
      currentStep: "idle",
      availableOptions: [],
      isLoading: false,
      isVisible: false,
      isMobileMode: false,
      keyboardNavigationIndex: -1,
    });
  }, []);

  // 컴포넌트 언마운트시 타이머 정리
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return {
    // 상태
    ...state,

    // 액션
    startCategoryHover,
    endCategoryHover,
    selectOption,
    previewOption,
    clearPreview,
    navigateUp,
    navigateDown,
    selectCurrent,
    cancelSelection,
    confirmSelection,
    setMobileMode,
    clearError,
    reset,
  };
}

/**
 * 사용 예시:
 *
 * ```typescript
 * function DynamicPageSelection() {
 *   const selection = useDynamicPageSelection('workspace-123');
 *
 *   const handleCategoryHover = (categoryId: string, event: React.MouseEvent) => {
 *     const rect = event.currentTarget.getBoundingClientRect();
 *     selection.startCategoryHover(categoryId, { x: rect.x, y: rect.y });
 *   };
 *
 *   const handleOptionSelect = async (option: any) => {
 *     try {
 *       const result = await selection.selectOption(option, { x: 100, y: 100 });
 *       console.log('Selected:', result);
 *     } catch (error) {
 *       console.error('Selection failed:', error);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <div
 *         onMouseEnter={(e) => handleCategoryHover('artifact-template-category', e)}
 *         onMouseLeave={selection.endCategoryHover}
 *       >
 *         Artifact Template
 *       </div>
 *
 *       {selection.isVisible && (
 *         <div className="options-panel">
 *           {selection.availableOptions.map((option, index) => (
 *             <div
 *               key={option.id}
 *               className={index === selection.keyboardNavigationIndex ? 'focused' : ''}
 *               onClick={() => handleOptionSelect(option)}
 *               onMouseEnter={() => selection.previewOption(option)}
 *             >
 *               {option.name}
 *             </div>
 *           ))}
 *         </div>
 *       )}
 *
 *       {selection.error && <p>Error: {selection.error}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
