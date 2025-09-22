"use client";

import React, { useState } from "react";
import { Button } from "@workspace/ui/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover"; 
import {
  ShapePolicy,
  type ColorKey,
} from "@/domains/blocks/policy/shape-policy";
import { SchemaField } from "@/domains/blocks/types/common.node";
import { useNodeFieldUpdate } from "../useNodeFormDataUpdate";
import { Node } from "@xyflow/react";

const predefinedColors = ShapePolicy.getColorOptions();

export function ColorProperty({
  data,
  field,
  node,
}: {
  data: string | undefined;
  field: SchemaField;
  node: Node;
}) {
  const { updateField } = useNodeFieldUpdate();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  
  const rawValue = data || "";
  const value = rawValue.startsWith("#")
    ? ShapePolicy.getClosestColorKey(rawValue)
    : rawValue;

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setInputValue(value);
    }
  };

  const handleColorChange = (newColor: string) => {
    setInputValue(newColor);
    updateField(node, field.path, newColor);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.currentTarget.value);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.currentTarget.value;
    setInputValue(newColor);
    updateField(node, field.path, newColor);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (inputValue !== value) {
        updateField(node, field.path, inputValue);
      }
      setIsOpen(false);
    } else if (e.key === "Escape") {
      setInputValue(value);
      setIsOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={`flex-1 h-7 px-2 py-1 text-sm justify-start font-normal text-left hover:bg-muted/50 transition-[color,box-shadow] select-none cursor-pointer ${
              isOpen
                ? "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] border border-ring ring-ring/50 ring-[3px]"
                : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded border border-border"
                style={{
                  backgroundColor: ShapePolicy.getHexColor(value as ColorKey),
                }}
              />
              <span>
                {ShapePolicy.getColorDefinition(value as ColorKey)?.label ||
                  field.placeholder ||
                  "Select color"}
              </span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 border border-border" align="start">
          <div className="space-y-4">
            {/* Predefined Colors */}
            <div>
              <h4 className="text-sm font-medium mb-2">Preset</h4>
              <div className="grid grid-cols-5 gap-1">
                {predefinedColors.map((color) => (
                  <button
                    key={color.value}
                    title={color.label}
                    onClick={() => handleColorChange(color.value)}
                    style={{
                      backgroundColor: ShapePolicy.getHexColor(color.value as ColorKey),
                    }}
                    className="h-8 w-8 rounded ring-1 ring-black/10 transition hover:scale-110"
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
