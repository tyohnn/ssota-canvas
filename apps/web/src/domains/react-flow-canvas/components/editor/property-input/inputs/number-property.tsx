"use client";

import React, { useState } from "react";
import { Node } from "@xyflow/react";
import { Input } from "@workspace/ui/components/ui/input";
import { Button } from "@workspace/ui/components/ui/button";
import { SchemaField } from "@/domains/blocks/types/common.node";
import { useNodeFieldUpdate } from "../useNodeFormDataUpdate";

export function NumberProperty({
  data,
  field,
  node,
}: {
  data: number | string | undefined;
  field: SchemaField;
  node: Node;
}) {
  const { updateField } = useNodeFieldUpdate();
  const value = data || "";
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleLabelClick = () => {
    setIsEditing(true);
    setInputValue(String(value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.currentTarget.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue) && numValue !== value && node) {
      updateField(node, field.path, numValue);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue) && numValue !== value && node) {
        updateField(node, field.path, numValue);
      }
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(String(value));
    }
  };

  if (isEditing) {
    return (
      <Input
        className="h-7 text-xs"
        type="number"
        placeholder={field.placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        autoFocus
      />
    );
  }

  return (
    <Button
      variant="ghost"
      className="w-full h-auto min-h-7 px-2 py-1 text-sm justify-start font-normal text-left hover:bg-muted/50 cursor-pointer"
      onClick={handleLabelClick}
    >
      {value || (
        <span className="text-muted-foreground">
          {field.placeholder || "Click to edit number"}
        </span>
      )}
    </Button>
  );
}
