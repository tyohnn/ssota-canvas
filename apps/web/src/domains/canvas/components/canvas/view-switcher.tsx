"use client";

import React from "react";
import { Button } from "@workspace/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/ui/dropdown-menu";
import {
  Layout,
  Table,
  Kanban,
  ChevronsUpDown,
  FileText,
  Plus,
} from "lucide-react";
import { useViewContext } from "@/domains/canvas/contexts/ViewContext";

type IconType = typeof Layout;

function iconForViewType(type: string): IconType {
  switch (type) {
    case "canvas":
      return Layout;
    case "table":
      return Table;
    case "kanban":
      return Kanban;
    case "markdown":
      return FileText;
    default:
      return Layout;
  }
}

export function ViewSwitcher() {
  const { currentViewId, currentViewDef, availableViews, switchView } =
    useViewContext();

  const currentLabel =
    currentViewId === "canvas"
      ? "Canvas"
      : currentViewDef?.name || currentViewDef?.id || "Canvas";
  const CurrentIcon =
    currentViewId === "canvas"
      ? Layout
      : iconForViewType(currentViewDef?.type || "canvas");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 hover:bg-accent/50"
        >
          <CurrentIcon className="h-3 w-3 mr-1.5" />
          <span className="text-sm font-medium">{currentLabel}</span>
          <ChevronsUpDown size={12} className="text-muted-foreground/80 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => switchView("canvas")}
          className="flex items-center gap-2"
        >
          <Layout className="h-3 w-3" />
          Canvas
        </DropdownMenuItem>
        {availableViews.map((view) => {
          const ViewIcon = iconForViewType(view.type);
          return (
            <DropdownMenuItem
              key={view.id}
              onSelect={() => switchView(view.id)}
              className="flex items-center gap-2"
            >
              <ViewIcon className="h-3 w-3" />
              {view.name}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex items-center gap-2">
          <div className="bg-background flex size-3 items-center justify-center rounded border">
            <Plus className="size-2" />
          </div>
          <span className="text-muted-foreground text-sm">Add view</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
