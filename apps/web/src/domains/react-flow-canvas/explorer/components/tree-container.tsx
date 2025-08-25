"use client";

import React, { useEffect } from "react";
import { AssistiveTreeDescription, useTree } from "@headless-tree/react";
import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core";
import { Tree, TreeDragLine } from "@workspace/ui/components/ui/tree";
import type { ExplorerTreeItem } from "../types";
import { useExplorerTreeContext } from "../explorer-tree-context";
import { TreeItemRenderer } from "./tree-item-renderer";

interface TreeContainerProps {}

function TreeContainerInner({}: TreeContainerProps) {
  const {
    treeData,
    indent,
    getItem,
    getChildren,
    calculateNewOrder,
    idToItem,
    sourceData,
    getParentId,
    onMove,
    customClickBehavior,
    hasRootChildren,
    renderFileIcon,
    expandedAll,
    selectedId,
    canDrop,
  } = useExplorerTreeContext();

  const tree = useTree<ExplorerTreeItem>({
    initialState: {
      expandedItems: expandedAll ? Object.keys(treeData) : ["root"],
      selectedItems: selectedId ? [selectedId] : [],
    },
    indent,
    rootItemId: "root",
    getItemName: (item) => item.getItemData()?.name ?? "Unknown",
    isItemFolder: () => true,
    canReorder: true,
    canDrop: (dragItems, target) => {
      const targetId = target.item.getId();
      const dragIds = dragItems.map((it) => it.getId());
      return canDrop ? canDrop(dragIds, targetId) : Boolean(targetId);
    },
    onDrop: createOnDropHandler((parentItem, newChildrenIds) => {
      const parentId = parentItem.getId();
      newChildrenIds.forEach((childId, index) => {
        if (childId === "root") return;
        const newParentId = parentId === "root" ? null : parentId;

        const movedItem = idToItem.get(childId);
        const siblings = sourceData.filter(
          (item) => getParentId(item) === newParentId
        );
        const newOrder = calculateNewOrder(index, siblings);

        onMove?.({
          itemId: childId,
          parentId: newParentId,
          newIndex: index,
          newOrder,
          siblings,
          item: movedItem,
        });
      });
    }),
    dataLoader: {
      getItem,
      getChildren,
    },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
      customClickBehavior,
    ],
  });

  // 선택 상태 동기화
  useEffect(() => {
    if (selectedId) {
      tree.setSelectedItems([selectedId]);
    } else {
      tree.setSelectedItems([]);
    }
  }, [selectedId, tree]);

  const treeItems = tree.getItems();

  return (
    <Tree className="relative" indent={indent} tree={tree}>
      <AssistiveTreeDescription tree={tree} />
      <TreeDragLine />
      {treeItems.map((item) => (
        <TreeItemRenderer key={item.getId()} item={item} />
      ))}
    </Tree>
  );
}

// React.memo로 최적화
export const TreeContainer = React.memo(TreeContainerInner);
