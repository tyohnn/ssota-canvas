import React from "react";
import type { FeatureImplementation } from "@headless-tree/core";

// ===== 기본 데이터 타입 =====
export interface ExplorerTreeItem {
  id: string;
  name: string;
  children?: string[];
  isFolder?: boolean;
  itemType?: string;
}

// ===== Props 타입 분리 =====
export interface TreeDataProps<TSourceData> {
  sourceData: TSourceData[];
  getId: (item: TSourceData) => string;
  getName: (item: TSourceData) => string;
  getParentId: (item: TSourceData) => string | null;
  getOrder?: (item: TSourceData) => number | undefined;
  getType?: (item: TSourceData) => string | undefined;
  disableFolderStructure?: boolean;
}

export interface TreeActionProps<TSourceData> {
  canDrop?: (dragItemIds: string[], targetItemId: string) => boolean;
  onSelect?: (id: string) => void;
  onMove?: (args: {
    itemId: string;
    parentId: string | null;
    newIndex: number;
    newOrder: number;
    siblings: TSourceData[];
    item?: TSourceData;
  }) => void | Promise<void>;
}

export interface TreeUIProps<TSourceData> {
  renderFileIcon?: (
    type: string | undefined,
    className: string,
    item?: TSourceData
  ) => React.ReactNode;
  rootName?: string;
  indent?: number;
  expandedAll?: boolean;
  selectedId?: string;
  disableFolderStructure?: boolean;
}

// ===== Context 타입 =====
export interface ExplorerTreeContextValue<TSourceData> {
  // 데이터
  treeData: Record<string, ExplorerTreeItem>;
  sourceData: TSourceData[];
  idToItem: Map<string, TSourceData>;

  // 상태
  hasRootChildren: boolean;
  rootChildrenKey: string;

  // 함수들
  getItem: (itemId: string) => ExplorerTreeItem;
  getChildren: (itemId: string) => string[];
  calculateNewOrder: (targetIndex: number, siblings: TSourceData[]) => number;
  getParentId: (item: TSourceData) => string | null;
  getName: (item: TSourceData) => string;

  // 액션
  onMove?: (args: {
    itemId: string;
    parentId: string | null;
    newIndex: number;
    newOrder: number;
    siblings: TSourceData[];
    item?: TSourceData;
  }) => void | Promise<void>;

  // UI 설정
  indent: number;
  customClickBehavior: FeatureImplementation;
  renderFileIcon?: (
    type: string | undefined,
    className: string,
    item?: TSourceData
  ) => React.ReactNode;

  // 트리 상태
  expandedAll?: boolean;
  selectedId?: string;
  canDrop?: (dragItemIds: string[], targetItemId: string) => boolean;
  onSelect?: (id: string) => void;
}

// ===== 훅 반환 타입 =====
export interface UseTreeDataResult<TSourceData> {
  treeData: Record<string, ExplorerTreeItem>;
  sourceData: TSourceData[];
  idToItem: Map<string, TSourceData>;
  hasRootChildren: boolean;
  rootChildrenKey: string;
  getItem: (itemId: string) => ExplorerTreeItem;
  getChildren: (itemId: string) => string[];
  calculateNewOrder: (targetIndex: number, siblings: TSourceData[]) => number;
}

export interface UseTreeActionsResult<TSourceData> {
  onMove?: (args: {
    itemId: string;
    parentId: string | null;
    newIndex: number;
    newOrder: number;
    siblings: TSourceData[];
    item?: TSourceData;
  }) => void | Promise<void>;
  customClickBehavior: FeatureImplementation;
}

export interface UseTreeStateResult {
  indent: number;
  expandedAll?: boolean;
  selectedId?: string;
  canDrop?: (dragItemIds: string[], targetItemId: string) => boolean;
  onSelect?: (id: string) => void;
}

// ===== 컴포넌트 Props 타입 =====
export interface TreeContainerProps<TSourceData> {
  children: React.ReactNode;
}

export interface TreeItemRendererProps<TSourceData> {
  item: any; // Headless Tree item type
  renderFileIcon?: (
    type: string | undefined,
    className: string,
    item?: TSourceData
  ) => React.ReactNode;
}

export interface TreeControlsProps {
  item: any; // Headless Tree item type
  hasChildren: boolean;
}

export interface TreeItemContentProps<TSourceData> {
  item: any; // Headless Tree item type
  renderFileIcon?: (
    type: string | undefined,
    className: string,
    item?: TSourceData
  ) => React.ReactNode;
}
