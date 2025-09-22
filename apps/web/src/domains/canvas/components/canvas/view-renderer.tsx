"use client";

import React from "react";
import { useViewContext } from "@/domains/canvas/contexts/CanvasViewContext";
import { IntegratedReactFlowCanvas } from "@/domains/canvas/components/canvas/integrated-react-flow-canvas";
import { TableView } from "@/domains/canvas/components/views/table-view";
import { KanbanView } from "@/domains/canvas/components/views/kanban-view";
import { MarkdownView } from "@/domains/canvas/components/views/markdown-view";

export function ViewRenderer() {
  const { currentViewId, currentViewDef } = useViewContext();

  if (currentViewId === "canvas") {
    return <IntegratedReactFlowCanvas />;
  }

  if (!currentViewDef) {
    // Fallback to canvas if definition is missing
    return <IntegratedReactFlowCanvas />;
  }

  switch (currentViewDef.type) {
    case "table":
      return <TableView view={currentViewDef} />;
    case "kanban":
      return <KanbanView view={currentViewDef} />;
    case "markdown":
      return <MarkdownView view={currentViewDef} />;
    default:
      return <IntegratedReactFlowCanvas />;
  }
}
