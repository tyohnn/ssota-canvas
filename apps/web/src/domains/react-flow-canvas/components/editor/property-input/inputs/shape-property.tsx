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
  type ShapeKey,
} from "@/domains/canvas/policy/shape-policy";
import { RotateCcw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";

const defaultShapes = ShapePolicy.getShapeOptions();

const ShapeIcon = ({
  shape,
  size = "h-4 w-4",
}: {
  shape: string;
  size?: string;
}) => {
  const shapeKey = shape as ShapeKey;
  const shapeDefinition = ShapePolicy.getShapeDefinition(shapeKey);

  // Return the icon directly - the key props are now handled in ShapePolicy
  return shapeDefinition.icon;
};

export function ShapeProperty({
  block,
  field,
  isOverridden = false,
  effectiveValue,
  onReset,
}: {
  block: Block;
  field: EditorField;
  isOverridden?: boolean;
  effectiveValue?: any;
  onReset?: () => void;
}) {
  const { updateMetadata } = useBlockPropertyUpdate(block);
  const [isEditing, setIsEditing] = useState(false);

  const value =
    (effectiveValue !== undefined
      ? effectiveValue
      : getValue(block?.metadata || {}, field.path)) ?? ("rect" as string);
  const options =
    field.options && field.options.length > 0 ? field.options : defaultShapes;

  const currentShape = options.find((opt) => opt.value === value) || options[0];
  // Use gray color for shape badges (consistent styling)
  const currentColor = "bg-gray-100 border-gray-300";
  const currentTextColor = "text-gray-700";

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
      <div className="flex items-center gap-1">
        <Select
          value={value}
          onValueChange={handleSelectChange}
          onOpenChange={handleSelectOpenChange}
          open={isEditing}
        >
          <SelectTrigger className="flex-1 h-7 text-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition-[color,box-shadow] border-ring ring-ring/50 ring-[3px] select-none cursor-pointer">
            <SelectValue>
              <Badge
                className={`gap-1.5 h-5 ${currentColor} ${currentTextColor}`}
              >
                <ShapeIcon shape={value} size="h-3 w-3" />
                <span>{currentShape?.label}</span>
              </Badge>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="[&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]>span>svg]:shrink-0">
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <Badge className="gap-1.5 h-5 bg-gray-100 border-gray-300 text-gray-700">
                  <ShapeIcon shape={option.value} size="h-3 w-3" />
                  <span>{option.label}</span>
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isOverridden && onReset && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-orange-100"
                onClick={onReset}
              >
                <RotateCcw className="h-3 w-3 text-orange-600" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset to component definition</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        className={`flex-1 h-7 px-2 py-1 text-sm justify-start font-normal text-left hover:bg-muted/50 ${isOverridden ? "border-orange-200 bg-orange-50" : ""}`}
        onClick={handleLabelClick}
      >
        <Badge className={`gap-1.5 h-5 ${currentColor} ${currentTextColor}`}>
          <ShapeIcon shape={value} size="h-3 w-3" />
          <span>
            {currentShape?.label || field.placeholder || "Select shape"}
          </span>
        </Badge>
      </Button>
      {isOverridden && onReset && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-orange-100"
              onClick={onReset}
            >
              <RotateCcw className="h-3 w-3 text-orange-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset to component definition</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
