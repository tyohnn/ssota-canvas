"use client";

import React from "react";
import { useNodeFieldUpdate } from "./useNodeFormDataUpdate";
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
  RotateCcw,
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
import { FileItem } from "./inputs/file-property";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/ui/popover";
import { Button } from "@workspace/ui/components/ui/button";
import { GenericFieldPopover } from "../property-detail-popover/generic-field-popover";
import { SelectLikeFieldPopover } from "../property-detail-popover/select-like-field-popover";
import { StatusFieldPopover } from "../property-detail-popover/status-field-popover";
import { SchemaField } from "@/domains/blocks/types/common.node";
import { Tooltip, TooltipContent, TooltipTrigger } from "@workspace/ui/components/ui/tooltip";
import { useReactFlowNodeSelection } from "@/domains/react-flow-canvas/contexts/ReactFlowSelectionContext";


interface PropertyInputProps {
  field: SchemaField;
  data: unknown;
  isOverridden?: boolean;
}

export function PropertyInput({
  field,
  data,
  isOverridden,
}: PropertyInputProps) {
  const { selectedSingleNode } = useReactFlowNodeSelection();
  const node = selectedSingleNode;
  if (!node) return null;
  const { resetField } = useNodeFieldUpdate();

  const getFieldIcon = () => {
    switch (field.type) {
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
    switch (field.type) {
      case "text":
        return (
          <TextProperty 
            field={field} 
            data={data as string | undefined} 
            node={node}
          />
        );
      case "select":
        return (
          <SelectProperty 
            field={field} 
            data={data as string}
            node={node}
          />
        );
      case "status":
        return (
          <StatusProperty 
            field={field} 
            value={data as string} 
            node={node}
          />
        );
      case "checkbox":
        return (
          <CheckboxProperty 
            field={field} 
            data={data as boolean} 
            node={node}
          />
        );
      case "url":
        return (
          <UrlProperty 
            field={field} 
            data={data as string | undefined} 
            node={node}
          />
        );
      case "number":
        return (
          <NumberProperty 
            field={field} 
            data={data as number | string | undefined} 
            node={node}
          />
        );
      case "color":
        return (
          <ColorProperty
            field={field}
            data={data as string | undefined}
            node={node}
          />
        );
      case "shape":
        return (
          <ShapeProperty
            field={field}
            value={data as string}
            node={node}
          />
        );
      case "date":
          return (
          <DateProperty 
            field={field} 
            data={data as string | undefined} 
            node={node}
          />
        );
      case "multi-select":
        return (
          <MultiSelectProperty 
            field={field} 
            data={data as string[]} 
            node={node}
          />
        );
      case "file":
        return (
          <FileProperty 
            field={field} 
            data={data as FileItem[]} 
            node={node}
          />
        );
      case "email":
        return (
          <EmailProperty 
            field={field} 
            data={data as string | undefined} 
            node={node}
          />
        );
      case "phone":
        return (
          <PhoneProperty 
            field={field} 
            data={data as string | undefined} 
            node={node}
          />
        );
      case "hidden":
        return (
          <HiddenProperty 
            field={field} 
            data={data} 
            node={node}
          />
        );
      default:
        return (
          <TextProperty 
            field={field} 
            data={data as string | undefined} 
            node={node}
          />
        );
    }
  };

  const isSelectLike = ["select", "multi-select", "status"].includes(
    field.type as string
  );

  const isPredefined = field.config?.predefined;

  return (
    <div className={`grid grid-cols-[auto_1fr_auto] items-center gap-2 py-1 px-3 rounded-md${isOverridden ? "border-orange-200 bg-orange-50" : ""}`}>
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
          <PopoverContent side="right" align="center" className="p-0">
            {field.type === "status" ? (
              <StatusFieldPopover field={field} node={node} />
            ) : isSelectLike ? (
              <SelectLikeFieldPopover field={field} node={node} />
            ) : (
              <GenericFieldPopover field={field} node={node} />
            )}
          </PopoverContent>
        </Popover>
      )}
      <div className="flex-1 min-w-0">{renderFieldInput()}</div>
      
      {/* Reset button for overridden fields */}
      {isOverridden && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-orange-100"
              onClick={() => resetField(node, field)}
            >
              <RotateCcw className="h-3 w-3 text-orange-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset to component</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
