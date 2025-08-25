"use client";

import React from "react";
import { useTreeData, useTreeActions, useTreeState } from "./hooks";
import { ExplorerTreeProvider } from "./explorer-tree-context";
import { TreeContainer } from "./components";
import type { TreeDataProps, TreeActionProps, TreeUIProps } from "./types";

export interface ExplorerTreeProps<TSourceData>
  extends TreeDataProps<TSourceData>,
    TreeActionProps<TSourceData>,
    TreeUIProps<TSourceData> {}

export default function ExplorerTree<TSourceData>(
  props: ExplorerTreeProps<TSourceData>
) {
  const {
    sourceData,
    getId,
    getName,
    getParentId,
    getOrder,
    getType,
    renderFileIcon,
    rootName = "Pages",
    indent = 20,
    expandedAll,
    selectedId,
    canDrop,
    onSelect,
    onMove,
    disableFolderStructure = false,
  } = props;

  // Props를 카테고리별로 분리
  const dataProps: TreeDataProps<TSourceData> = {
    sourceData,
    getId,
    getName,
    getParentId,
    getOrder,
    getType,
    disableFolderStructure,
  };

  const actionProps: TreeActionProps<TSourceData> = {
    canDrop,
    onSelect,
    onMove,
  };

  const uiProps: TreeUIProps<TSourceData> = {
    renderFileIcon,
    rootName,
    indent,
    expandedAll,
    selectedId,
    disableFolderStructure,
  };

  // 훅들을 사용하여 데이터와 액션을 분리
  const treeData = useTreeData(dataProps);
  const treeActions = useTreeActions(actionProps);
  const treeState = useTreeState(uiProps);

  // Context value 생성
  const contextValue = {
    // 데이터
    treeData: treeData.treeData,
    sourceData: treeData.sourceData,
    idToItem: treeData.idToItem,

    // 상태
    hasRootChildren: treeData.hasRootChildren,
    rootChildrenKey: treeData.rootChildrenKey,

    // 함수들
    getItem: treeData.getItem,
    getChildren: treeData.getChildren,
    calculateNewOrder: treeData.calculateNewOrder,
    getParentId,
    getName,

    // 액션
    onMove: treeActions.onMove,

    // UI 설정
    indent: treeState.indent,
    customClickBehavior: treeActions.customClickBehavior,
    renderFileIcon,

    // 트리 상태
    expandedAll: uiProps.expandedAll,
    selectedId: uiProps.selectedId,
    canDrop: actionProps.canDrop,
    onSelect: actionProps.onSelect,
  };

  // 조건부 렌더링
  if (!treeData.hasRootChildren) {
    return <div className="flex-1 min-h-0 overflow-auto" />;
  }

  return (
    <ExplorerTreeProvider value={contextValue}>
      <TreeContainer key={treeData.rootChildrenKey} />
    </ExplorerTreeProvider>
  );
}
