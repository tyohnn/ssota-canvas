/**
 * Block Property Renderer Container
 */

'use client';

import { useCallback } from 'react';

import { useReactFlow } from '@xyflow/react';

import { useUpdateBlockProperty } from '@/domains/block-management/frontend/hooks/block-property/use-block-property-update';
import type { PropertyUIDefinition } from '@/domains/block-management/frontend/types/block-editor-schema.interface';
import { useCanvasReadOnly } from '@/domains/canvas-management/frontend/contexts/canvas-readonly-context';

import { BlockPropertyRendererView } from './block-property-renderer.view';

export interface BlockPropertyRendererProps {
  blockId: string;
  propertyKey: string;
  propertyDef: PropertyUIDefinition;
  value: any;
  blockData?: any; // 실제 블록 데이터 (blockId 추출용)
}

export function BlockPropertyRenderer({
  blockId,
  propertyKey,
  propertyDef,
  value,
  blockData,
}: BlockPropertyRendererProps) {
  const { getNode, updateNode } = useReactFlow();
  const { readonly: canvasReadonly } = useCanvasReadOnly();
  const { updateProperty, updatePropertyImmediate } = useUpdateBlockProperty({
    reactFlow: {
      getNode,
      updateNode: (nodeId: string, options: { data: any }) => {
        updateNode(nodeId, options);
      },
    },
  });

  const handleValueChange = useCallback(
    async (newValue: any) => {
      if (canvasReadonly || propertyDef.readonly) {
        return; // 읽기 전용은 수정 불가
      }

      if (!blockData) {
        console.error('blockData is required for property update');
        return;
      }

      try {
        // React Flow 노드 ID 사용 (optimistic update용)
        // 서버 액션에서는 실제 DB blockId 사용
        await updateProperty(
          blockId,
          `properties.${propertyKey}`,
          newValue,
          blockData
        );
      } catch (error) {
        console.error('Failed to update property:', error);
      }
    },
    [
      blockId,
      propertyKey,
      canvasReadonly,
      propertyDef.readonly,
      updateProperty,
      blockData,
    ]
  );

  const handleImmediateUpdate = useCallback(
    (newValue: any) => {
      if (canvasReadonly || propertyDef.readonly) {
        return;
      }

      if (!blockData) {
        console.error('blockData is required for immediate property update');
        return;
      }

      // Immediate React Flow node update only (no server action)
      updatePropertyImmediate(
        blockId,
        `properties.${propertyKey}`,
        newValue,
        blockData
      );
    },
    [
      blockId,
      propertyKey,
      canvasReadonly,
      propertyDef.readonly,
      updatePropertyImmediate,
      blockData,
    ]
  );

  return (
    <BlockPropertyRendererView
      propertyKey={propertyKey}
      propertyDef={propertyDef}
      value={value}
      onChange={handleValueChange}
      onImmediateChange={handleImmediateUpdate}
      readOnly={canvasReadonly || propertyDef.readonly || false}
      blockData={blockData}
    />
  );
}
