"use client";

import React from "react";
import { Input } from "@workspace/ui/components/ui/input";
import { Button } from "@workspace/ui/components/ui/button";
import { Separator } from "@workspace/ui/components/ui/separator";
import { Copy, Trash2 } from "lucide-react";
import type { Block } from "@/db/schema";
import type { EditorField } from "@/domains/canvas/policy/block-editor-policy";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import type {
  DefaultMetadata,
  UserSchemaField,
} from "@/domains/canvas/policy/block-rendering-policy";
import { useSchemaFieldEditor } from "./useSchemaFieldEditor";

export function GenericFieldPopover({
  block,
  field,
  onClose,
}: {
  block: Block;
  field: EditorField;
  onClose?: () => void;
}) {
  const metadata = (block.metadata || {}) as DefaultMetadata;
  const userFields = metadata.schema?.fields || [];
  const userField = userFields.find((f) => f.id === field.key);
  const isPredefined = !!(userField as any)?.config?.predefined;

  const [label, setLabel] = React.useState<string>(field.label || "");

  const { saveLabel, deleteField, duplicateField } = useSchemaFieldEditor({
    block,
    field,
  });

  const handleSaveLabel = () => {
    if (isPredefined) return;
    void saveLabel(label);
  };

  const handleDelete = () => {
    if (isPredefined) return;
    void deleteField();
    onClose?.();
  };

  const handleDuplicate = () => {
    void duplicateField({ label: label || field.label });
  };

  return (
    <div className="p-1">
      <div className="p-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
          onBlur={handleSaveLabel}
          disabled={isPredefined}
          placeholder="Field label"
          className="h-7 text-xs"
        />
        {isPredefined && (
          <div className="text-xs text-muted-foreground mt-1">
            Built-in field label
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-1 mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8 px-2"
          onClick={handleDuplicate}
        >
          <Copy className="w-3.5 h-3.5 mr-2" />
          Duplicate
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleDelete}
          disabled={isPredefined}
        >
          <Trash2 className="w-3.5 h-3.5 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export default GenericFieldPopover;
