"use client";

import React, { useState } from "react";
import { Input } from "@workspace/ui/components/ui/input";
import { Textarea } from "@workspace/ui/components/ui/textarea";
import { Button } from "@workspace/ui/components/ui/button";
import type { EditorField } from "@/domains/canvas/policy/block-editor-policy";
import type { Block } from "@/db/schema";
import { getValue } from "../object-path";
import { useBlockPropertyUpdate } from "../useBlockPropertyUpdate";

export function TextProperty({
  block,
  field,
}: {
  block: Block;
  field: EditorField;
}) {
  const { updateMetadata } = useBlockPropertyUpdate(block);
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const value = (getValue(block?.metadata || {}, field.path) ?? "") as string;
  const isMultiLine = value.includes("\n");

  const handleLabelClick = () => {
    setIsEditing(true);
    setInputValue(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.currentTarget.value);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.currentTarget.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    if (inputValue !== value) {
      updateMetadata(field.path, inputValue);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Shift+Enter: 줄바꿈 추가
        const cursorPosition = e.currentTarget.selectionStart ?? 0;
        const newValue =
          inputValue.slice(0, cursorPosition) +
          "\n" +
          inputValue.slice(cursorPosition);
        setInputValue(newValue);
        // 커서 위치 조정
        setTimeout(() => {
          e.currentTarget.setSelectionRange(
            cursorPosition + 1,
            cursorPosition + 1
          );
        }, 0);
      } else {
        // Enter: 저장
        setIsEditing(false);
        if (inputValue !== value) {
          updateMetadata(field.path, inputValue);
        }
      }
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(value);
    }
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        // Shift+Enter: 줄바꿈 추가 (기본 동작)
        return;
      } else {
        // Enter: 저장
        e.preventDefault();
        setIsEditing(false);
        if (inputValue !== value) {
          updateMetadata(field.path, inputValue);
        }
      }
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputValue(value);
    }
  };

  if (isEditing) {
    if (isMultiLine || inputValue.includes("\n")) {
      return (
        <Textarea
          className="resize-none text-xs min-h-[60px]"
          rows={Math.max(2, inputValue.split("\n").length)}
          placeholder={field.placeholder}
          value={inputValue}
          onChange={handleTextareaChange}
          onBlur={handleInputBlur}
          onKeyDown={handleTextareaKeyDown}
          autoFocus
        />
      );
    }

    return (
      <Input
        className="h-7 px-2 py-1 text-xs"
        placeholder={field.placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        autoFocus
      />
    );
  }

  const displayValue = value || "Click to edit";
  const displayText = isMultiLine
    ? value.split("\n").slice(0, 2).join("\n") +
      (value.split("\n").length > 2 ? "..." : "")
    : displayValue;

  return (
    <Button
      variant="ghost"
      className="w-full h-auto min-h-7 px-2 py-1 text-sm justify-start font-normal text-left hover:bg-muted/50 whitespace-pre-wrap text-muted-foreground select-none cursor-pointer"
      onClick={handleLabelClick}
    >
      {displayText}
    </Button>
  );
}
