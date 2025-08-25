"use client";

import React, { useState } from "react";
import { Input } from "@workspace/ui/components/ui/input";
import { Button } from "@workspace/ui/components/ui/button";
import type { EditorField } from "@/domains/canvas/policy/block-editor-policy";
import type { Block } from "@/db/schema";
import { getValue } from "../object-path";
import { useBlockPropertyUpdate } from "../useBlockPropertyUpdate";

export function NumberProperty({
  block,
  field,
}: {
  block: Block;
  field: EditorField;
}) {
  const { updateMetadata } = useBlockPropertyUpdate(block);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const value = (getValue(block?.metadata || {}, field.path) ?? "") as
    | number
    | string;

  const handleLabelClick = () => {
    setIsEditing(true);
    setInputValue(String(value ?? ""));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.currentTarget.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const parsed = inputValue === "" ? null : Number(inputValue);
    if (parsed !== value) {
      updateMetadata(field.path, parsed);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsEditing(false);
      const parsed = inputValue === "" ? null : Number(inputValue);
      if (parsed !== value) {
        updateMetadata(field.path, parsed);
      }
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(String(value ?? ""));
    }
  };

  if (isEditing) {
    return (
      <Input
        className="h-7 px-2 py-1 text-xs"
        type="number"
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
      className="w-full h-7 px-2 py-1 text-sm justify-start font-normal text-left hover:bg-muted/50 text-muted-foreground select-none cursor-pointer"
      onClick={handleLabelClick}
    >
      {value !== null && value !== ""
        ? String(value)
        : field.placeholder || "Click to edit"}
    </Button>
  );
}
