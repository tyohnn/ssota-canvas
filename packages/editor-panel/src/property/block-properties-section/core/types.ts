/**
 * Block Properties Section types (generic, package-owned)
 */

import type { PropertyUIDefinition } from '../../property-input/types';
import type { PropertyGroupDefinition } from '../../types';

export interface BlockEditorSchemaLike {
  blockType: string;
  groups: PropertyGroupDefinition[];
  properties: Record<string, PropertyUIDefinition>;
}

export interface PropertyUpdateDepsLike {
  updateProperty: (
    entityId: string,
    path: string,
    value: unknown,
    entityData: unknown
  ) => Promise<void>;
  updatePropertyImmediate: (
    entityId: string,
    path: string,
    value: unknown,
    entityData: unknown
  ) => void;
}

export interface BlockPropertiesSectionDeps {
  getEditorSchema: (entityType: string) => BlockEditorSchemaLike | null;
}
