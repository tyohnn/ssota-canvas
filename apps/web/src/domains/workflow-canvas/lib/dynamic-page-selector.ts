import {
  DynamicPageDefinition,
  DynamicPageLoader,
  DefaultDynamicPageLoader,
} from "./canvas-block-definitions";
import { PageBlockType } from "@/domains/workflow-canvas/constant";

/**
 * 🎯 DYNAMIC PAGE SELECTOR
 * =============================
 *
 * 📋 파일 역할:
 * - 워크스페이스 내 기존 페이지 검색 및 선택 시스템
 * - 페이지 추천 및 미리보기 생성
 * - 필터링 및 정렬 로직
 *
 * 🔧 주요 기능:
 * - DynamicPageSelector: 페이지 검색/필터링
 * - PagePreviewGenerator: 미리보기 데이터 생성
 * - PageRecommendationEngine: 컨텍스트 기반 추천
 * - "새로 생성" 옵션 포함한 통합 검색
 *
 * 📦 Export:
 * - Selector 클래스들, Preview 생성기, 추천 엔진
 */

/**
 * 페이지 필터 조건
 */
export interface PageFilter {
  nodeTypes?: string[];
  categories?: string[];
  tags?: string[];
  searchQuery?: string;
  isReusable?: boolean;
  workspaceId?: string;
}

/**
 * 페이지 검색 결과
 */
export interface PageSearchResult {
  pages: DynamicPageDefinition[];
  totalCount: number;
  hasMore: boolean;
  filters: PageFilter;
}

/**
 * 동적 페이지 선택기
 * 워크스페이스의 기존 페이지들을 검색하고 선택할 수 있는 기능 제공
 */
export class DynamicPageSelector {
  private loader: DynamicPageLoader;
  private workspaceId: string;

  constructor(workspaceId: string, loader?: DynamicPageLoader) {
    this.workspaceId = workspaceId;
    this.loader = loader || new DefaultDynamicPageLoader();
  }

  /**
   * 캔버스 타입에 맞는 페이지들 검색
   */
  async searchPages(
    canvasType: PageBlockType,
    filter: PageFilter = {},
    includeCreateNew: boolean = false
  ): Promise<PageSearchResult> {
    try {
      // 캔버스 타입별 기본 필터 적용
      const enhancedFilter = this.enhanceFilterForCanvasType(
        canvasType,
        filter
      );

      // 페이지 로드
      let pages: DynamicPageDefinition[] = [];

      if (enhancedFilter.searchQuery) {
        pages = await this.loader.searchPages(
          this.workspaceId,
          enhancedFilter.searchQuery
        );
      } else {
        pages = await this.loader.loadAvailablePages(
          this.workspaceId,
          canvasType
        );
      }

      // 필터 적용
      const filteredPages = this.applyFilters(pages, enhancedFilter);

      // "새로 생성" 옵션 추가 (요청된 경우)
      if (
        includeCreateNew &&
        enhancedFilter.nodeTypes &&
        enhancedFilter.nodeTypes.length > 0
      ) {
        const createNewPages = this.generateCreateNewOptions(
          enhancedFilter.nodeTypes
        );
        filteredPages.unshift(...createNewPages);
      }

      // 결과 정렬 (재사용 가능한 페이지 우선)
      const sortedPages = this.sortPages(filteredPages);

      return {
        pages: sortedPages,
        totalCount: sortedPages.length,
        hasMore: false, // 현재는 페이징 미구현
        filters: enhancedFilter,
      };
    } catch (error) {
      console.error("Error searching pages:", error);
      return {
        pages: [],
        totalCount: 0,
        hasMore: false,
        filters: filter,
      };
    }
  }

  /**
   * 재사용 가능한 페이지들만 조회
   */
  async getReusablePages(): Promise<DynamicPageDefinition[]> {
    try {
      return await this.loader.getReusablePages(this.workspaceId);
    } catch (error) {
      console.error("Error getting reusable pages:", error);
      return [];
    }
  }

  /**
   * 특정 페이지의 상세 정보 조회
   */
  async getPageDetails(pageId: string): Promise<DynamicPageDefinition | null> {
    try {
      // TODO: 서버액션 호출 - getPageDetailsById(pageId)
      // 실제 구현에서는 서버액션을 통해 데이터베이스에서 상세 정보 조회
      const pages = await this.loader.loadAvailablePages(
        this.workspaceId,
        PageBlockType.AGENT
      );
      return pages.find((p: DynamicPageDefinition) => p.id === pageId) || null;
    } catch (error) {
      console.error("Error getting page details:", error);
      return null;
    }
  }

  /**
   * 캔버스 타입에 따라 필터 조건 향상
   */
  private enhanceFilterForCanvasType(
    canvasType: PageBlockType,
    filter: PageFilter
  ): PageFilter {
    const enhanced = { ...filter, workspaceId: this.workspaceId };

    switch (canvasType) {
      case PageBlockType.WORKFLOW:
        // 워크플로우 캔버스에서는 agent, task 타입 페이지 우선
        enhanced.nodeTypes = enhanced.nodeTypes || [
          "agent",
          "task",
          "workflow",
        ];
        break;

      case PageBlockType.TASK:
        // 태스크 캔버스에서는 입력 가능한 타입들 우선
        enhanced.nodeTypes = enhanced.nodeTypes || [
          "artifact_template",
          "artifact_class",
          "data",
          "checklist",
        ];
        break;

      case PageBlockType.AGENT:
        // 에이전트 캔버스에서는 task, data 타입 우선
        enhanced.nodeTypes = enhanced.nodeTypes || [
          "task",
          "data",
          "checklist",
        ];
        break;

      default:
        // 기본값은 모든 타입 허용
        break;
    }

    return enhanced;
  }

  /**
   * 필터 조건 적용
   */
  private applyFilters(
    pages: DynamicPageDefinition[],
    filter: PageFilter
  ): DynamicPageDefinition[] {
    let filtered = [...pages];

    // 노드 타입 필터
    if (filter.nodeTypes && filter.nodeTypes.length > 0) {
      filtered = filtered.filter((p) =>
        filter.nodeTypes!.includes(p.blockType)
      );
    }

    // 카테고리 필터
    if (filter.categories && filter.categories.length > 0) {
      filtered = filtered.filter((p) =>
        filter.categories!.includes(p.category)
      );
    }

    // 재사용 가능 여부 필터
    if (filter.isReusable !== undefined) {
      filtered = filtered.filter((p) => p.isReusable === filter.isReusable);
    }

    // 검색어 필터 (이름, 설명에서 검색)
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  /**
   * "새로 생성" 옵션들 생성
   */
  private generateCreateNewOptions(
    nodeTypes: string[]
  ): DynamicPageDefinition[] {
    const nodeTypeLabels: Record<
      string,
      { name: string; icon: string; color: string }
    > = {
      artifact_template: {
        name: "아티팩트 템플릿",
        icon: "📋",
        color: "#EC4899",
      },
      artifact_class: { name: "아티팩트 클래스", icon: "📄", color: "#3B82F6" },
      data: { name: "데이터", icon: "🗄️", color: "#10B981" },
      checklist: { name: "체크리스트", icon: "✅", color: "#F59E0B" },
      agent: { name: "에이전트", icon: "🤖", color: "#8B5CF6" },
      task: { name: "태스크", icon: "📋", color: "#06B6D4" },
    };

    return nodeTypes.map((nodeType) => {
      const label = nodeTypeLabels[nodeType] || {
        name: nodeType,
        icon: "➕",
        color: "#6B7280",
      };

      return {
        id: `create_new_${nodeType}`,
        name: `새 ${label.name} 생성`,
        description: `새로운 ${label.name}을 생성합니다`,
        icon: "➕",
        color: "#6B7280",
        category: "create_new" as const,
        blockType: nodeType,
        properties: {
          isCreateNew: true,
          originalNodeType: nodeType,
          originalIcon: label.icon,
          originalColor: label.color,
        },
        isReusable: false,
        sourcePageId: undefined,
      };
    });
  }

  /**
   * 페이지 정렬
   */
  private sortPages(pages: DynamicPageDefinition[]): DynamicPageDefinition[] {
    return pages.sort((a, b) => {
      // "새로 생성" 옵션이 맨 앞에 오도록
      if (a.category === "create_new" && b.category !== "create_new") return -1;
      if (a.category !== "create_new" && b.category === "create_new") return 1;

      // 재사용 가능한 페이지 우선
      if (a.isReusable && !b.isReusable) return -1;
      if (!a.isReusable && b.isReusable) return 1;

      // 이름 순 정렬
      return a.name.localeCompare(b.name, "ko");
    });
  }
}

/**
 * 페이지 미리보기 데이터
 */
export interface PagePreview {
  pageId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  nodeType: string;
  properties: Record<string, any>;
  connections: {
    inputs: number;
    outputs: number;
  };
  lastUsed?: Date;
  usageCount?: number;
}

/**
 * 페이지 미리보기 생성기
 */
export class PagePreviewGenerator {
  /**
   * 페이지 정의에서 미리보기 데이터 생성
   */
  static generatePreview(page: DynamicPageDefinition): PagePreview {
    return {
      pageId: page.id,
      name: page.name,
      description: page.description,
      icon: page.icon,
      color: page.color,
      nodeType: page.blockType,
      properties: page.properties || {},
      connections: {
        inputs: this.calculateInputs(page),
        outputs: this.calculateOutputs(page),
      },
      lastUsed: undefined, // TODO: 실제 사용 이력에서 조회
      usageCount: 0, // TODO: 실제 사용 횟수 조회
    };
  }

  /**
   * 페이지의 입력 연결 개수 계산
   */
  private static calculateInputs(page: DynamicPageDefinition): number {
    // TODO: 실제 페이지 연결 정보에서 계산
    switch (page.blockType) {
      case "task":
        return 3; // 일반적으로 task는 여러 입력을 받음
      case "agent":
        return 2; // agent는 보통 적은 입력
      default:
        return 1;
    }
  }

  /**
   * 페이지의 출력 연결 개수 계산
   */
  private static calculateOutputs(page: DynamicPageDefinition): number {
    // TODO: 실제 페이지 연결 정보에서 계산
    switch (page.blockType) {
      case "task":
        return 2; // task는 결과물 생성
      case "agent":
        return 1; // agent는 단일 출력
      default:
        return 1;
    }
  }
}

/**
 * 페이지 추천 엔진
 */
export class PageRecommendationEngine {
  private selector: DynamicPageSelector;

  constructor(selector: DynamicPageSelector) {
    this.selector = selector;
  }

  /**
   * 캔버스 타입과 현재 컨텍스트에 따른 페이지 추천
   */
  async getRecommendations(
    canvasType: PageBlockType,
    currentNodes: any[] = [],
    maxRecommendations: number = 5
  ): Promise<DynamicPageDefinition[]> {
    try {
      // 현재 노드들 분석
      const nodeTypeCount = this.analyzeCurrentNodes(currentNodes);

      // 추천 필터 생성
      const recommendationFilter = this.createRecommendationFilter(
        canvasType,
        nodeTypeCount
      );

      // 페이지 검색
      const searchResult = await this.selector.searchPages(
        canvasType,
        recommendationFilter
      );

      // 추천 순위 적용
      const rankedPages = this.rankRecommendations(
        searchResult.pages,
        nodeTypeCount
      );

      return rankedPages.slice(0, maxRecommendations);
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return [];
    }
  }

  /**
   * 현재 노드들 분석
   */
  private analyzeCurrentNodes(nodes: any[]): Record<string, number> {
    const count: Record<string, number> = {};

    nodes.forEach((node) => {
      const nodeType = node.type || "unknown";
      count[nodeType] = (count[nodeType] || 0) + 1;
    });

    return count;
  }

  /**
   * 추천을 위한 필터 생성
   */
  private createRecommendationFilter(
    canvasType: PageBlockType,
    nodeTypeCount: Record<string, number>
  ): PageFilter {
    const filter: PageFilter = {
      isReusable: true, // 재사용 가능한 페이지 우선
    };

    // 캔버스 타입에 따른 추천 로직
    switch (canvasType) {
      case PageBlockType.WORKFLOW:
        // 워크플로우에 agent가 적으면 agent 추천
        if ((nodeTypeCount.agent || 0) < 2) {
          filter.nodeTypes = ["agent"];
        } else if ((nodeTypeCount.task || 0) < 3) {
          filter.nodeTypes = ["task"];
        }
        break;

      case PageBlockType.TASK:
        // 태스크에 입력이 부족하면 입력 타입 추천
        const inputTypes = ["data", "checklist", "artifact_template"];
        const inputCount = inputTypes.reduce(
          (sum, type) => sum + (nodeTypeCount[type] || 0),
          0
        );

        if (inputCount < 2) {
          filter.nodeTypes = inputTypes;
        }
        break;
    }

    return filter;
  }

  /**
   * 추천 순위 적용
   */
  private rankRecommendations(
    pages: DynamicPageDefinition[],
    nodeTypeCount: Record<string, number>
  ): DynamicPageDefinition[] {
    return pages.sort((a, b) => {
      // 현재 부족한 노드 타입 우선
      const aTypeCount = nodeTypeCount[a.blockType] || 0;
      const bTypeCount = nodeTypeCount[b.blockType] || 0;

      if (aTypeCount !== bTypeCount) {
        return aTypeCount - bTypeCount; // 적은 타입이 우선
      }

      // 재사용 가능한 페이지 우선
      if (a.isReusable && !b.isReusable) return -1;
      if (!a.isReusable && b.isReusable) return 1;

      // 이름순 정렬
      return a.name.localeCompare(b.name, "ko");
    });
  }
}
