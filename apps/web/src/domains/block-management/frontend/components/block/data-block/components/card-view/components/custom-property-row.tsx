/**
 * Custom Property Row Component
 *
 * 커스텀 속성 한 행 렌더링
 * custom-property-item과 동일한 디자인 (읽기 전용)
 */

'use client';

import { Badge } from '@workspace/ui/components/ui/badge';

import { Box } from '@/components/ui/box';
import { PropertyType } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import {
  TextProperty,
  SelectProperty,
  StatusProperty,
  MultiSelectProperty,
  CheckboxProperty,
  NumberProperty,
  UrlProperty,
  EmailProperty,
  PhoneProperty,
  ColorProperty,
} from '@/domains/block-management/frontend/components/editor-panel/components/property-input';
import type { PropertyUIDefinition } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { PropertyIcon } from '@/domains/block-management/frontend/components/editor-panel/components/custom-properties-section/components/custom-property-item/components/property-icon';

import type { CustomPropertyRowProps } from '../core/types';

/**
 * CustomPropertyDefinition을 PropertyUIDefinition으로 변환
 */
function buildPropertyDefinition(
  property: CustomPropertyRowProps['property']
): PropertyUIDefinition {
  const typeMapping: Record<PropertyType, PropertyUIDefinition['inputType']> = {
    [PropertyType.TEXT]: 'text',
    [PropertyType.SELECT]: 'select',
    [PropertyType.MULTISELECT]: 'multi-select',
    [PropertyType.STATUS]: 'status',
    [PropertyType.PROFILE]: 'profile',
    [PropertyType.DATE]: 'datetime',
    [PropertyType.NUMBER]: 'number',
    [PropertyType.BOOLEAN]: 'checkbox',
    [PropertyType.COLOR]: 'color',
    [PropertyType.URL]: 'url',
    [PropertyType.EMAIL]: 'email',
    [PropertyType.PHONE]: 'phone',
  };

  return {
    label: property.name,
    inputType: typeMapping[property.type] ?? 'text',
    icon: property.icon ?? undefined,
    description: property.validation?.message,
    placeholder: property.name,
    order: property.order,
    readonly: true, // 읽기 전용
    options: property.options,
  };
}

/**
 * Custom Property Row
 *
 * custom-property-item과 동일한 디자인 (읽기 전용)
 */
export function CustomPropertyRow({ property, value }: CustomPropertyRowProps) {
  const propertyDef = buildPropertyDefinition(property);

  const renderValue = () => {
    // Property 컴포넌트들을 읽기 전용 모드로 사용
    switch (property.type) {
      case PropertyType.TEXT:
        return (
          <TextProperty
            value={
              typeof value === 'string'
                ? value
                : value !== undefined && value !== null
                  ? String(value)
                  : undefined
            }
            propertyDef={propertyDef}
            onChange={() => {}}
            disabled={true}
          />
        );

      case PropertyType.SELECT:
        return (
          <SelectProperty
            value={typeof value === 'string' ? value : undefined}
            propertyDef={propertyDef}
            onChange={() => {}}
            disabled={true}
          />
        );

      case PropertyType.MULTISELECT:
        return (
          <MultiSelectProperty
            value={Array.isArray(value) ? (value as string[]) : undefined}
            propertyDef={propertyDef}
            onChange={() => {}}
            disabled={true}
          />
        );

      case PropertyType.STATUS:
        return (
          <StatusProperty
            value={typeof value === 'string' ? value : undefined}
            propertyDef={propertyDef}
            onChange={() => {}}
            disabled={true}
          />
        );

      case PropertyType.NUMBER:
        return (
          <NumberProperty
            value={
              typeof value === 'number' || typeof value === 'string'
                ? value
                : undefined
            }
            propertyDef={propertyDef}
            onChange={() => {}}
            disabled={true}
          />
        );

      case PropertyType.BOOLEAN:
        return (
          <CheckboxProperty
            value={typeof value === 'boolean' ? value : undefined}
            propertyDef={propertyDef}
            onChange={() => {}}
            disabled={true}
          />
        );

      case PropertyType.COLOR:
        return (
          <ColorProperty
            value={typeof value === 'string' ? value : undefined}
            propertyDef={propertyDef}
            onChange={() => {}}
            disabled={true}
          />
        );

      case PropertyType.URL:
        return (
          <UrlProperty
            value={typeof value === 'string' ? value : undefined}
            propertyDef={propertyDef}
            onChange={() => {}}
            disabled={true}
          />
        );

      case PropertyType.EMAIL:
        return (
          <EmailProperty
            value={typeof value === 'string' ? value : undefined}
            propertyDef={propertyDef}
            onChange={() => {}}
            disabled={true}
          />
        );

      case PropertyType.PHONE:
        return (
          <PhoneProperty
            value={typeof value === 'string' ? value : undefined}
            propertyDef={propertyDef}
            onChange={() => {}}
            disabled={true}
          />
        );

      default:
        return (
          <Box className="px-2 py-1 text-xs text-muted-foreground">
            {value !== null && value !== undefined
              ? String(value)
              : '-'}
          </Box>
        );
    }
  };

  return (
    <Box className="group flex gap-2 py-0.5 px-2 transition-colors hover:bg-accent/30">
      {/* Label (아이콘 + 이름) */}
      <Box className="flex items-center gap-1.5 shrink-0 min-w-[120px]">
        <PropertyIcon icon={property.icon} />
        <span className="w-full text-xs text-left font-medium truncate text-muted-foreground">
          {property.name}
        </span>
      </Box>

      {/* Value */}
      <Box className="min-w-0 flex-1">{renderValue()}</Box>
    </Box>
  );
}
