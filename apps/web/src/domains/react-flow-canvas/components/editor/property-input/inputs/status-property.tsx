"use client";

import React, { useState } from "react";
import { Node } from "@xyflow/react";
import { Button } from "@workspace/ui/components/ui/button";
import { Badge } from "@workspace/ui/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";
import {
  ShapePolicy,
  type ColorKey,
} from "@/domains/blocks/policy/shape-policy";
import { SchemaField, SchemaFieldOption } from "@/domains/blocks/types/common.node";
import { useNodeFieldUpdate } from "../useNodeFormDataUpdate";

// Status groups with default options
const statusGroups = {
  todo: {
    label: "To Do",
    color: "bg-gray-100 border-gray-300 text-gray-900",
    dotColor: "bg-gray-500",
    defaultOptions: [{ label: "Draft", value: "draft" }],
  },
  inProgress: {
    label: "In Progress",
    color: "bg-blue-100 border-blue-300 text-blue-900",
    dotColor: "bg-blue-500",
    defaultOptions: [{ label: "In Progress", value: "in_progress" }],
  },
  done: {
    label: "Complete",
    color: "bg-emerald-100 border-emerald-300 text-emerald-900",
    dotColor: "bg-emerald-500",
    defaultOptions: [{ label: "Complete", value: "complete" }],
  },
};

const getBadgeStyle = (color: string) => {
  // Use the policy for color-based styling
  if (
    Object.values(ShapePolicy.getColorOptions()).some(
      (opt: SchemaFieldOption) => opt.value === color
    )
  ) {
    return ShapePolicy.getBadgeStyle(color as ColorKey);
  }
  // Fallback for non-policy colors
  return "bg-gray-100 border-gray-200 text-gray-700";
};

const getBadgeStyleObject = (color: string) => {
  // Use the policy for color-based styling
  if (
    Object.values(ShapePolicy.getColorOptions()).some(
      (opt: SchemaFieldOption) => opt.value === color
    )
  ) {
    return ShapePolicy.getBadgeStyleObject(color as ColorKey);
  }
  // Fallback for non-policy colors
  return {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
    color: "#374151",
  };
};

export function StatusProperty({
  value,
  field,
  node,
}: {
  value: string;
  field: SchemaField;
  node: Node;
}) {
    const { updateField } = useNodeFieldUpdate();
  const [isOpen, setIsOpen] = useState(false);

  // Get options from field (includes both default and user-defined with colors)
  const fieldOptions = field.options || [];

  // Define default options with colors for fallback
  const defaultOptionsWithColors = [
    { label: "Draft", value: "draft", group: "todo", color: "gray" },
    {
      label: "In Progress",
      value: "in_progress",
      group: "inProgress",
      color: "blue",
    },
    { label: "Complete", value: "complete", group: "done", color: "green" },
  ];

  // Use field options if available, otherwise use defaults
  const allOptions =
    fieldOptions.length > 0 ? fieldOptions : defaultOptionsWithColors;

  // Group options by their status type
  const groupedOptions = {
    todo: allOptions.filter((opt: SchemaFieldOption) => opt.group === "todo"),
    inProgress: allOptions.filter((opt: SchemaFieldOption) => opt.group === "inProgress"),
    done: allOptions.filter((opt: SchemaFieldOption) => opt.group === "done"),
  };

  const currentOption =
    allOptions.find((opt: SchemaFieldOption) => opt.value === value) ||
    defaultOptionsWithColors[0];

  const handleStatusSelect = (newValue: string) => {
    updateField(node, field.path, newValue);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-7 px-2 py-1 text-sm justify-start font-normal text-left hover:bg-muted/50 select-none cursor-pointer"
        >
          <Badge
            className={`gap-1.5 h-5 ${getBadgeStyle((currentOption as SchemaFieldOption)?.color || "gray")}`}
          >
            <span className="text-xs">
              {currentOption?.label || "상태 선택"}
            </span>
          </Badge>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2">
          {Object.entries(statusGroups).map(([groupKey, groupConfig]) => (
            <div key={groupKey} className="mb-3 last:mb-0">
              <div className="mb-2">
                <h4 className="text-xs font-medium text-muted-foreground">
                  {groupConfig.label}
                </h4>
              </div>
              <div className="space-y-1">
                {groupedOptions[groupKey as keyof typeof groupedOptions].map(
                  (option: SchemaFieldOption) => (
                    <Button
                      key={option.value}
                      variant="ghost"
                      size="sm"
                      className={`w-full justify-start h-8 px-2 ${
                        value === option.value ? "bg-accent" : ""
                      }`}
                      onClick={() => handleStatusSelect(option.value)}
                    >
                      <Badge
                        className={`gap-1.5 h-5 ${getBadgeStyle((option as SchemaFieldOption)?.color || "gray")}`}
                      >
                        <span className="text-xs">{option.label}</span>
                      </Badge>
                    </Button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
