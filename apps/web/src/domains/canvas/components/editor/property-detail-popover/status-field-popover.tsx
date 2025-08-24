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

type StatusOption = {
  label: string;
  value: string;
  group: "todo" | "inProgress" | "done";
  color?: string;
};

// Status groups with default options
const statusGroups = {
  todo: {
    label: "할일",
    color: "bg-gray-100 border-gray-300 text-gray-900",
    dotColor: "bg-gray-500",
  },
  inProgress: {
    label: "진행중",
    color: "bg-blue-100 border-blue-300 text-blue-900",
    dotColor: "bg-blue-500",
  },
  done: {
    label: "완료",
    color: "bg-emerald-100 border-emerald-300 text-emerald-900",
    dotColor: "bg-emerald-500",
  },
};

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

export function StatusFieldPopover({
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
    | (UserSchemaField & { options?: StatusOption[] })
    | undefined;
  const isPredefined = !!userField?.config?.predefined;

  const [label, setLabel] = React.useState<string>(field.label || "");

  // Get all options including defaults and user-defined
  const defaultOptions = [
    { label: "Draft", value: "draft", group: "todo" as const, color: "gray" },
    {
      label: "In Progress",
      value: "in_progress",
      group: "inProgress" as const,
      color: "blue",
    },
    {
      label: "Complete",
      value: "complete",
      group: "done" as const,
      color: "green",
    },
  ];

  const userOptions = (userField?.options || []) as StatusOption[];
  const initialOptions: StatusOption[] =
    userOptions && userOptions.length > 0 ? userOptions : defaultOptions;

  const [options, setOptions] = React.useState<StatusOption[]>(initialOptions);

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
        group: o.group,
        color: o.color,
      })),
    });
  };

  const commitOptions = (next: StatusOption[]) => {
    setOptions(next);
    void commitOptionsPersist(
      next.map((n) => ({
        label: n.label,
        value: n.value,
        group: n.group,
        color: n.color,
      }))
    );
  };

  const addStatus = (group: "todo" | "inProgress" | "done") => {
    const palette = COLOR_OPTIONS;
    const idx = Math.floor(Math.random() * (palette.length || 1));
    const colorValue = palette[idx]?.value ?? "gray";

    const newStatus: StatusOption = {
      label: "New status",
      value: createSlug(`status_${Date.now()}`),
      group,
      color: colorValue,
    };
    commitOptions([...(options || []), newStatus]);
  };

  const updateStatus = (idx: number, patch: Partial<StatusOption>) => {
    const next = options.map((o, i) => (i === idx ? { ...o, ...patch } : o));
    commitOptions(next);
  };

  const removeStatus = (idx: number) => {
    const next = options.filter((_, i) => i !== idx);
    commitOptions(next);
  };

  const groupedOptions = {
    todo: options.filter((opt) => opt.group === "todo"),
    inProgress: options.filter((opt) => opt.group === "inProgress"),
    done: options.filter((opt) => opt.group === "done"),
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
        {Object.entries(statusGroups).map(([groupKey, groupConfig]) => (
          <div key={groupKey} className="mb-3 last:mb-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-medium text-muted-foreground">
                {groupConfig.label}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() =>
                  addStatus(groupKey as "todo" | "inProgress" | "done")
                }
                disabled={isPredefined}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="space-y-1">
              {groupedOptions[groupKey as keyof typeof groupedOptions].map(
                (status) => {
                  const isDefaultOption = defaultOptions.find(
                    (def) => def.value === status.value
                  );
                  const isEditable = !isPredefined;
                  const globalIndex = options.findIndex(
                    (o) => o.value === status.value
                  );

                  return (
                    <Popover key={status.value}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start h-7 px-2"
                          disabled={!isEditable}
                        >
                          <Badge
                            className={`gap-1.5 h-5 ${getBadgeStyle(status.color || "gray")}`}
                          >
                            <span className="text-xs">{status.label}</span>
                          </Badge>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-1">
                        <div className="p-2">
                          <div className="space-y-1 mb-2">
                            <div className="text-xs text-muted-foreground">
                              Status label
                            </div>
                            <Input
                              value={status.label}
                              onChange={(e) => {
                                // Update local state immediately for UI responsiveness
                                const newLabel = e.currentTarget.value;
                                const next = options.map((o, i) =>
                                  i === globalIndex
                                    ? { ...o, label: newLabel }
                                    : o
                                );
                                setOptions(next);
                              }}
                              onBlur={() => {
                                // Save to SSOT block and DB when focus is lost
                                if (globalIndex >= 0) {
                                  updateStatus(globalIndex, {
                                    label: status.label,
                                  });
                                }
                              }}
                              className="h-7 text-xs"
                              disabled={!isEditable}
                            />
                          </div>

                          <div className="space-y-1 mb-2">
                            <div className="text-xs text-muted-foreground">
                              Color
                            </div>
                            <div className="space-y-1">
                              {COLOR_OPTIONS.map((color) => (
                                <Button
                                  key={color.value}
                                  variant="ghost"
                                  size="sm"
                                  className={`w-full justify-start h-8 px-2 ${
                                    status.color === color.value
                                      ? "bg-accent"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    globalIndex >= 0 &&
                                    updateStatus(globalIndex, {
                                      color: color.value,
                                    })
                                  }
                                  disabled={!isEditable}
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
                              onClick={() =>
                                globalIndex >= 0 && removeStatus(globalIndex)
                              }
                              disabled={!isEditable}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  );
                }
              )}
            </div>
          </div>
        ))}
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

export default StatusFieldPopover;
