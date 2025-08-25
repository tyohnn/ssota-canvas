"use client";

import React from "react";
import { Checkbox } from "@workspace/ui/components/ui/checkbox";
import type { EditorField } from "@/domains/canvas/policy/block-editor-policy";
import type { Block } from "@/db/schema";
import { getValue } from "../object-path";
import { useBlockPropertyUpdate } from "../useBlockPropertyUpdate";

export function CheckboxProperty({
  block,
  field,
}: {
  block: Block;
  field: EditorField;
}) {
  const { updateMetadata } = useBlockPropertyUpdate(block);
  const checked = !!getValue(block?.metadata || {}, field.path);

  const handleDivClick = () => {
    updateMetadata(field.path, !checked);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className="w-full h-7 px-2 py-1 text-sm flex items-center hover:bg-muted/50 select-none cursor-pointer"
      onClick={handleDivClick}
    >
      <div
        onClick={handleCheckboxClick}
        className="flex items-center justify-center"
      >
        <Checkbox
          checked={checked}
          onCheckedChange={(val) => updateMetadata(field.path, !!val)}
          className="mr-2"
        />
      </div>
      <span className="text-muted-foreground">{field.label || field.key}</span>
    </div>
  );
}
