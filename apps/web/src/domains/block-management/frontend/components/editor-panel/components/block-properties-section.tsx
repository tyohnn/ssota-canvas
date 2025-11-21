/**
 * Block Properties Section
 *
 * 블록의 기본 속성을 스키마 기반으로 렌더링하는 섹션
 */

'use client';

import { getBlockEditorSchema } from './block-editor-schema-registry';
import { PropertyGroup } from './property-group';
import { BlockPropertyRenderer } from './block-property-renderer';

export interface BlockPropertiesSectionProps {
  blockId: string;
  blockData: any;
}

export function BlockPropertiesSection({
  blockId,
  blockData,
}: BlockPropertiesSectionProps) {
  // 블록 타입에 따른 에디터 스키마 조회
  const blockType = blockData.blockType as string;
  const uiSchema = getBlockEditorSchema(blockType);

  if (!uiSchema) {
    return null; // UI 스키마가 없으면 렌더링하지 않음
  }

  // 그룹을 순서대로 정렬
  const sortedGroups = [...uiSchema.groups].sort((a, b) => a.order - b.order);

  return (
    <div>
      {sortedGroups.map(group => (
        <PropertyGroup key={group.id} group={group}>
          {/* 그룹 내 속성들을 순서대로 렌더링 */}
          {group.properties
            .map(propertyKey => {
              const propertyDef = uiSchema.properties[propertyKey];
              if (!propertyDef) return null;

              // showIf 조건 체크
              if (
                propertyDef.showIf &&
                !propertyDef.showIf(blockData.properties || {})
              ) {
                return null;
              }

              return { propertyKey, propertyDef };
            })
            .filter(Boolean)
            .sort((a, b) => a!.propertyDef.order - b!.propertyDef.order)
            .map(item => {
              // 메타데이터는 실제 블록 데이터에서 가져오기
              let value = blockData.properties?.[item!.propertyKey];

              if (item!.propertyKey === 'createdAt') {
                value = blockData.createdAt;
              } else if (item!.propertyKey === 'updatedAt') {
                value = blockData.updatedAt;
              } else if (item!.propertyKey === 'createdBy') {
                value = blockData.createdByProfile || blockData.createdBy;
              }

              return (
                <BlockPropertyRenderer
                  key={item!.propertyKey}
                  blockId={blockId}
                  propertyKey={item!.propertyKey}
                  propertyDef={item!.propertyDef}
                  value={value}
                  blockData={blockData}
                />
              );
            })}
        </PropertyGroup>
      ))}
    </div>
  );
}
