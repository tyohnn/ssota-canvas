"use client";

import React from "react";
import { SchemaField } from "@/domains/blocks/types/common.node";
import { useNodeFieldUpdate } from "../useNodeFormDataUpdate";
import { Node } from "@xyflow/react";

export function HiddenProperty({
  data,
  field,
  node,
}: {
  data: unknown;
  field: SchemaField;
  node: Node;
}) {
  const { updateField } = useNodeFieldUpdate();

  const handleChange = (value: unknown) => {
    updateField(node, field.path, value);
  };

  return (
    <div className="w-full h-7 px-2 py-1 text-sm flex items-center">
      <span className="text-muted-foreground">{field.id}</span>
    </div>
  );
}
