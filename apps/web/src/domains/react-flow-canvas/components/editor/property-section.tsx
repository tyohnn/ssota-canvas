"use client";

import React from "react";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useSingleNodeSelection } from "@/domains/react-flow-canvas/contexts/SelectionContext";
import {
  getMergedFields,
  addUserSchemaField,
  separateFieldsByType,
  type EditorField,
} from "@/domains/canvas/policy/block-editor-policy";
import { PropertyInput } from "./property-input/property-input";
import { PropertyAddPopover } from "./property-add-popover";
import { ensureSchemaInitialized } from "@/domains/canvas/policy/block-editor-policy";

interface PropertySectionProps {
  className?: string;
}

export function PropertySection({ className }: PropertySectionProps) {
  const { blocksById, upsertBlock, getComponentDefinitionById } =
    useCanvasData();
  const { selectedNodeId } = useSingleNodeSelection();

  const block = selectedNodeId ? blocksById[selectedNodeId] : null;

  // Ensure schema is initialized and persist if needed
  React.useEffect(() => {
    if (!block) return;
    const { metadata, changed } = ensureSchemaInitialized(block);
    if (changed) {
      upsertBlock({ ...block, metadata });
    }
  }, [block, upsertBlock]);

  const fields = React.useMemo<EditorField[]>(() => {
    if (!block) return [] as EditorField[];
    const allFields = getMergedFields(block, getComponentDefinitionById);
    // hidden 타입의 필드들을 필터링하여 제거
    const visibleFields = allFields.filter((field) => field.type !== "hidden");
    // 스타일 필드 제외하고 속성 필드만 추출
    const { propertyFields } = separateFieldsByType(visibleFields);
    return propertyFields;
  }, [block, getComponentDefinitionById]);

  const renderPropertyField = (field: EditorField) => {
    return <PropertyInput key={field.key} block={block!} field={field} />;
  };

  if (!block) {
    return (
      <div className={`space-y-2 ${className || ""}`}>
        <div className="text-sm font-medium text-muted-foreground px-3 py-2">
          블록을 선택하여 속성을 편집하세요
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className || ""}`}>
      {/* Property Section Header */}
      <div className="px-3 py-2">
        <h3 className="text-sm font-medium text-muted-foreground select-none">
          Properties
        </h3>
      </div>

      {/* Property Fields */}
      <div className="space-y-1">
        {fields.length > 0 ? (
          fields.map(renderPropertyField)
        ) : (
          <div className="px-3 py-1 text-sm text-muted-foreground">
            편집 가능한 속성이 없습니다
          </div>
        )}

        {/* Add Property Popover */}
        <div className="px-3 py-2">
          <PropertyAddPopover
            onAdd={(newField) => {
              if (!block) return;
              const { metadata } = addUserSchemaField(block, newField);
              upsertBlock({ ...block, metadata });
            }}
          />
        </div>
      </div>
    </div>
  );
}
