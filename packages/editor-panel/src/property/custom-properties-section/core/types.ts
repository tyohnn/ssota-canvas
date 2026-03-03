/**
 * Custom Properties Section types (generic, package-owned)
 */

import type { PropertyUpdateDepsLike } from '../../block-properties-section/core/types';

export interface CustomPropertiesSectionDeps {
  resolveEntityData: (entityId: string) => unknown;
  propertyUpdateDeps: PropertyUpdateDepsLike;
}
