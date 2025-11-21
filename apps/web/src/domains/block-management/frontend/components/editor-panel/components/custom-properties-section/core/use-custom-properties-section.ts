'use client';

import { useMemo, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { BlockNodeData } from '@/domains/block-management/shared/types/block-data.types';
import type { CustomPropertyDefinition } from '@/domains/block-management/shared/value-objects/block-properties/common-types';
import type { CustomPropertiesSectionContextValue } from './context';
import { toast } from '@workspace/ui/components/ui/sonner';

export function useCustomPropertiesSection(
  blockId: string
): CustomPropertiesSectionContextValue {
  const { getNode } = useReactFlow();
  const hasNotifiedRef = useRef(false);
  const [lastAddedPropertyId, setLastAddedPropertyId] = useState<string | null>(
    null
  );

  const node = getNode(blockId);
  const blockData = node?.data as BlockNodeData | undefined;

  if (!blockData) {
    if (!hasNotifiedRef.current) {
      toast('Cannot find block', {
        description: 'The block may have been deleted by another user.',
        duration: 3000,
      });
      hasNotifiedRef.current = true;
    }
    throw new Error('Cannot find block');
  }

  const customProperties = useMemo(() => {
    const properties = (blockData.customProperties ||
      []) as CustomPropertyDefinition[];
    return [...properties].sort((a, b) => a.order - b.order);
  }, [blockData.customProperties]);

  const propertyValues = useMemo(() => {
    const properties = (blockData.properties ?? {}) as unknown as Record<
      string,
      unknown
    >;

    return customProperties.reduce<Record<string, unknown>>(
      (accumulator, property) => {
        const value = properties[property.id];
        accumulator[property.id] =
          value !== undefined ? value : property.defaultValue;
        return accumulator;
      },
      {}
    );
  }, [customProperties, blockData.properties]);

  const contextValue = useMemo<CustomPropertiesSectionContextValue>(
    () => ({
      blockId,
      resolvedBlockData: blockData,
      customProperties,
      propertyValues,
      lastAddedPropertyId,
      setLastAddedPropertyId,
    }),
    [
      blockId,
      blockData,
      customProperties,
      propertyValues,
      lastAddedPropertyId,
      setLastAddedPropertyId,
    ]
  );

  return contextValue;
}
