"use client";

import { PropertyInput } from "./property-input/property-input";
import { Badge } from "@workspace/ui/components/ui/badge";
import { SchemaField } from "@/domains/blocks/types/common.node";
import { ComponentInfo } from "./editor-panel";

interface StyleSectionProps {
  formData: Record<string, unknown> | undefined;
  schemaFields: SchemaField[];
  componentInfo: ComponentInfo | null;
}

export function StyleSection({ 
  formData,
  schemaFields,
  componentInfo,
}: StyleSectionProps) {
  
  const renderStyleField = (field: SchemaField) => {
    // formData가 undefined인 경우 빈 객체 사용
    const safeFormData = formData || {};
    const data = safeFormData[field.id];
    // componentInfo가 null인 경우 overrides도 null로 처리
    const isOverridden = componentInfo?.overrides?.nodeUI?.includes(field.id) || false;
    return (
      <PropertyInput 
        key={field.id}
        field={field}
        data={data}
        isOverridden={isOverridden}
      />
    );
  };

  if (!schemaFields.length) {
    return null;
  }

  return (
    <div className="space-y-1 mb-4">
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
        {schemaFields.length > 0 ? (
          schemaFields.map(renderStyleField)
        ) : (
          <div className="px-3 py-1 text-sm text-muted-foreground">
            편집 가능한 스타일이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}
