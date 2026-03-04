'use client';

import { useCallback } from 'react';

import type { PropertyUIDefinition } from '../../property-input/types';
import type { PropertyUpdateDepsLike } from '../core/types';

import { BlockPropertyRendererView } from './block-property-renderer.view';

export { BlockPropertyRendererView } from './block-property-renderer.view';
export type { BlockPropertyRendererViewProps } from './block-property-renderer.view';

export interface BlockPropertyRendererProps {
  entityId: string;
  propertyKey: string;
  propertyDef: PropertyUIDefinition;
  value: unknown;
  entityData?: unknown;
  propertyUpdateDeps: PropertyUpdateDepsLike;
  readonly?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
}

export function BlockPropertyRenderer({
  entityId,
  propertyKey,
  propertyDef,
  value,
  entityData,
  propertyUpdateDeps,
  readonly = false,
  onImageUpload,
}: BlockPropertyRendererProps) {
  const { updateProperty, updatePropertyImmediate } = propertyUpdateDeps;

  const handleValueChange = useCallback(
    async (newValue: unknown) => {
      if (readonly || propertyDef.readonly) return;
      if (!entityData) {
        console.error('entityData is required for property update');
        return;
      }
      try {
        await updateProperty(entityId, `properties.${propertyKey}`, newValue, entityData);
      } catch (error) {
        console.error('Failed to update property:', error);
      }
    },
    [entityId, propertyKey, readonly, propertyDef.readonly, updateProperty, entityData]
  );

  const handleImmediateUpdate = useCallback(
    (newValue: unknown) => {
      if (readonly || propertyDef.readonly) return;
      if (!entityData) return;
      updatePropertyImmediate(entityId, `properties.${propertyKey}`, newValue, entityData);
    },
    [entityId, propertyKey, readonly, propertyDef.readonly, updatePropertyImmediate, entityData]
  );

  return (
    <BlockPropertyRendererView
      propertyKey={propertyKey}
      propertyDef={propertyDef}
      value={value}
      onChange={handleValueChange}
      onImmediateChange={handleImmediateUpdate}
      readOnly={readonly || propertyDef.readonly || false}
      entityData={entityData}
      onImageUpload={onImageUpload}
    />
  );
}
