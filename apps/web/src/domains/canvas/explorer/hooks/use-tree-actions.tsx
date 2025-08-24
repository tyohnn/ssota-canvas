"use client";

import React, { useCallback } from "react";
import type { FeatureImplementation } from "@headless-tree/core";
import type { TreeActionProps, UseTreeActionsResult } from "../types";

export function useTreeActions<TSourceData>(
  params: TreeActionProps<TSourceData>
): UseTreeActionsResult<TSourceData> {
  const { canDrop, onSelect, onMove } = params;

  const customClickBehavior: FeatureImplementation = {
    itemInstance: {
      getProps: ({ tree, item, prev }) => ({
        ...prev?.(),
        onDoubleClick: (e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
          item.setFocused();
        },
        onClick: (e: MouseEvent) => {
          if ((e as any).shiftKey) {
            item.selectUpTo((e as any).ctrlKey || (e as any).metaKey);
          } else if ((e as any).ctrlKey || (e as any).metaKey) {
            item.toggleSelect();
          } else {
            tree.setSelectedItems([item.getItemMeta().itemId]);
          }
          item.setFocused();
          const id = item.getId();
          if (id !== "root") onSelect?.(id);
        },
      }),
    },
  };

  return {
    onMove,
    customClickBehavior,
  };
}
