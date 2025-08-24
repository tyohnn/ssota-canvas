"use client";

import React from "react";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import type { ViewDefinition } from "@/domains/canvas/policy/view-policy";

export function KanbanView({ view }: { view: ViewDefinition }) {
  const data = useCanvasData();
  const blocks = Object.values(data.blocksById) as any[];

  const groupKey = String(view.config?.groupBy || "status");

  const items = React.useMemo(() => {
    const filtered = view.componentFilter
      ? blocks.filter(
          (b) => b?.metadata?.component_type === view.componentFilter
        )
      : blocks;
    const groups = new Map<string, any[]>();
    filtered.forEach((b) => {
      const key = String((b?.metadata?.data || {})[groupKey] ?? "");
      const arr = groups.get(key) || [];
      arr.push(b);
      groups.set(key, arr);
    });
    return groups;
  }, [blocks, view.componentFilter, groupKey]);

  const columns = Array.from(items.keys());

  return (
    <div className="h-full w-full overflow-auto p-3">
      <div className="text-sm font-medium mb-2">{view.name}</div>
      <div className="grid grid-cols-4 gap-3">
        {columns.map((col) => (
          <div key={col} className="bg-muted/30 rounded-md p-2 min-h-[240px]">
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              {col || "(Unassigned)"}
            </div>
            <div className="space-y-2">
              {(items.get(col) || []).map((b: any) => (
                <div
                  key={b.id}
                  className="bg-background rounded border p-2 text-sm"
                >
                  {b.name || b.slug || b.id}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
