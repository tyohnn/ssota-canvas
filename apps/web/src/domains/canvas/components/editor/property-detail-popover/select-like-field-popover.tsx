"use client";

import React from "react";
import { Input } from "@workspace/ui/components/ui/input";
import { Button } from "@workspace/ui/components/ui/button";
import { Badge } from "@workspace/ui/components/ui/badge";
import { Separator } from "@workspace/ui/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";
import { Plus, Trash2, Copy } from "lucide-react";
import type { Block } from "@/db/schema";
import type { EditorField } from "@/domains/canvas/policy/block-editor-policy";
import type {
  DefaultMetadata,
  UserSchemaField,
} from "@/domains/canvas/policy/block-rendering-policy";
import { createSlug } from "@/lib/regex";
import { useSchemaFieldEditor } from "./useSchemaFieldEditor";
import {
  ShapePolicy,
  type ColorKey,
} from "@/domains/canvas/policy/shape-policy";

type OptionItem = { label: string; value: string; color?: string };

// Use SSOT color options from ShapePolicy
const COLOR_OPTIONS = ShapePolicy.getColorOptions();

const getBadgeStyle = (color: string) => {
  // Use the policy for color-based styling
  if (
    Object.values(ShapePolicy.getColorOptions()).some(
      (opt) => opt.value === color
    )
  ) {
    return ShapePolicy.getBadgeStyle(color as ColorKey);
  }
  // Fallback for non-policy colors
  return "bg-gray-100 border-gray-200 text-gray-700";
};

export function SelectLikeFieldPopover({
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
  const userField = userFields.find((f) => f.id === field.key) as
    | (UserSchemaField & { options?: OptionItem[] })
    | undefined;
  const isPredefined = !!userField?.config?.predefined;

  const [label, setLabel] = React.useState<string>(field.label || "");
  const [options, setOptions] = React.useState<OptionItem[]>(
    userField?.options || []
  );

  const {
    saveLabel,
    deleteField,
    duplicateField,
    commitOptions: commitOptionsPersist,
  } = useSchemaFieldEditor({ block, field });

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
    void duplicateField({
      label: label || field.label,
      options: options.map((o) => ({
        label: o.label,
        value: o.value,
        color: o.color,
      })),
    });
  };

  const commitOptions = (next: OptionItem[]) => {
    setOptions(next);
    if (isPredefined) return;
    void commitOptionsPersist(
      next.map((n) => ({ label: n.label, value: n.value, color: n.color }))
    );
  };

  const addOption = () => {
    const palette = COLOR_OPTIONS;
    const idx = Math.floor(Math.random() * (palette.length || 1));
    const colorValue = palette[idx]?.value ?? "gray";
    const newOpt: OptionItem = {
      label: "New option",
      value: createSlug(`opt_${Date.now()}`),
      color: colorValue,
    };
    commitOptions([...(options || []), newOpt]);
  };

  const updateOption = (idx: number, patch: Partial<OptionItem>) => {
    const next = options.map((o, i) => (i === idx ? { ...o, ...patch } : o));
    commitOptions(next);
  };

  const removeOption = (idx: number) => {
    const next = options.filter((_, i) => i !== idx);
    commitOptions(next);
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
      </div>

      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-muted-foreground">Options</div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={addOption}
            disabled={isPredefined}
          >
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="space-y-1">
          {(options || []).map((opt, idx) => (
            <Popover key={opt.value}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start h-7 px-2"
                  disabled={isPredefined}
                >
                  <Badge
                    className={`gap-1.5 h-5 border-gray-300 ${getBadgeStyle(opt.color || "gray")}`}
                  >
                    <span className="text-xs">{opt.label}</span>
                  </Badge>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-1">
                <div className="p-2">
                  <div className="space-y-1 mb-2">
                    <Input
                      value={opt.label}
                      onChange={(e) =>
                        updateOption(idx, { label: e.currentTarget.value })
                      }
                      className="h-7 text-xs"
                      disabled={isPredefined}
                    />
                  </div>

                  <div className="space-y-1 mb-2">
                    <div className="text-xs text-muted-foreground">Color</div>
                    <div className="space-y-1">
                      {COLOR_OPTIONS.map((color) => (
                        <Button
                          key={color.value}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-8 px-2"
                          onClick={() =>
                            updateOption(idx, { color: color.value })
                          }
                          disabled={isPredefined}
                        >
                          <span className="inline-flex items-center gap-2">
                            <span
                              className={`w-3 h-3 rounded-full border border-border ${getBadgeStyle(color.value)}`}
                            />
                            <span className="text-xs truncate">
                              {color.label}
                            </span>
                          </span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeOption(idx)}
                      disabled={isPredefined}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-1 mt-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8 px-2"
          onClick={handleDuplicate}
          disabled={isPredefined}
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

export default SelectLikeFieldPopover;
