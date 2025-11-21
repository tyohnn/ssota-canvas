import type { ReactNode } from 'react';
import {
  PropertyType,
  type CustomPropertyDefinition,
} from '@/domains/block-management/shared/value-objects/block-properties/common-types';
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
} from '../../../../property-input';
import type { PropertyUIDefinition } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { useCustomPropertyItemContext } from '../core/context';

interface InputRendererProps {
  type: PropertyType;
}

/**
 * CustomPropertyDefinition을 PropertyUIDefinition으로 변환
 *
 * CustomPropertyDefinition의 모든 메타데이터를 보존하여 UI 렌더링에 활용합니다.
 */
function buildPropertyDefinition(
  property: CustomPropertyDefinition
): PropertyUIDefinition {
  // PropertyType을 PropertyInputType으로 변환
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

  const inputType = typeMapping[property.type] ?? 'text';

  // validation.message를 description으로 활용
  const description = property.validation?.message;

  // defaultValue를 defaultDisplay 함수로 변환
  const defaultDisplay =
    property.defaultValue !== undefined && property.defaultValue !== null
      ? (value: any) => {
          // 값이 없을 때만 기본값 표시
          if (value === undefined || value === null || value === '') {
            return String(property.defaultValue);
          }
          return String(value);
        }
      : undefined;

  // visible을 showIf로 변환 (항상 표시되도록 설정)
  const showIf = property.visible
    ? undefined // visible이 true면 조건 없이 항상 표시
    : () => false; // visible이 false면 숨김

  return {
    label: property.name,
    inputType,
    icon: property.icon ?? undefined,
    description,
    placeholder: property.name,
    order: property.order,
    readonly: false, // 커스텀 속성은 편집 가능
    options: property.options,
    showIf,
    defaultDisplay,
  };
}

export function InputRenderer({ type }: InputRendererProps): ReactNode {
  const { property, value, handleValueChange } = useCustomPropertyItemContext();
  const propertyDef = buildPropertyDefinition(property);

  switch (type) {
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
          onChange={handleValueChange}
        />
      );

    case PropertyType.SELECT:
      return (
        <SelectProperty
          value={typeof value === 'string' ? value : undefined}
          propertyDef={propertyDef}
          onChange={handleValueChange}
        />
      );

    case PropertyType.MULTISELECT:
      return (
        <MultiSelectProperty
          value={Array.isArray(value) ? (value as string[]) : undefined}
          propertyDef={propertyDef}
          onChange={handleValueChange}
        />
      );

    case PropertyType.STATUS:
      return (
        <StatusProperty
          value={typeof value === 'string' ? value : undefined}
          propertyDef={propertyDef}
          onChange={handleValueChange}
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
          onChange={handleValueChange}
        />
      );

    case PropertyType.BOOLEAN:
      return (
        <CheckboxProperty
          value={typeof value === 'boolean' ? value : undefined}
          propertyDef={propertyDef}
          onChange={handleValueChange}
        />
      );

    case PropertyType.COLOR:
      return (
        <ColorProperty
          value={typeof value === 'string' ? value : undefined}
          propertyDef={propertyDef}
          onChange={handleValueChange}
        />
      );

    case PropertyType.URL:
      return (
        <UrlProperty
          value={typeof value === 'string' ? value : undefined}
          propertyDef={propertyDef}
          onChange={handleValueChange}
        />
      );

    case PropertyType.EMAIL:
      return (
        <EmailProperty
          value={typeof value === 'string' ? value : undefined}
          propertyDef={propertyDef}
          onChange={handleValueChange}
        />
      );

    case PropertyType.PHONE:
      return (
        <PhoneProperty
          value={typeof value === 'string' ? value : undefined}
          propertyDef={propertyDef}
          onChange={handleValueChange}
        />
      );

    default:
      return (
        <div className="px-2 py-1 text-xs text-muted-foreground">
          Unsupported property type: {property.type}
        </div>
      );
  }
}
