import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  syncDataLoaderFeature,
  expandAllFeature,
  searchFeature,
  selectionFeature,
  hotkeysCoreFeature,
  ItemInstance,
} from "@headless-tree/core";
import { useTree } from "@headless-tree/react";
import { Node as ReactFlowBlock } from "@xyflow/react";
import {
  PageBlockType,
  PAGE_BLOCK_COLOR_TOKENS,
} from "@/domains/workflow-canvas/policy";
import { useCanvas } from "@/domains/workflow-canvas/contexts/CanvasContext";

const indent = 20;

// Page type definitions with icons for tree
export interface PageItem {
  name: string;
  type: "folder" | "page";
  pageType?: PageBlockType;
  children?: string[];
}

/**
 * 🎯 USE PAGE EXPLORER HOOK
 * =========================
 *
 * 📋 역할: Page Block Panel의 UI 로직을 관리하는 훅
 * - 7개 페이지 타입별 트리 구조 관리
 * - 동적 아이템 업데이트 및 검색 기능
 * - Headless Tree 설정 및 상태 관리
 * - 탭 변경 시에도 트리 상태 유지
 *
 * 🔧 주요 기능:
 * - 동적 아이템 상태 관리
 * - 검색 기능 처리
 * - 트리 확장/축소 상태 관리 (탭 변경 시에도 유지)
 * - 컴포넌트 마운트 상태 추적
 */
export function usePageBlockExplorerHandler() {
  // Context에서 필요한 상태와 이벤트 핸들러 가져오기
  const {
    dbBlocks, // 새로운 DB blocks 사용 (Single Source of Truth)
    selectedPageBlock,
    handlePageBlockSelect,
    openPageBlockInsertPanel,
    closeEditorPanel,
  } = useCanvas();

  // UI 상태 관리
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  // 동적 아이템 상태
  const [dynamicItems, setDynamicItems] = useState<Record<string, PageItem>>({
    root: {
      // 반드시 필요
      name: "Page Types",
      type: "folder",
      children: [
        PageBlockType.WORKFLOW,
        PageBlockType.AGENT,
        PageBlockType.TASK,
        PageBlockType.ARTIFACT_TEMPLATE,
        PageBlockType.ARTIFACT_CLASS,
        PageBlockType.DATA,
        PageBlockType.CHECKLIST,
      ],
    },
    [PageBlockType.WORKFLOW]: {
      name: "Workflow",
      type: "folder",
      pageType: PageBlockType.WORKFLOW,
      children: [],
    },
    [PageBlockType.AGENT]: {
      name: "Agent",
      type: "folder",
      pageType: PageBlockType.AGENT,
      children: [],
    },
    [PageBlockType.TASK]: {
      name: "Task",
      type: "folder",
      pageType: PageBlockType.TASK,
      children: [],
    },
    [PageBlockType.ARTIFACT_TEMPLATE]: {
      name: "Artifact Template",
      type: "folder",
      pageType: PageBlockType.ARTIFACT_TEMPLATE,
      children: [],
    },
    [PageBlockType.ARTIFACT_CLASS]: {
      name: "Artifact Class",
      type: "folder",
      pageType: PageBlockType.ARTIFACT_CLASS,
      children: [],
    },
    [PageBlockType.CHECKLIST]: {
      name: "Checklist",
      type: "folder",
      pageType: PageBlockType.CHECKLIST,
      children: [],
    },
    [PageBlockType.DATA]: {
      name: "Data",
      type: "folder",
      pageType: PageBlockType.DATA,
      children: [],
    },
  });

  /**
   * 🔄 동적 아이템 업데이트 로직
   *
   * 📋 기능:
   * - 워크스페이스 노드 변경 시 트리 구조 업데이트
   * - 7개 페이지 타입별로 노드들을 분류
   * - 각 페이지 타입 폴더에 해당하는 노드들 추가
   *
   * 🎯 비즈니스 로직:
   * - Agent 폴더: Agent 타입 노드들만 포함
   * - Task 폴더: Task 타입 노드들만 포함
   * - Workflow 폴더: Workflow 타입 노드들만 포함
   * - 기타 폴더들: 각각의 타입에 맞는 노드들 포함
   */
  useEffect(() => {
    const items: Record<string, PageItem> = {
      root: {
        name: "Page Types",
        type: "folder",
        children: [
          PageBlockType.WORKFLOW,
          PageBlockType.AGENT,
          PageBlockType.TASK,
          PageBlockType.ARTIFACT_TEMPLATE,
          PageBlockType.ARTIFACT_CLASS,
          PageBlockType.DATA,
          PageBlockType.CHECKLIST,
        ],
      },
    };

    // Initialize empty folders for each node type
    const pageTypes = [
      PageBlockType.AGENT,
      PageBlockType.TASK,
      PageBlockType.WORKFLOW,
      PageBlockType.ARTIFACT_TEMPLATE,
      PageBlockType.CHECKLIST,
      PageBlockType.DATA,
      PageBlockType.ARTIFACT_CLASS,
    ];
    pageTypes.forEach((pageType) => {
      // 더 정교한 이름 변환 로직
      let displayName: string;
      // 일반적인 변환 로직
      displayName =
        // artifact_template -> Artifact Template
        pageType
          .replace(/_/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

      items[pageType] = {
        name: displayName,
        type: "folder",
        pageType: pageType,
        children: [],
      };
    });

    // Add all workspace pages to their respective folders (DB blocks 사용)
    dbBlocks?.forEach((page) => {
      const pageType = page.block_type;

      if (pageType && items[pageType]) {
        // Add the page ID to the folder's children
        items[pageType].children!.push(page.id);
        // Create the actual page item
        items[page.id] = {
          name: page.name || `${pageType} ${page.id}`,
          type: "page",
          pageType: pageType as PageBlockType,
        };
      }
    });

    setDynamicItems(items);
  }, [dbBlocks]);

  /**
   * 🌳 트리 설정 및 초기화
   *
   * 📋 기능:
   * - Headless Tree 라이브러리를 사용한 트리 구조 설정
   * - 동적 데이터 로딩 및 실시간 업데이트
   * - 확장/축소 기능 지원
   * - 검색 기능 지원
   * - 탭 변경 시에도 상태 유지
   *
   * 🎯 기술적 특징:
   * - syncDataLoaderFeature: 동적 데이터 동기화
   * - expandAllFeature: 전체 확장/축소 기능
   * - searchFeature: 검색 기능
   * - 폴더/노드 구분 로직
   * - 트리 상태 지속성 보장
   */
  // dataLoader 함수들을 메모이제이션
  const getItem = useCallback(
    (itemId: string) => {
      const item = dynamicItems[itemId];
      if (!item) {
        // Return a default item for missing items
        return {
          name: "Unknown",
          type: "folder" as const,
        };
      }
      return item;
    },
    [dynamicItems]
  );

  const getChildren = useCallback(
    (itemId: string) => {
      const item = dynamicItems[itemId];
      return item?.children ?? [];
    },
    [dynamicItems]
  );

  const treeConfig = useMemo(() => {
    return {
      initialState: {
        expandedItems: ["root"],
      },
      indent,
      rootItemId: "root",
      getItemName: (item: ItemInstance<PageItem>) => item.getItemData().name,
      isItemFolder: (item: ItemInstance<PageItem>) =>
        item.getItemData().type === "folder",
      dataLoader: {
        getItem,
        getChildren,
      },
      features: [
        syncDataLoaderFeature,
        expandAllFeature,
        searchFeature,
        selectionFeature,
        hotkeysCoreFeature,
      ],
    };
  }, [indent, getItem, getChildren]);

  const tree = useTree<PageItem>(treeConfig);

  // 전체 확장 상태 계산 (모든 폴더가 열려있는지 확인)
  const isExpanded = useMemo(() => {
    const allFolderIds = [
      PageBlockType.WORKFLOW,
      PageBlockType.AGENT,
      PageBlockType.TASK,
      PageBlockType.ARTIFACT_TEMPLATE,
      PageBlockType.ARTIFACT_CLASS,
      PageBlockType.DATA,
      PageBlockType.CHECKLIST,
    ];
    // 모든 폴더가 열려있을 때만 열려있는 것으로 처리
    const items = tree.getItems();
    return allFolderIds.every((id) => {
      const item = items.find((item) => item.getId() === id);
      return item?.isExpanded() ?? false;
    });
  }, [tree]);

  // tree 객체를 ref로 저장하여 안정적인 참조 제공
  const treeRef = useRef(tree);
  treeRef.current = tree;

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchValue(value);

      // Call the original search onChange handler from tree
      const originalProps = treeRef.current.getSearchInputElementProps();
      if (originalProps.onChange) {
        originalProps.onChange(e);
      }

      // Handle expand/collapse based on search
      if (value.length > 0) {
        // If input has at least one character, expand all items
        if (treeRef.current.expandAll) {
          treeRef.current.expandAll();
        }
      } else {
        // If input is cleared, reset to initial expanded state
      }
    },
    [] // tree 의존성 제거
  );

  /**
   * 🔄 전체 확장/축소 토글 처리
   *
   * 📋 개선사항:
   * - 즉시 반응하도록 requestAnimationFrame 사용
   * - 트리 상태 업데이트
   * - UI 상태 동기화
   */
  const handleExpandToggle = useCallback(() => {
    if (!tree) return;

    // 현재 트리 상태를 직접 확인하여 토글 결정
    const allFolderIds = [
      PageBlockType.WORKFLOW,
      PageBlockType.AGENT,
      PageBlockType.TASK,
      PageBlockType.ARTIFACT_TEMPLATE,
      PageBlockType.ARTIFACT_CLASS,
      PageBlockType.DATA,
      PageBlockType.CHECKLIST,
    ];

    const items = tree.getItems();
    const currentExpanded = allFolderIds.every((id) => {
      const item = items.find((item) => item.getId() === id);
      return item?.isExpanded() ?? false;
    });

    if (!currentExpanded) {
      // Expand all
      if (tree.expandAll) {
        tree.expandAll();
      }
    } else {
      // Collapse all
      if (tree.collapseAll) {
        tree.collapseAll();
      }
    }
  }, [tree]);

  /**
   * 🔄 전체 확장 처리
   */
  const handleExpandAll = useCallback(() => {
    if (!tree || !tree.expandAll) return;
    tree.expandAll();
  }, [tree]);

  /**
   * 🔄 전체 축소 처리
   */
  const handleCollapseAll = useCallback(() => {
    if (!tree || !tree.collapseAll) return;
    tree.collapseAll();
  }, [tree]);

  /**
   * 🖱️ 트리 아이템 클릭 처리
   *
   * 📋 기능:
   * - 폴더 클릭: Headless Tree의 기본 확장/축소 동작 허용
   * - 페이지 클릭: 페이지 블록 선택 처리
   * - 이벤트 전파 제어로 의도하지 않은 동작 방지
   *
   * 🎯 비즈니스 로직:
   * - 폴더: TreeItem의 기본 동작 사용 (자동 확장/축소)
   * - 페이지: 페이지 블록 선택 및 캔버스 렌더링 변경
   */
  const handleItemClick = useCallback(
    (e: React.MouseEvent, item: ItemInstance<PageItem>) => {
      const isFolder = item.isFolder();

      if (isFolder) {
      } else {
        // 페이지 클릭 시: 페이지 블록 선택 처리
        e.preventDefault();
        e.stopPropagation();
        closeEditorPanel();
        handlePageBlockSelect(item.getId());
      }
    },
    [handlePageBlockSelect, closeEditorPanel]
  );

  /**
   * ⌨️ 트리 아이템 키보드 이벤트 처리
   *
   * 📋 기능:
   * - Enter/Space 키로 폴더 확장/축소 또는 페이지 선택
   * - 접근성 지원 (키보드 네비게이션)
   * - 이벤트 전파 제어
   *
   * 🎯 접근성:
   * - 키보드만으로 모든 기능 사용 가능
   * - 스크린 리더 지원
   */
  const handleItemKeyDown = useCallback(
    (e: React.KeyboardEvent, item: ItemInstance<PageItem>) => {
      if (e.key === "Enter" || e.key === " ") {
        const isFolder = item.isFolder();

        if (isFolder) {
        } else {
          e.preventDefault();
          handlePageBlockSelect(item.getId());
        }
      }
    },
    [handlePageBlockSelect]
  );

  /**
   * 🎨 스타일링 유틸리티 함수들
   *
   * 📋 기능:
   * - 페이지 타입별 아이콘 색상 계산
   * - Active/Hover 상태별 배경/텍스트 색상 계산
   * - 복잡한 조건부 스타일링을 단일 변수로 단순화
   *
   * 🎯 비즈니스 로직:
   * - 각 페이지 타입별로 고유한 색상 테마 적용
   * - Active 상태 시 강조 표시
   * - Hover 상태 시 상호작용 피드백 제공
   */

  // 아이콘 색상 계산
  const getIconColor = useCallback(
    (pageType?: PageBlockType, colorToken?: string) => {
      if (!pageType || !colorToken) return "text-muted-foreground/70";

      switch (colorToken) {
        case "purple":
          return "text-purple-500";
        case "emerald":
          return "text-emerald-500";
        case "blue":
          return "text-blue-500";
        case "amber":
          return "text-amber-500";
        case "red":
          return "text-red-500";
        case "cyan":
          return "text-cyan-500";
        case "lime":
          return "text-lime-500";
        default:
          return "text-muted-foreground/70";
      }
    },
    []
  );

  // Active 상태 배경색 계산
  const getActiveBackgroundClass = useCallback((colorToken?: string) => {
    if (!colorToken) return "bg-primary/10 border-primary/30";

    switch (colorToken) {
      case "purple":
        return "bg-purple-500/10 border-purple-500/30";
      case "emerald":
        return "bg-emerald-500/10 border-emerald-500/30";
      case "blue":
        return "bg-blue-500/10 border-blue-500/30";
      case "amber":
        return "bg-amber-500/10 border-amber-500/30";
      case "red":
        return "bg-red-500/10 border-red-500/30";
      case "cyan":
        return "bg-cyan-500/10 border-cyan-500/30";
      case "lime":
        return "bg-lime-500/10 border-lime-500/30";
      default:
        return "bg-primary/10 border-primary/30";
    }
  }, []);

  // Active 상태 텍스트 색상 계산
  const getActiveTextClass = useCallback((colorToken?: string) => {
    if (!colorToken) return "text-primary font-medium";

    switch (colorToken) {
      case "purple":
        return "text-purple-700 font-medium";
      case "emerald":
        return "text-emerald-700 font-medium";
      case "blue":
        return "text-blue-700 font-medium";
      case "amber":
        return "text-amber-700 font-medium";
      case "red":
        return "text-red-700 font-medium";
      case "cyan":
        return "text-cyan-700 font-medium";
      case "lime":
        return "text-lime-700 font-medium";
      default:
        return "text-primary font-medium";
    }
  }, []);

  // Hover 상태 배경색 계산
  const getHoverBackgroundClass = useCallback((colorToken?: string) => {
    if (!colorToken) return "hover:bg-primary/20";

    switch (colorToken) {
      case "purple":
        return "hover:bg-purple-500/20";
      case "emerald":
        return "hover:bg-emerald-500/20";
      case "blue":
        return "hover:bg-blue-500/20";
      case "amber":
        return "hover:bg-amber-500/20";
      case "red":
        return "hover:bg-red-500/20";
      case "cyan":
        return "hover:bg-cyan-500/20";
      case "lime":
        return "hover:bg-lime-500/20";
      default:
        return "hover:bg-primary/20";
    }
  }, []);

  // 통합 스타일 계산 함수
  const getItemStyles = useCallback(
    (item: ItemInstance<PageItem>) => {
      const itemData = item.getItemData();
      const pageType = itemData.pageType;
      const isActive = selectedPageBlock?.id === item.getId();
      const isFolder = item.isFolder();

      // 컬러 토큰 가져오기
      const colorToken =
        pageType && pageType in PAGE_BLOCK_COLOR_TOKENS
          ? PAGE_BLOCK_COLOR_TOKENS[
              pageType as keyof typeof PAGE_BLOCK_COLOR_TOKENS
            ]
          : "";

      // 아이콘 색상
      const iconColor = getIconColor(pageType, colorToken);

      // 텍스트 색상
      const textColor = isActive
        ? getActiveTextClass(colorToken)
        : "text-muted-foreground";

      // 동적 클래스들만 변수로 반환
      const hoverClass = getHoverBackgroundClass(colorToken);
      const activeClass = isActive
        ? `${getActiveBackgroundClass(colorToken)} border`
        : "";
      const folderClass = isFolder ? "!pl-1" : "";

      return {
        iconColor,
        textColor,
        hoverClass,
        activeClass,
        folderClass,
        colorToken,
      };
    },
    [
      selectedPageBlock,
      getIconColor,
      getActiveTextClass,
      getHoverBackgroundClass,
      getActiveBackgroundClass,
    ]
  );

  return {
    // 상태
    isLoading,
    isExpanded,
    searchValue,
    dynamicItems,
    tree,

    // 이벤트 핸들러
    handleSearchChange,
    handleExpandToggle,
    handleExpandAll,
    handleCollapseAll,
    handleItemClick,
    handleItemKeyDown,
    openPageBlockInsertPanel,

    // 스타일링 함수
    getItemStyles,

    // 상수
    indent,
  };
}
