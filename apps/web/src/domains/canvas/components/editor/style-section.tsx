"use client";

import React from "react";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";
import { useUiLayout } from "@/domains/canvas/contexts/UiLayoutContext";
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import {
  getMergedFields,
  separateFieldsByType,
  type EditorField,
} from "@/domains/canvas/policy/block-editor-policy";
import { PropertyInput } from "./property-input/property-input";
import {
  isComponentInstance,
  isComponentDefinition,
  type ComponentDefinition,
  type ComponentInstance,
} from "@/domains/canvas/types/component";
import { Badge } from "@workspace/ui/components/ui/badge";
import { Button } from "@workspace/ui/components/ui/button";
import { RotateCcw } from "lucide-react";

interface StyleSectionProps {
  className?: string;
}

export function StyleSection({ className }: StyleSectionProps) {
  const { blocksById, getComponentDefinitionById } = useCanvasData();
  const { selectedBlockIdForEditor } = useUiLayout();
  const { resetInstanceStyle } = useCanvasCommandsContext();

  const activeBlockId = selectedBlockIdForEditor;
  const block = activeBlockId ? blocksById[activeBlockId] : null;

  // 컴포넌트 정보 확인
  const componentInfo = React.useMemo(() => {
    if (!block) return null;

    if (isComponentInstance(block)) {
      const componentId = block.metadata.component_id as string;
      const definition = blocksById[componentId] as ComponentDefinition;

      return {
        type: "instance" as const,
        instance: block,
        definition,
        hasStyleOverrides: !!(
          block.metadata.node_ui &&
          Object.keys(block.metadata.node_ui).length > 0
        ),
      };
    }

    if (isComponentDefinition(block)) {
      return {
        type: "definition" as const,
        definition: block,
      };
    }

    return null;
  }, [block, blocksById]);

  const fields = React.useMemo<EditorField[]>(() => {
    if (!block) return [] as EditorField[];
    const allFields = getMergedFields(block, getComponentDefinitionById);
    // 스타일 필드만 추출
    const { styleFields } = separateFieldsByType(allFields);
    return styleFields;
  }, [block, getComponentDefinitionById]);

  const renderStyleField = (field: EditorField) => {
    return <PropertyInput key={field.key} block={block!} field={field} />;
  };

  if (!block) {
    return (
      <div className={`space-y-2 ${className || ""}`}>
        <div className="text-sm font-medium text-muted-foreground px-3 py-2">
          블록을 선택하여 스타일을 편집하세요
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1 ${className || ""}`}>
      {/* Style Section Header */}
      <div className="px-3 py-2">
        <h3 className="text-sm font-medium text-muted-foreground select-none">
          Style
        </h3>
      </div>

      {/* Component Info */}
      {componentInfo && (
        <div className="px-3 py-2 space-y-2">
          {componentInfo.type === "instance" && (
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                Component Instance
              </Badge>
              {componentInfo.hasStyleOverrides && (
                <Badge variant="outline" className="text-xs text-orange-600">
                  Custom Style
                </Badge>
              )}
              {componentInfo.hasStyleOverrides && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={async () => {
                    if (componentInfo.instance) {
                      const result = await resetInstanceStyle(
                        componentInfo.instance.id
                      );
                      if (!result.ok) {
                        console.error(
                          "Failed to reset style:",
                          result.error
                        );
                      }
                    }
                  }}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              )}
            </div>
          )}
          {componentInfo.type === "definition" && (
            <div className="flex items-center gap-2">
              <Badge
                variant="default"
                className="text-xs flex items-center gap-1"
              >
                Component Definition
              </Badge>
            </div>
          )}
        </div>
      )}

      {/* Style Fields */}
      <div className="space-y-1">
        {fields.length > 0 ? (
          fields.map(renderStyleField)
        ) : (
          <div className="px-3 py-1 text-sm text-muted-foreground">
            편집 가능한 스타일이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
