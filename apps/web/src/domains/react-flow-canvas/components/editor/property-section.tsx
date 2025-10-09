'use client';

import { PropertyInput } from './property-input/property-input';
import { PropertyAddPopover } from './property-add-popover';
import { SchemaField } from '@/domains/blocks/types/common.node';
import { ComponentInfo } from './editor-panel';

interface PropertySectionProps {
  formData: Record<string, unknown>;
  schemaFields: SchemaField[];
  componentInfo: ComponentInfo | null;
}

export function PropertySection({
  formData,
  schemaFields,
  componentInfo,
}: PropertySectionProps) {
  // 여기서는 이미 일반 블럭과 인스턴스 블럭, 컴포넌트 블럭 등을 모두 resolve 한 상태로 넘어왔음. 그냥 렌더링 하면 됨
  const renderPropertyField = (field: SchemaField) => {
    console.log(formData);
    const data = formData[field.id];

    // 필드가 오버라이드되었는지 확인 (formData 카테고리 기준)
    const isOverridden =
      componentInfo?.overrides?.formData?.includes(field.id) || false;

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
    return (
      <div className={`space-y-2`}>
        <div className="px-3 py-2">
          <PropertyAddPopover pathSection="formData" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-1`}>
      {/* Property Section Header */}
      <div className="px-3 py-2">
        <h3 className="text-sm font-medium text-muted-foreground select-none">
          Properties
        </h3>
      </div>

      {/* Property Fields */}
      <div className="space-y-1">
        {schemaFields.length > 0 ? (
          schemaFields.map(renderPropertyField)
        ) : (
          <div className="px-3 py-1 text-sm text-muted-foreground">
            편집 가능한 속성이 없습니다
          </div>
        )}

        {/* Add Property Popover */}
        <div className="px-3 py-2">
          <PropertyAddPopover pathSection="formData" />
        </div>
      </div>
    </div>
  );
}
