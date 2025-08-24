"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@workspace/ui/components/ui/button";

interface TreeControlsProps {
  item: any; // Headless Tree item type
  hasChildren: boolean;
}

export function TreeControls({ item, hasChildren }: TreeControlsProps) {
  if (!hasChildren) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      className="size-4 p-0 has-[>svg]:p-0 h-4 w-4 rounded-sm text-muted-foreground hover:bg-transparent active:bg-transparent cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        if (item.isExpanded()) item.collapse();
        else item.expand();
      }}
      aria-label={item.isExpanded() ? "Collapse" : "Expand"}
    >
      <ChevronDown
        className="size-4 transition-transform"
        style={{
          transform: item.isExpanded() ? undefined : "rotate(-90deg)",
        }}
      />
    </Button>
  );
}
