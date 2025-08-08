import {
  CanvasBlockDefinition,
  DynamicPageDefinition,
  TASK_CANVAS_DYNAMIC_CATEGORIES,
} from "./canvas-block-definitions";
import {
  DynamicPageSelector,
  PageFilter,
  PageSearchResult,
} from "./dynamic-page-selector";
import { PageBlockType } from "@/domains/workflow-canvas/constant";

/**
 * 🎯 DYNAMIC PAGE UI HANDLER
 * ===============================
 *
 * 📋 파일 역할:
 * - 동적 페이지 선택 UI 플로우 관리 (호버 → 리스트 → 선택)
 * - 상태 기반 UI 인터랙션 처리
 * - 이벤트 기반 선택 플로우 조정
 *
 * 🔧 주요 기능:
 * - DynamicPageUIHandler: UI 상태 관리 및 이벤트 처리
 * - DynamicPageSelectionFlow: 전체 선택 플로우 관리
 * - 카테고리 호버 → 옵션 로드 → 선택 처리
 * - "새로 생성" 옵션과 기존 페이지 통합 표시
 *
 * 📦 Export:
 * - UI Handler, Selection Flow, Option 인터페이스들
 */

/**
 * 동적 페이지 선택 옵션
 */
export interface DynamicPageOption {
  id: string;
  type: "existing" | "create_new";
  name: string;
  description: string;
  icon: string;
  color: string;
  nodeType: string;
  sourcePageId?: string;
  isReusable?: boolean;
  metadata?: Record<string, any>;
}

/**
 * 동적 페이지 선택 결과
 */
export interface DynamicPageSelection {
  option: DynamicPageOption;
  position: { x: number; y: number };
  shouldCreateNew: boolean;
  categoryId: string;
  blockId: string;
  timestamp: Date;
}

/**
 * 동적 페이지 UI 상태
 */
export interface DynamicPageUIState {
  isVisible: boolean;
  categoryId: string | null;
  hoveredCategoryId: string | null;
  selectedOption: DynamicPageOption | null;
  availableOptions: DynamicPageOption[];
  isLoading: boolean;
  error: string | null;
}

/**
 * 동적 페이지 UI 핸들러
 * 호버 -> 리스트 -> 선택 플로우를 관리
 */
export class DynamicPageUIHandler {
  private selector: DynamicPageSelector;
  private workspaceId: string;
  private uiState: DynamicPageUIState = {
    isVisible: false,
    categoryId: null,
    hoveredCategoryId: null,
    selectedOption: null,
    availableOptions: [],
    isLoading: false,
    error: null,
  };
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
    this.selector = new DynamicPageSelector(workspaceId);
  }

  /**
   * 카테고리 호버 시 동적 페이지 옵션들 로드
   */
  async onCategoryHover(categoryId: string): Promise<void> {
    try {
      this.updateUIState({
        hoveredCategoryId: categoryId,
        isLoading: true,
        error: null,
      });

      const category = this.findCategoryById(categoryId);
      if (!category) {
        throw new Error(`Category not found: ${categoryId}`);
      }

      // 해당 노드 타입의 기존 페이지들 검색
      const filter: PageFilter = {
        nodeTypes: [category.blockType],
        isReusable: true,
      };

      const searchResult = await this.selector.searchPages(
        PageBlockType.TASK,
        filter
      );

      // 기존 페이지들을 옵션으로 변환
      const existingOptions = this.convertToOptions(
        searchResult.pages,
        "existing"
      );

      // "새로 생성" 옵션 추가
      const createNewOption: DynamicPageOption = {
        id: `create_new_${category.blockType}`,
        type: "create_new",
        name: `새 ${category.name} 생성`,
        description: `새로운 ${category.name}을 생성합니다`,
        icon: "➕",
        color: "#6B7280",
        nodeType: category.blockType,
      };

      const allOptions = [createNewOption, ...existingOptions];

      this.updateUIState({
        categoryId,
        availableOptions: allOptions,
        isLoading: false,
        isVisible: true,
      });

      this.emit("optionsLoaded", {
        categoryId,
        options: allOptions,
        hasExistingPages: existingOptions.length > 0,
      });
    } catch (error) {
      console.error("Error loading dynamic page options:", error);
      this.updateUIState({
        isLoading: false,
        error: error instanceof Error ? error.message : "Unknown error",
        isVisible: false,
      });
    }
  }

  /**
   * 카테고리에서 마우스가 벗어날 때
   */
  onCategoryUnhover(): void {
    this.updateUIState({
      hoveredCategoryId: null,
    });

    // 짧은 지연 후 UI 숨김 (사용자가 옵션 리스트로 이동할 시간 제공)
    setTimeout(() => {
      if (!this.uiState.hoveredCategoryId && !this.uiState.selectedOption) {
        this.hideUI();
      }
    }, 200);
  }

  /**
   * 옵션 선택
   */
  async onOptionSelect(
    option: DynamicPageOption,
    position: { x: number; y: number }
  ): Promise<DynamicPageSelection> {
    this.updateUIState({
      selectedOption: option,
    });

    const selection: DynamicPageSelection = {
      option,
      position,
      shouldCreateNew: option.type === "create_new",
      categoryId: this.uiState.categoryId!,
      blockId:
        option.type === "create_new"
          ? option.id
          : `dynamic_page_${option.sourcePageId}`,
      timestamp: new Date(),
    };

    this.emit("optionSelected", selection);
    this.hideUI();

    return selection;
  }

  /**
   * 옵션에 호버 시 상세 정보 표시
   */
  onOptionHover(option: DynamicPageOption): void {
    this.emit("optionHovered", {
      option,
      isCreateNew: option.type === "create_new",
    });
  }

  /**
   * UI 숨기기
   */
  hideUI(): void {
    this.updateUIState({
      isVisible: false,
      categoryId: null,
      hoveredCategoryId: null,
      selectedOption: null,
      availableOptions: [],
      error: null,
    });

    this.emit("uiHidden");
  }

  /**
   * 현재 UI 상태 조회
   */
  getUIState(): DynamicPageUIState {
    return { ...this.uiState };
  }

  /**
   * 태스크 캔버스의 동적 카테고리들 조회
   */
  getDynamicCategories(): CanvasBlockDefinition[] {
    return TASK_CANVAS_DYNAMIC_CATEGORIES;
  }

  /**
   * 특정 노드 타입의 기존 페이지 개수 조회
   */
  async getExistingPageCount(nodeType: string): Promise<number> {
    try {
      const filter: PageFilter = {
        nodeTypes: [nodeType],
        isReusable: true,
      };

      const result = await this.selector.searchPages(
        PageBlockType.TASK,
        filter
      );
      return result.totalCount;
    } catch (error) {
      console.error("Error getting page count:", error);
      return 0;
    }
  }

  /**
   * 이벤트 리스너 등록
   */
  addEventListener(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(listener);
  }

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener(event: string, listener: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Private Methods
   */

  private findCategoryById(categoryId: string): CanvasBlockDefinition | null {
    return (
      TASK_CANVAS_DYNAMIC_CATEGORIES.find(
        (cat: CanvasBlockDefinition) => cat.id === categoryId
      ) || null
    );
  }

  private convertToOptions(
    pages: DynamicPageDefinition[],
    type: "existing" | "create_new"
  ): DynamicPageOption[] {
    return pages.map((page) => ({
      id: page.id,
      type,
      name: page.name,
      description: page.description,
      icon: page.icon,
      color: page.color,
      nodeType: page.blockType,
      sourcePageId: page.sourcePageId,
      isReusable: page.isReusable,
      metadata: page.properties,
    }));
  }

  private updateUIState(partial: Partial<DynamicPageUIState>): void {
    this.uiState = { ...this.uiState, ...partial };
    this.emit("stateChanged", this.uiState);
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event) || [];
    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}

/**
 * 동적 페이지 선택 플로우 매니저
 * 전체 선택 프로세스를 관리
 */
export class DynamicPageSelectionFlow {
  private uiHandler: DynamicPageUIHandler;
  private currentFlow: {
    step: "idle" | "category_hovered" | "options_shown" | "option_selected";
    categoryId?: string;
    selectedOption?: DynamicPageOption;
    position?: { x: number; y: number };
  } = { step: "idle" };

  constructor(workspaceId: string) {
    this.uiHandler = new DynamicPageUIHandler(workspaceId);
    this.setupEventListeners();
  }

  /**
   * 카테고리 호버 시작
   */
  async startCategoryHover(categoryId: string): Promise<void> {
    if (
      this.currentFlow.step === "category_hovered" &&
      this.currentFlow.categoryId === categoryId
    ) {
      return; // 이미 같은 카테고리가 활성화됨
    }

    this.currentFlow = {
      step: "category_hovered",
      categoryId,
    };

    await this.uiHandler.onCategoryHover(categoryId);
  }

  /**
   * 카테고리 호버 종료
   */
  endCategoryHover(): void {
    if (this.currentFlow.step === "category_hovered") {
      this.uiHandler.onCategoryUnhover();
    }
  }

  /**
   * 옵션 선택
   */
  async selectOption(
    option: DynamicPageOption,
    position: { x: number; y: number }
  ): Promise<DynamicPageSelection> {
    this.currentFlow = {
      step: "option_selected",
      selectedOption: option,
      position: position,
    };

    const selection = await this.uiHandler.onOptionSelect(option, position);

    // 플로우 완료 후 상태 초기화
    this.currentFlow = { step: "idle" };

    return selection;
  }

  /**
   * 플로우 취소
   */
  cancelFlow(): void {
    this.currentFlow = { step: "idle" };
    this.uiHandler.hideUI();
  }

  /**
   * 현재 플로우 상태 조회
   */
  getCurrentFlowState() {
    return {
      ...this.currentFlow,
      uiState: this.uiHandler.getUIState(),
    };
  }

  /**
   * UI 핸들러 접근자
   */
  getUIHandler(): DynamicPageUIHandler {
    return this.uiHandler;
  }

  /**
   * 선택 확인
   */
  async confirmSelection(): Promise<DynamicPageSelection | null> {
    if (
      this.currentFlow.step === "option_selected" &&
      this.currentFlow.selectedOption
    ) {
      const selection: DynamicPageSelection = {
        option: this.currentFlow.selectedOption,
        position: this.currentFlow.position || { x: 0, y: 0 },
        shouldCreateNew: this.currentFlow.selectedOption.type === "create_new",
        categoryId: this.currentFlow.categoryId || "",
        blockId:
          this.currentFlow.selectedOption.type === "create_new"
            ? this.currentFlow.selectedOption.id
            : `dynamic_page_${this.currentFlow.selectedOption.sourcePageId}`,
        timestamp: new Date(),
      };

      this.currentFlow = { step: "idle" };
      return selection;
    }
    return null;
  }

  private setupEventListeners(): void {
    this.uiHandler.addEventListener("optionsLoaded", (data: any) => {
      this.currentFlow.step = "options_shown";
    });

    this.uiHandler.addEventListener("uiHidden", () => {
      if (this.currentFlow.step !== "option_selected") {
        this.currentFlow = { step: "idle" };
      }
    });
  }
}
