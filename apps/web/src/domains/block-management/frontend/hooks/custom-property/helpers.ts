/**
 * Shared pure helpers for custom property hooks (schema field editor, use-custom-property).
 */
import type { BlockNodeData } from '../../../shared/types/block-data.types';
import {
  type CustomPropertyDefinition,
  type PropertyOption,
  PropertyType,
} from '../../../shared/value-objects/block-properties/common-types';

export function updatePropertyInArray(
  data: any,
  arrayPath: string,
  propertyId: string,
  updates: Record<string, any>
): any {
  const array = getNestedProperty(data, arrayPath) || [];
  const updatedArray = array.map((item: any) =>
    item.id === propertyId ? { ...item, ...updates } : item
  );
  return setNestedProperty(data, arrayPath, updatedArray);
}

export function removePropertyFromArray(
  data: any,
  arrayPath: string,
  propertyId: string
): any {
  const array = getNestedProperty(data, arrayPath) || [];
  const updatedArray = array.filter((item: any) => item.id !== propertyId);
  return setNestedProperty(data, arrayPath, updatedArray);
}

export function addPropertyToArray(
  data: BlockNodeData,
  arrayPath: string,
  property: CustomPropertyDefinition
): BlockNodeData {
  const array = getNestedProperty(data, arrayPath) || [];
  const updatedArray = [...array, property] as CustomPropertyDefinition[];
  return setNestedProperty(data, arrayPath, updatedArray) as BlockNodeData;
}

export function findPropertyInArray(
  data: any,
  arrayPath: string,
  propertyId: string
): any {
  const array = getNestedProperty(data, arrayPath) || [];
  return array.find((item: any) => item.id === propertyId);
}

export function getNestedProperty(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export function setNestedProperty(
  obj: any,
  path: string,
  value: any
): any {
  const keys = path.split('.');
  const result = { ...obj };
  let current: any = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (key && !(key in current)) {
      current[key] = {};
    }
    if (key) {
      current[key] = { ...current[key] };
      current = current[key];
    }
  }

  const lastKey = keys[keys.length - 1];
  if (lastKey) {
    current[lastKey] = value;
  }

  return result;
}

export function generateId(): string {
  return `prop-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function requiresOptions(type: PropertyType): boolean {
  return (
    type === PropertyType.SELECT ||
    type === PropertyType.MULTISELECT ||
    type === PropertyType.STATUS
  );
}

export function createDefaultOption(): PropertyOption {
  const optionId = `opt-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
  return {
    id: optionId,
    label: 'New Option',
    value: optionId,
    color: 'gray',
    order: 0,
    disabled: false,
  };
}

export function getDefaultValueForType(
  type: PropertyType | string | undefined
): any {
  const t = type as string | undefined;
  switch (t) {
    case 'text':
    case PropertyType.TEXT:
    case 'url':
    case PropertyType.URL:
    case 'email':
    case PropertyType.EMAIL:
    case 'phone':
    case PropertyType.PHONE:
      return '';
    case 'number':
    case PropertyType.NUMBER:
      return 0;
    case 'boolean':
    case PropertyType.BOOLEAN:
      return false;
    case 'color':
    case PropertyType.COLOR:
      return '#000000';
    case 'date':
    case PropertyType.DATE:
    case 'select':
    case PropertyType.SELECT:
    case 'multiselect':
    case PropertyType.MULTISELECT:
    case 'profile':
    case PropertyType.STATUS:
    case PropertyType.PROFILE:
    default:
      return null;
  }
}
