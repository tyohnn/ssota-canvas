import { useMemo } from 'react';
import type {
  BlockPropertiesSectionDeps,
  BlockEditorSchemaLike,
} from './types';

export interface BlockPropertyItemViewModel {
  propertyKey: string;
  propertyDef: BlockEditorSchemaLike['properties'][string];
}

export interface BlockPropertyGroupViewModel {
  id: string;
  label: string;
  order: number;
  defaultCollapsed?: boolean;
  items: BlockPropertyItemViewModel[];
}

export interface UseBlockPropertiesSectionArgs {
  entityData: unknown;
  deps: BlockPropertiesSectionDeps;
}

export interface UseBlockPropertiesSectionResult {
  groups: BlockPropertyGroupViewModel[];
  properties: Record<string, unknown>;
}

export function useBlockPropertiesSection({
  entityData,
  deps,
}: UseBlockPropertiesSectionArgs): UseBlockPropertiesSectionResult {
  return useMemo(() => {
    const entityType = (entityData as { blockType?: string })?.blockType as
      | string
      | undefined;
    const uiSchema = entityType ? deps.getEditorSchema(entityType) : null;

    if (!uiSchema) {
      return {
        groups: [],
        properties: {},
      };
    }

    const properties =
      (entityData as { properties?: Record<string, unknown> })?.properties ??
      {};

    const groups: BlockPropertyGroupViewModel[] = [...uiSchema.groups]
      .filter(g => g.id !== 'metadata')
      .sort((a, b) => a.order - b.order)
      .map(group => {
        const items = group.properties
          .map(propertyKey => {
            const propertyDef = uiSchema.properties[propertyKey];
            if (!propertyDef) return null;
            if (
              propertyDef.showIf &&
              !propertyDef.showIf(properties as Record<string, unknown>)
            ) {
              return null;
            }
            return { propertyKey, propertyDef };
          })
          .filter(
            (
              x
            ): x is {
              propertyKey: string;
              propertyDef: BlockEditorSchemaLike['properties'][string];
            } => !!x
          )
          .sort((a, b) => a.propertyDef.order - b.propertyDef.order);

        return {
          id: group.id,
          label: group.label,
          order: group.order,
          defaultCollapsed: group.defaultCollapsed,
          items,
        };
      });

    return { groups, properties };
  }, [entityData, deps]);
}
