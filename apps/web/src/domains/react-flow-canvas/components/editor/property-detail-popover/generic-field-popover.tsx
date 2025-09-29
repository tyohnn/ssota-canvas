'use client';

import { useState, useEffect } from 'react';
import { Input } from '@workspace/ui/components/ui/input';
import { Label } from '@workspace/ui/components/ui/label';
import { Button } from '@workspace/ui/components/ui/button';
import { Separator } from '@workspace/ui/components/ui/separator';
import { Copy, Trash2 } from 'lucide-react';
import { SchemaField } from '@/domains/blocks/types';
import { useSchemaFieldEditor } from './useSchemaFieldEditor';
import { Node } from '@xyflow/react';

export function GenericFieldPopover({
  node,
  field,
}: {
  node: Node;
  field: SchemaField;
}) {
  const { saveLabel, deleteField, duplicateField } = useSchemaFieldEditor({
    node,
    field,
  });

  const [label, setLabel] = useState(field.label || '');

  // Auto-save label changes
  useEffect(() => {
    if (label !== field.label) {
      saveLabel(label);
    }
  }, [label, field.label, saveLabel]);

  const handleDelete = async () => {
    await deleteField();
  };

  const handleDuplicate = async () => {
    await duplicateField({ label });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <Label
          className="text-xs font-medium text-muted-foreground mb-1 select-none"
          htmlFor={field.id}
        >
          Label
        </Label>
        <Input
          name={field.id}
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Enter field label"
          className="h-7"
        />
      </div>

      <Separator className="bg-border/50" />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDuplicate}
          className="flex-1 h-7 px-2 text-xs"
        >
          <Copy className="w-3 h-3 mr-1" />
          Duplicate
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          className="flex-1 h-7 px-2 text-xs text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
        >
          <Trash2 className="w-3 h-3 mr-1" />
          Delete
        </Button>
      </div>
    </div>
  );
}
