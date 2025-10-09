'use client';

import React from 'react';
import { Node } from '@xyflow/react';
import { Checkbox } from '@workspace/ui/components/ui/checkbox';
import { SchemaField } from '@/domains/blocks/types/common.node';
import { useNodeFieldUpdate } from '../useNodeFormDataUpdate';

export function CheckboxProperty({
  data,
  field,
  node,
}: {
  data: boolean;
  field: SchemaField;
  node: Node;
}) {
  const { updateField } = useNodeFieldUpdate();

  const handleDivClick = () => {
    updateField(node, field.path, !data);
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
          checked={!!data}
          onCheckedChange={val => updateField(node, field.path, !!val)}
          className="mr-2"
        />
      </div>
      <span className="text-muted-foreground">{field.id}</span>
    </div>
  );
}
