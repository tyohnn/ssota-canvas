'use client';

import * as React from 'react';
import {
  CheckboxProperty,
  ColorProperty,
  EmailProperty,
  MultiSelectProperty,
  NumberProperty,
  PhoneProperty,
  SelectProperty,
  StatusProperty,
  TextProperty,
  UrlProperty,
} from '../../property-input';
import type { CustomPropertyDefinitionLike } from '../core/types';
import type { PropertyUIDefinition, PropertyInputType } from '../../property-input/types';

export interface CustomPropertyInputRendererViewProps {
  property: CustomPropertyDefinitionLike;
  value: unknown;
  onValueChange: (nextValue: unknown) => void;
  disabled?: boolean;
}

function buildPropertyDef(
  property: CustomPropertyDefinitionLike
): PropertyUIDefinition {
  const typeMap: Record<CustomPropertyDefinitionLike['type'], PropertyInputType> = {
    text: 'text',
    select: 'select',
    multiselect: 'multi-select',
    status: 'status',
    number: 'number',
    boolean: 'checkbox',
    color: 'color',
    url: 'url',
    email: 'email',
    phone: 'phone',
    date: 'datetime',
    profile: 'profile',
  };
  const inputType = typeMap[property.type] ?? 'text';

  return {
    label: property.name,
    inputType,
    icon: property.icon ?? undefined,
    description: property.validation?.message,
    placeholder: property.name,
    order: property.order,
    readonly: false,
    options: property.options,
    showIf: property.visible ? undefined : () => false,
    defaultDisplay:
      property.defaultValue != null
        ? (v: unknown) =>
            v === undefined || v === null || v === ''
              ? String(property.defaultValue)
              : String(v)
        : undefined,
  };
}

/**
 * Renders the appropriate property input by type.
 */
export function CustomPropertyInputRendererView({
  property,
  value,
  onValueChange,
  disabled,
}: CustomPropertyInputRendererViewProps): React.ReactNode {
  const propertyDef = buildPropertyDef(property);

  switch (property.type) {
    case 'text':
      return (
        <TextProperty
          value={typeof value === 'string' ? value : value != null ? String(value) : undefined}
          propertyDef={propertyDef}
          onChange={onValueChange}
          disabled={disabled}
        />
      );
    case 'select':
      return (
        <SelectProperty
          value={typeof value === 'string' ? value : undefined}
          propertyDef={propertyDef}
          onChange={onValueChange}
        />
      );
    case 'multiselect':
      return (
        <MultiSelectProperty
          value={Array.isArray(value) ? (value as string[]) : undefined}
          propertyDef={propertyDef}
          onChange={onValueChange}
        />
      );
    case 'status':
      return (
        <StatusProperty
          value={typeof value === 'string' ? value : undefined}
          propertyDef={propertyDef}
          onChange={onValueChange}
        />
      );
    case 'number':
      return (
        <NumberProperty
          value={
            typeof value === 'number' || typeof value === 'string'
              ? value
              : undefined
          }
          propertyDef={propertyDef}
          onChange={onValueChange}
        />
      );
    case 'boolean':
      return (
        <CheckboxProperty
          value={typeof value === 'boolean' ? value : undefined}
          propertyDef={propertyDef}
          onChange={onValueChange}
        />
      );
    case 'color':
      return (
        <ColorProperty
          value={typeof value === 'string' ? value : undefined}
          propertyDef={propertyDef}
          onChange={onValueChange}
        />
      );
    case 'url':
      return (
        <UrlProperty
          value={typeof value === 'string' ? value : undefined}
          propertyDef={propertyDef}
          onChange={onValueChange}
        />
      );
    case 'email':
      return (
        <EmailProperty
          value={typeof value === 'string' ? value : undefined}
          propertyDef={propertyDef}
          onChange={onValueChange}
        />
      );
    case 'phone':
      return (
        <PhoneProperty
          value={typeof value === 'string' ? value : undefined}
          propertyDef={propertyDef}
          onChange={onValueChange}
        />
      );
    default:
      return (
        <div className="px-2 py-1 text-xs text-muted-foreground">
          Unsupported type: {property.type}
        </div>
      );
  }
}
