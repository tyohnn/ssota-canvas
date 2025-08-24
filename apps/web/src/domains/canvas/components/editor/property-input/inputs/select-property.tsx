"use client";

import React, { useState } from "react";
import { Button } from "@workspace/ui/components/ui/button";
import { Badge } from "@workspace/ui/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@workspace/ui/components/ui/select";
import type { EditorField } from "@/domains/canvas/policy/block-editor-policy";
import type { Block } from "@/db/schema";
import { getValue } from "../object-path";
import { useBlockPropertyUpdate } from "../useBlockPropertyUpdate";
import {
  ShapePolicy,
  type ColorKey,
} from "@/domains/canvas/policy/shape-policy";

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

const getBadgeStyleObject = (color: string) => {
  // Use the policy for color-based styling
  if (
    Object.values(ShapePolicy.getColorOptions()).some(
      (opt) => opt.value === color
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

export function SelectProperty({
  block,
  field,
}: {
  block: Block;
  field: EditorField;
}) {
  const { updateMetadata } = useBlockPropertyUpdate(block);
  const [isEditing, setIsEditing] = useState(false);

  const value = (getValue(block?.metadata || {}, field.path) ?? "") as string;
  const options = (field.options || []) as Array<{
    label: string;
    value: string;
    color?: string;
  }>;
  const currentOption = options.find((opt) => opt.value === value);

  const handleLabelClick = () => {
    setIsEditing(true);
  };

  const handleSelectChange = (newValue: string) => {
    setIsEditing(false);
    if (newValue !== value) {
      updateMetadata(field.path, newValue);
    }
  };

  const handleSelectOpenChange = (open: boolean) => {
    if (!open) {
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Select
        value={value}
        onValueChange={handleSelectChange}
        onOpenChange={handleSelectOpenChange}
        open={isEditing}
      >
        <SelectTrigger className="h-7 text-xs focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px] transition-[color,box-shadow] border-ring ring-ring/50 ring-[3px]">
          <SelectValue>
            {currentOption ? (
              <Badge
                className="gap-1.5 h-5"
                style={getBadgeStyleObject(currentOption.color || "gray")}
              >
                <span className="text-xs">{currentOption.label}</span>
              </Badge>
            ) : (
              <Badge
                className="gap-1.5 h-5"
                style={getBadgeStyleObject("gray")}
              >
                <span className="text-xs">
                  {field.placeholder || "Select..."}
                </span>
              </Badge>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <Badge
                className="gap-1.5 h-5"
                style={getBadgeStyleObject(option.color || "gray")}
              >
                <span className="text-xs">{option.label}</span>
              </Badge>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Button
      variant="ghost"
      className="w-full h-7 px-2 py-1 text-sm justify-start font-normal text-left hover:bg-muted/50 select-none cursor-pointer"
      onClick={handleLabelClick}
    >
      {currentOption ? (
        <Badge
          className="gap-1.5 h-5"
          style={getBadgeStyleObject(currentOption.color || "gray")}
        >
          <span className="text-xs">{currentOption.label}</span>
        </Badge>
      ) : (
        <Badge className="gap-1.5 h-5" style={getBadgeStyleObject("gray")}>
          <span className="text-xs">{field.placeholder || "Select..."}</span>
        </Badge>
      )}
    </Button>
  );
}
