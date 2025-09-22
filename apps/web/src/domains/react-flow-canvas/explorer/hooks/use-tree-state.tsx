"use client";

import type { TreeUIProps, UseTreeStateResult } from "../types";

export function useTreeState<TSourceData>(
  params: TreeUIProps<TSourceData>
): UseTreeStateResult {
  const { indent = 20, expandedAll, selectedId } = params;

  return {
    indent,
    expandedAll,
    selectedId,
  };
}
