"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import MultipleSelector, {
  type Option as MultiOption,
} from "@workspace/ui/components/ui/multiselect";
import { Button } from "@workspace/ui/components/ui/button";
import { Badge } from "@workspace/ui/components/ui/badge";
import {
  ShapePolicy,
  type ColorKey,
} from "@/domains/blocks/policy/shape-policy";
import { SchemaField } from "@/domains/blocks/types/common.node";
import { useNodeFieldUpdate } from "../useNodeFormDataUpdate";
import { Node } from "@xyflow/react";

const getBadgeStyle = (color: string) => {
  // Use the policy for color-based styling
  if (
    Object.values(ShapePolicy.getColorOptions()).some(
      (opt) => opt.value === color
    )
  ) {
    return ShapePolicy.getBadgeStyle(color as ColorKey);
  }
  // Fallback for non-policy colors
  return "bg-gray-100 border-gray-200 text-gray-700";
};

export function MultiSelectProperty({
  data,
  field,
  node,
}: {
  data: string[];
  field: SchemaField;
  node: Node;
}) {
  const { updateField } = useNodeFieldUpdate();
  const currentValues: string[] = data || [];

  const allOptions: MultiOption[] = useMemo(
    () =>
      (field.options || []).map((o) => ({
        value: String(o.value),
        label: o.label,
        color: (o as any).color,
      })),
    [field.options]
  );

  const deriveSelected = () =>
    allOptions.filter((opt) => currentValues.includes(opt.value));

  const [isEditing, setIsEditing] = useState(false);
  const [selected, setSelected] = useState<MultiOption[]>(deriveSelected());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep local state in sync when metadata/options change outside
    setSelected(deriveSelected());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValues.join("|"), field.options]);

  const handleOpen = () => {
    setSelected(deriveSelected());
    setIsEditing(true);
    // Auto-focus the input after a short delay to trigger dropdown
    setTimeout(() => {
      const input = containerRef.current?.querySelector("input");
      if (input) {
        input.focus();
      }
    }, 10);
  };

  const handleChange = (next: MultiOption[]) => {
    setSelected(next);
    updateField(
      node,
      field.path,
      next.map((n) => n.value)
    );
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Escape") {
      setIsEditing(false);
    }
  };

  const handleBlur: React.FocusEventHandler<HTMLDivElement> = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    const hasSelection = selected.length > 0;
    return (
      <Button
        variant="ghost"
        className="w-full h-7 px-2 py-1 text-sm justify-start font-normal text-left hover:bg-muted/50 select-none cursor-pointer"
        onClick={handleOpen}
      >
        {hasSelection ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {selected.map((opt) => (
              <Badge
                key={opt.value}
                className={`h-5 px-1.5 text-xs font-medium ${getBadgeStyle((opt as any).color || "gray")}`}
              >
                {opt.label}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">
            {field.placeholder || "Select options"}
          </span>
        )}
      </Button>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      <MultipleSelector
        value={selected.map((opt: MultiOption) => ({
          ...opt,
          label: opt.label,
          value: opt.value,
          color: opt.color as ColorKey,
        }))}
        defaultOptions={allOptions}
        onChange={handleChange}
        placeholder={field.placeholder || "Select options"}
        commandProps={{ label: field.label || "Select" }}
        hideClearAllButton
        hidePlaceholderWhenSelected
        emptyIndicator={<p className="text-center text-sm">No results found</p>}
      />
    </div>
  );
}
