"use client";

import React from "react";
import { Button } from "@workspace/ui/components/ui/button";
import { Input } from "@workspace/ui/components/ui/input";
import { Checkbox } from "@workspace/ui/components/ui/checkbox";
import { Separator } from "@workspace/ui/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";

import {
  Plus,
  Type,
  Hash,
  List,
  ListChecks,
  Star,
  Square,
  Palette,
  Calendar,
  CheckSquare,
  Link,
  FileText,
  Mail,
  Phone,
  EyeOff,
} from "lucide-react";
import type {
  EditorFieldType,
  UserSchemaField,
} from "@/domains/canvas/policy/block-rendering-policy";
import { createSlug } from "@/lib/regex";

type PropertyAddPopoverProps = {
  className?: string;
  buttonVariant?: "ghost" | "outline" | "default" | "secondary";
  buttonClassName?: string;
  onAdd: (field: UserSchemaField) => void;
};

const FIELD_TYPES: {
  type: EditorFieldType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { type: "text", label: "Text", icon: <Type className="w-4 h-4" /> },
  { type: "number", label: "Number", icon: <Hash className="w-4 h-4" /> },
  { type: "select", label: "Select", icon: <List className="w-4 h-4" /> },
  {
    type: "multi-select",
    label: "Multi Select",
    icon: <ListChecks className="w-4 h-4" />,
  },
  { type: "status", label: "Status", icon: <Star className="w-4 h-4" /> },
  { type: "date", label: "Date", icon: <Calendar className="w-4 h-4" /> },
  {
    type: "checkbox",
    label: "Checkbox",
    icon: <CheckSquare className="w-4 h-4" />,
  },
  { type: "url", label: "URL", icon: <Link className="w-4 h-4" /> },
  { type: "file", label: "File", icon: <FileText className="w-4 h-4" /> },
  { type: "email", label: "Email", icon: <Mail className="w-4 h-4" /> },
  { type: "phone", label: "Phone", icon: <Phone className="w-4 h-4" /> },
];

export function PropertyAddPopover({
  className,
  buttonVariant = "ghost",
  buttonClassName,
  onAdd,
}: PropertyAddPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const [label, setLabel] = React.useState("");
  const [required, setRequired] = React.useState(false);
  const [placeholder, setPlaceholder] = React.useState("");
  const [optionsStr, setOptionsStr] = React.useState("");
  const labelInputRef = React.useRef<HTMLInputElement>(null);

  const handleAdd = (type: EditorFieldType) => {
    if (!label.trim()) {
      labelInputRef.current?.focus();
      return;
    }

    const id = createSlug(label);
    const base: UserSchemaField = {
      id,
      label: label || "Untitled",
      type,
      validation: required ? { required: true } : undefined,
      placeholder: placeholder || undefined,
    };

    if (type === "select" || type === "multi-select" || type === "status") {
      const parsed = (optionsStr || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((opt) => ({ label: opt, value: opt }));
      (base as UserSchemaField).options = parsed.length ? parsed : undefined;
    }

    onAdd(base);
    setOpen(false);
    // reset lightweight states for next open
    setLabel("");
    setRequired(false);
    setPlaceholder("");
    setOptionsStr("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={buttonVariant}
          size="sm"
          className={
            buttonClassName ||
            "w-fit justify-start text-muted-foreground hover:text-foreground"
          }
        >
          <Plus className="w-4 h-4 mr-2" />
          속성 추가
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <div className="p-3 space-y-3">
          <Input
            ref={labelInputRef}
            value={label}
            onChange={(e) => setLabel(e.currentTarget.value)}
            placeholder="Enter field label"
          />

          <Separator />

          <div className="grid grid-cols-2 gap-2">
            {FIELD_TYPES.map((ft) => (
              <button
                key={ft.type}
                type="button"
                className="flex items-center gap-2 rounded-md border px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleAdd(ft.type)}
              >
                <span className="shrink-0 text-muted-foreground">
                  {ft.icon}
                </span>
                <span className="truncate">{ft.label}</span>
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default PropertyAddPopover;
