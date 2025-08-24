"use client";

import React, { useState } from "react";
import { Button } from "@workspace/ui/components/ui/button";
import { Input } from "@workspace/ui/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";
import type { EditorField } from "@/domains/canvas/policy/block-editor-policy";
import type { Block } from "@/db/schema";
import { getValue } from "../object-path";
import { useBlockPropertyUpdate } from "../useBlockPropertyUpdate";
import {
  ShapePolicy,
  type ColorKey,
} from "@/domains/canvas/policy/shape-policy";
import { RotateCcw } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@workspace/ui/components/ui/tooltip";

const predefinedColors = ShapePolicy.getColorOptions();

export function ColorProperty({
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
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const rawValue =
    (effectiveValue !== undefined
      ? effectiveValue
      : getValue(block?.metadata || {}, field.path)) ??
    (ShapePolicy.getDefaultColor() as string);
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
    updateMetadata(field.path, newColor);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.currentTarget.value);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.currentTarget.value;
    setInputValue(newColor);
    updateMetadata(field.path, newColor);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (inputValue !== value) {
        updateMetadata(field.path, inputValue);
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
            } ${isOverridden ? "border-orange-200 bg-orange-50" : ""}`}
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
                {predefinedColors.map((colorOption) => (
                  <button
                    key={colorOption.value}
                    title={colorOption.label}
                    onClick={() => handleColorChange(colorOption.value)}
                    style={{
                      backgroundColor: ShapePolicy.getHexColor(
                        colorOption.value as ColorKey
                      ),
                    }}
                    className="h-8 w-8 rounded ring-1 ring-black/10 transition hover:scale-110"
                  />
                ))}
              </div>
            </div>

            {/* Color Picker - Temporarily disabled */}
            {/* <div>
            <h4 className="text-sm font-medium mb-2">Custom Color</h4>
            <div className="flex items-center gap-2">
              <Input
                className="h-8 w-16 p-1"
                type="color"
                value={inputValue}
                onChange={handleCustomColorChange}
              />
              <Input
                className="h-8 px-2 py-1 text-xs flex-1"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleInputKeyDown}
                placeholder={
                  field.placeholder ||
                  ColorShapePolicy.getHexColor(
                    ColorShapePolicy.getDefaultColor()
                  )
                }
                autoFocus
              />
            </div>
          </div> */}
          </div>
        </PopoverContent>
      </Popover>
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
