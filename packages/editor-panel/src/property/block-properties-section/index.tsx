'use client';

import { Box } from '@workspace/ui/components/ui/box';
import { PropertyGroup } from '../property-group';
import { BlockPropertyRenderer } from './components';

export {
  BlockPropertyRenderer,
  BlockPropertyRendererView,
  type BlockPropertyRendererProps,
  type BlockPropertyRendererViewProps,
} from './components';
import type { BlockPropertiesSectionDeps, PropertyUpdateDepsLike } from './core/types';

export interface BlockPropertiesSectionProps {
  entityId: string;
  entityData: unknown;
  propertyUpdateDeps: PropertyUpdateDepsLike;
  deps: BlockPropertiesSectionDeps;
  readonly?: boolean;
  onImageUpload?: (file: File) => Promise<string>;
}

export function BlockPropertiesSection({
  entityId,
  entityData,
  propertyUpdateDeps,
  deps,
  readonly = false,
  onImageUpload,
}: BlockPropertiesSectionProps) {
  const entityType = (entityData as { blockType?: string })?.blockType as string;
  const uiSchema = deps.getEditorSchema(entityType);

  if (!uiSchema) return null;

  const sortedGroups = [...uiSchema.groups]
    .filter(g => g.id !== 'metadata')
    .sort((a, b) => a.order - b.order);

  const properties = (entityData as { properties?: Record<string, unknown> })?.properties ?? {};

  return (
    <Box>
      {sortedGroups.map(group => (
        <PropertyGroup key={group.id} group={group}>
          {group.properties
            .map(propertyKey => {
              const propertyDef = uiSchema.properties[propertyKey];
              if (!propertyDef) return null;
              if (propertyDef.showIf && !propertyDef.showIf(properties as Record<string, unknown>)) return null;
              return { propertyKey, propertyDef };
            })
            .filter((x): x is { propertyKey: string; propertyDef: typeof uiSchema.properties[string] } => !!x)
            .sort((a, b) => a.propertyDef.order - b.propertyDef.order)
            .map(item => (
              <BlockPropertyRenderer
                key={item.propertyKey}
                entityId={entityId}
                propertyKey={item.propertyKey}
                propertyDef={item.propertyDef}
                value={properties[item.propertyKey]}
                entityData={entityData}
                propertyUpdateDeps={propertyUpdateDeps}
                readonly={readonly}
                onImageUpload={onImageUpload}
              />
            ))}
        </PropertyGroup>
      ))}
    </Box>
  );
}
