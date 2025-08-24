"use client";

import React from "react";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import type { ViewDefinition } from "@/domains/canvas/policy/view-policy";

export function TableView({ view }: { view: ViewDefinition }) {
  const data = useCanvasData();
  const blocksById = data.blocksById;

  const rows = React.useMemo(() => {
    const allBlocks = Object.values(blocksById);
    const filtered = view.componentFilter
      ? allBlocks.filter(
          (b: any) => b?.metadata?.component_type === view.componentFilter
        )
      : allBlocks;
    return filtered;
  }, [blocksById, view.componentFilter]);

  const columns = Array.isArray(view.config?.columns)
    ? (view.config.columns as string[])
    : ["name", "status"]; // minimal default

  return (
    <div className="h-full w-full overflow-auto p-3">
      <div className="text-sm font-medium mb-2">{view.name}</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            {columns.map((col) => (
              <th
                key={col}
                className="py-2 pr-4 font-semibold text-muted-foreground"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((b: any) => (
            <tr key={b.id} className="border-b hover:bg-accent/40">
              {columns.map((col) => {
                const val =
                  (b?.metadata?.data || {})[col] ?? (b as any)[col] ?? "";
                return (
                  <td key={col} className="py-2 pr-4">
                    {String(val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
