'use client';

import { Node } from '@xyflow/react';
import { useCallback } from 'react';
import { useReactFlowCommandsContext } from '@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext';
// import { setValue } from "./object-path";
import { ComponentInstanceMetadata } from '@/domains/block-components';
import { DefaultMetadata } from '@/domains/blocks/types/common.node';
import { NodeUI, SchemaField } from '@/domains/blocks/types';

export function useNodeFieldUpdate() {
  const { componentCommands, nodeCommands } = useReactFlowCommandsContext();

  // 노드 타입 감지 함수
  const getNodeType = useCallback((node: Node) => {
    if (node.data.role === 'instance') return 'component-instance';

    if (node.data.role === 'definition') return 'component-definition';

    return 'regular-block';
  }, []);

  // 통합 업데이트 함수 - 필드 타입에 따라 자동 분류
  const updateField = useCallback(
    async (node: Node, path: string[], value: unknown) => {
      const fieldId = path[0];
      if (!fieldId) {
        console.error('Field ID is required for update');
        return;
      }

      const fieldType = path[0] === 'nodeUI' ? 'nodeUI' : 'formData';
      const nodeType = getNodeType(node);

      // 컴포넌트 인스턴스 처리
      if (nodeType === 'component-instance') {
        if (fieldType === 'formData') {
          const currentFormData =
            (node.data.formData as ComponentInstanceMetadata['formData']) || {};
          const key = path[1] as string;
          const updatedFormData = {
            ...currentFormData,
            [key]: value,
          };

          const result =
            await componentCommands.updateComponentInstanceFormData(
              node,
              updatedFormData,
              fieldId
            );

          if (!result.ok) {
            console.error(
              'Failed to update component instance form data:',
              result.error
            );
          }
        } else if (fieldType === 'nodeUI') {
          const currentNodeUI =
            (node.data.nodeUI as ComponentInstanceMetadata['nodeUI']) || {};
          const key = path[1] as string;
          const updatedNodeUI = {
            ...currentNodeUI,
            [key]: value,
          };

          const result = await componentCommands.updateComponentInstanceNodeUI(
            node,
            updatedNodeUI,
            fieldId
          );

          if (!result.ok) {
            console.error(
              'Failed to update component instance nodeUI:',
              result.error
            );
          }
        }
      }
      // 일반 노드 및 컴포넌트 정의 처리
      else if (
        nodeType === 'regular-block' ||
        nodeType === 'component-definition'
      ) {
        if (fieldType === 'formData') {
          const currentFormData =
            (node.data.formData as DefaultMetadata['formData']) || {};
          const key = path[1] as string;
          const updatedFormData = {
            ...currentFormData,
            [key]: value,
          };

          // nodeCommands.updateNodeData에서 optimistic 업데이트와 DB 동기화 처리
          const result = await nodeCommands.updateNodeData(node, {
            formData: updatedFormData,
          });

          if (!result.ok) {
            console.error(
              'Failed to update regular node form data:',
              result.error
            );
          }
        } else if (fieldType === 'nodeUI') {
          const currentNodeUI = node.data.nodeUI || {};
          const key = path[1] as string;
          const updatedNodeUI = {
            ...currentNodeUI,
            [key]: value,
          };

          // nodeCommands.updateNodeData에서 optimistic 업데이트와 DB 동기화 처리
          const result = await nodeCommands.updateNodeData(node, {
            nodeUI: updatedNodeUI as NodeUI,
          });

          if (!result.ok) {
            console.error(
              'Failed to update regular node nodeUI:',
              result.error
            );
          }
        }
      }
    },
    [componentCommands, nodeCommands, getNodeType]
  );

  // 리셋 함수 - 컴포넌트 인스턴스 필드를 정의 값으로 리셋
  const resetField = useCallback(
    async (node: Node, field: SchemaField) => {
      const nodeType = getNodeType(node);
      const fieldSection = field.path[0];

      // 컴포넌트 인스턴스만 리셋 가능
      if (nodeType === 'component-instance') {
        const result = await componentCommands.resetComponentInstanceField(
          node,
          field.id,
          fieldSection as 'formData' | 'nodeUI'
        );

        if (!result.ok) {
          console.error(
            'Failed to reset component instance field:',
            result.error
          );
        }
      } else {
        console.warn('Reset is only available for component instances');
      }
    },
    [getNodeType, componentCommands]
  );

  return { updateField, resetField };
}
