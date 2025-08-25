"use client";

import React from "react";
import type { EditorField } from "@/domains/canvas/policy/block-editor-policy";
import type { Block } from "@/db/schema";
import {
  isComponentInstance,
  getEffectiveFieldValue,
  isFieldOverridden,
} from "@/domains/canvas/types/component";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import {
  Calendar,
  Star,
  List,
  FileText,
  Mail,
  Phone,
  Hash,
  Palette,
  Square,
  CheckSquare,
  Link,
  Type,
} from "lucide-react";

// Import all input components
import {
  TextProperty,
  SelectProperty,
  StatusProperty,
  CheckboxProperty,
  UrlProperty,
  NumberProperty,
  ColorProperty,
  ShapeProperty,
  DateProperty,
  MultiSelectProperty,
  FileProperty,
  EmailProperty,
  PhoneProperty,
  HiddenProperty,
} from "./inputs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";
import GenericFieldPopover from "../property-detail-popover/generic-field-popover";
import SelectLikeFieldPopover from "../property-detail-popover/select-like-field-popover";
import StatusFieldPopover from "../property-detail-popover/status-field-popover";

interface PropertyInputProps {
  block: Block;
  field: EditorField;
}

export function PropertyInput({ block, field }: PropertyInputProps) {
  const { getComponentDefinitionById } = useCanvasData();
  const { resetInstanceField } = useCanvasCommandsContext();

  // Check if this is a component instance and get override info
  const isInstance = isComponentInstance(block);
  const definition = isInstance
    ? getComponentDefinitionById(block.metadata.component_id)
    : null;

  // ✅ 인스턴스 필드가 읽기 전용인지 확인
  const isReadOnly = isInstance && field.config?.readonly;

  // ✅ Node UI 필드는 항상 override 감지 가능
  const isNodeUIField =
    field.path && field.path.length > 1 && field.path[0] === "node_ui";
  const shouldCheckOverride =
    isInstance && definition && (!isReadOnly || isNodeUIField);

  const isOverridden = shouldCheckOverride
    ? isFieldOverridden(block, definition, field.path)
    : false;

  // Calculate effective value for component instances
  const effectiveValue =
    isInstance && definition
      ? getEffectiveFieldValue(block, definition, field.path)
      : undefined;

  const getFieldIcon = () => {
    switch (field.type as string) {
      case "text":
        return <Type className="w-4 h-4 text-muted-foreground" />;
      case "select":
        return <List className="w-4 h-4 text-muted-foreground" />;
      case "status":
        return <Star className="w-4 h-4 text-muted-foreground" />;
      case "checkbox":
        return <CheckSquare className="w-4 h-4 text-muted-foreground" />;
      case "url":
        return <Link className="w-4 h-4 text-muted-foreground" />;
      case "number":
        return <Hash className="w-4 h-4 text-muted-foreground" />;
      case "color":
        return <Palette className="w-4 h-4 text-muted-foreground" />;
      case "shape":
        return <Square className="w-4 h-4 text-muted-foreground" />;
      case "date":
        return <Calendar className="w-4 h-4 text-muted-foreground" />;
      case "multi-select":
        return <List className="w-4 h-4 text-muted-foreground" />;
      case "file":
        return <FileText className="w-4 h-4 text-muted-foreground" />;
      case "email":
        return <Mail className="w-4 h-4 text-muted-foreground" />;
      case "phone":
        return <Phone className="w-4 h-4 text-muted-foreground" />;
      case "hidden":
        return null;
      default:
        return <Type className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const renderFieldInput = () => {
    switch (field.type as string) {
      case "text":
        return <TextProperty block={block} field={field} />;
      case "select":
        return <SelectProperty block={block} field={field} />;
      case "status":
        return <StatusProperty block={block} field={field} />;
      case "checkbox":
        return <CheckboxProperty block={block} field={field} />;
      case "url":
        return <UrlProperty block={block} field={field} />;
      case "number":
        return <NumberProperty block={block} field={field} />;
      case "color":
        return (
          <ColorProperty
            block={block}
            field={field}
            isOverridden={isOverridden}
            effectiveValue={effectiveValue}
            onReset={
              isOverridden
                ? () => {
                    // Reset this specific field to definition value
                    resetInstanceField(block.id, field.path);
                  }
                : undefined
            }
          />
        );
      case "shape":
        return (
          <ShapeProperty
            block={block}
            field={field}
            isOverridden={isOverridden}
            effectiveValue={effectiveValue}
            onReset={
              isOverridden
                ? () => {
                    resetInstanceField(block.id, field.path);
                  }
                : undefined
            }
          />
        );
      case "date":
        return <DateProperty block={block} field={field} />;
      case "multi-select":
        return <MultiSelectProperty block={block} field={field} />;
      case "file":
        return <FileProperty block={block} field={field} />;
      case "email":
        return <EmailProperty block={block} field={field} />;
      case "phone":
        return <PhoneProperty block={block} field={field} />;
      case "hidden":
        return <HiddenProperty block={block} field={field} />;
      default:
        return <TextProperty block={block} field={field} />;
    }
  };

  const isSelectLike = ["select", "multi-select", "status"].includes(
    field.type as string
  );

  const isPredefined = field.config?.predefined;

  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-2 py-1 px-3 rounded-md">
      {isPredefined ? (
        <div className="flex items-center gap-2 min-w-[140px] select-none rounded-md px-1 py-1">
          {getFieldIcon()}
          <span className="text-sm font-medium truncate">{field.label}</span>
        </div>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 min-w-[140px] select-none rounded-md px-1 py-1 hover:bg-muted/50 cursor-pointer"
            >
              {getFieldIcon()}
              <span className="text-sm font-medium truncate">
                {field.label}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0">
            {field.type === "status" ? (
              <StatusFieldPopover block={block} field={field} />
            ) : isSelectLike ? (
              <SelectLikeFieldPopover block={block} field={field} />
            ) : (
              <GenericFieldPopover block={block} field={field} />
            )}
          </PopoverContent>
        </Popover>
      )}
      <div className="flex-1 min-w-0">{renderFieldInput()}</div>
    </div>
  );
}
