"use client";

import { useCallback } from "react";
import { generateUUID } from "@/utils/uuid";
import { useReactFlow, Node } from "@xyflow/react";
import { 
  createBlock as createBlockAction, 
  updateBlock as updateBlockAction,
  deleteBlock as deleteBlockAction 
} from "@/domains/canvas/actions/block.action";
import { 
  createBlockPosition as createBlockPositionAction,
  deleteBlockPosition as deleteBlockPositionAction
} from "@/domains/canvas/actions/block-position.action";
import { isFailure } from "@/lib/action-result";
import type { CreateStatus } from "./useReactFlowBlockCommands";
import type { Block, BlockType } from "@/db/schema";
import type { 
  ComponentDefinition,
  ComponentDefinitionData, ComponentDefinitionMetadata,
  ComponentInstance,
  ComponentInstanceData,
  OverrideFlags 
} from "@/domains/block-components";
import { extractUserDefinedSchema } from "../policy/node-form-schema-policy";
import { FormSchema, NodeUI, SchemaField } from "@/domains/blocks/types";
import { useCanvasData } from "@/domains/canvas/contexts/CanvasDataContext";

/**
 * React Flow Component Commands Hook
 * 
 * This hook handles component operations like creating components from nodes,
 * promoting nodes to component definitions, linking nodes to components,
 * creating component instances, and managing component styles.
 * Uses React Flow nodes as SSOT with optimistic updates.
 */
export function useReactFlowComponentCommands() {
  const { getNode, updateNode, addNodes, deleteElements } = useReactFlow();
  const { 
    addComponentBlock, 
    selectComponent, 
    removeComponentBlock, 
    getComponentBlockById,
    selectedPageId
  } = useCanvasData();

  // ============================================================================
  // Component Creation from Node
  // ============================================================================

  /**
   * Create a component definition from an existing node
   */
  const createComponentFromNode = useCallback(async (
    sourceNode: Node
  ): Promise<CreateStatus> => {
    if (!sourceNode) {
      return { ok: false, error: `Source node not found` };
    }

    const optimisticId = generateUUID();
    const now = new Date();
    const componentName = (sourceNode.data.title as string) || "Component";

    try {
      // 2. Add component to React Flow (optimistic update) - 현재 context_page_id에 추가하지 않음
      // addNodes([componentNode]);

      // 3. Convert original node to component instance (optimistic update)
      // 컴포넌트 노드의 필드는 인스턴스 입장에서 수정이 불가해야하기 때문에 predefined 플래그 추가
      const convertedFormFields = (sourceNode.data.formSchema as FormSchema).fields.map((field: SchemaField) => ({
        ...field,
        config: {
          ...field.config,
          predefined: true,
        },
      }));
      
      // Optimistic React Flow 노드는 resolved된 데이터 형식 그대로 유지
      const instanceNode = {
        ...sourceNode,
        data: {
          ...sourceNode.data,
          formSchema: { fields: convertedFormFields },
          // 인스턴스화: formData, nodeUI, formSchema는 그대로 유지 (resolved된 상태로 보아야 함)
          role: "instance",
          instanceData: {
            componentId: optimisticId,
            // OverrideFlags 초기화 (빈 배열)
            overrides: {
              nodeUI: [],
              formData: [],
              formSchema: [],
            },
          },
          updated_at: now.toISOString(),
        },
      };

      updateNode(sourceNode.id, instanceNode);

      // 4. Sync to database
      // 컴포넌트 노드에는 사용자 정의 스키마만 저장 (기본 스키마 제거)
      const userDefinedSchema = extractUserDefinedSchema(
        sourceNode.type as BlockType,
        sourceNode.data.formSchema as FormSchema // coverted form Schema가 아님. 왜냐하면 컴포넌트에게 저장될 때는 predefined 플래그가 포함되면 안되기 때문에.
      );

      const componentResult = await createBlockAction({
        blockType: sourceNode.type as BlockType,
        slug: sourceNode.data.slug as string,
        title: sourceNode.data.title as string,
        workspaceId: sourceNode.data.workspace_id as string,
        parentBlockId: sourceNode.data.parent_block_id as string,
        object: "component" as "block" | "page" | "component",
        order: sourceNode.data.order as number,
        icon_name: "component" as string,
        metadata: {
          formData: sourceNode.data.formData,
          formSchema: userDefinedSchema, // 사용자 정의 스키마만 저장
          nodeUI: sourceNode.data.nodeUI,
          role: "definition",
          componentData: {
            connectedInstanceIds: [sourceNode.id], // 첫 번째 인스턴스로 초기화
          },
        },
      });

      if (isFailure(componentResult)) {
        // Rollback optimistic updates
        deleteElements({ nodes: [{id: optimisticId}] });
        updateNode(sourceNode.id, sourceNode);
        return { 
          ok: false, 
          error: componentResult.error || "Failed to create component in database"
        };
      }

      const dbComponent = componentResult.data as Block;

      // Update instance to reference the real component ID
      // DB에는 formData는 비우고, nodeUI는 사이즈만 유지하고 나머지는 비움
      // 그 이유는 인스턴스의 nodeUI 데이터를 기본으로 컴포넌트에 저장했기 때문에, 인스턴스에 데이터가 없어도 컴포넌트에서 데이터를 가져오게 됨. 인스턴스에 데이터가 있으면 오히려 override로 처리됨.
      const sourceNodeUI = sourceNode.data.nodeUI as NodeUI;
      const dbInstanceNodeUI = {
        size: sourceNodeUI?.size || { width: 150 },
      };

      const instanceResult = await updateBlockAction({
        id: sourceNode.id,
        metadata: {
          formSchema: {
            fields: [],
          }, // formSchema는 빈 객체로 저장. user defined schema가 모두 컴포넌트의 formSchema에 저장되기 때문에 인스턴스의 user defined schema는 사라짐.
          formData: {}, // formData는 빈 객체로 저장
          nodeUI: dbInstanceNodeUI, // nodeUI는 사이즈만 유지
          role: "instance",
          instanceData: {
            componentId: dbComponent.id,
            overrides: {
              nodeUI: [],
              formData: [],
              formSchema: [],
            },
          },
        },
      });

      if (isFailure(instanceResult)) {
        // Rollback component creation
        deleteElements({ nodes: [{id: optimisticId}] });
        updateNode(sourceNode.id, sourceNode);
        return { 
          ok: false, 
          error: instanceResult.error || "Failed to update instance in database"
        };
      }

      // 5. Reconcile with database ID
      // 현재 react flow canvas에서 렌더링된 페이지에서는 컴폰넌트 노드가 없기 때문에 업데이트 하지 않아도 됨.
      // const reconciledComponent = {
      //   ...sourceNode,
      //   id: dbComponent.id,
      //   data: {
      //     ...sourceNode.data,
      //     created_at: dbComponent.created_at.toISOString(),
      //     updated_at: dbComponent.updated_at.toISOString(),
      //   },
      // };

      // updateNode(optimisticId, reconciledComponent);

      // 6. Create block position for component definition (자기 자신이 context)
      const blockPositionResult = await createBlockPositionAction({
        blockId: dbComponent.id,
        contextBlockId: dbComponent.id, // 자기 자신이 context
        x: sourceNode.position.x,
        y: sourceNode.position.y,
      });

      if (isFailure(blockPositionResult)) {
        // Rollback optimistic updates
        deleteElements({ nodes: [{id: optimisticId}] });
        updateNode(sourceNode.id, sourceNode);
        return { 
          ok: false, 
          error: blockPositionResult.error || "Failed to create component position in database"
        };
      }

      // 7. Add component to CanvasDataContext and switch to component mode
      const componentDefinition: ComponentDefinition = {
        ...dbComponent,
        object: "component",
        metadata: {
          role: "definition",
          formData: (dbComponent.metadata as ComponentDefinitionMetadata).formData as Record<string, unknown>,
          formSchema: (dbComponent.metadata as ComponentDefinitionMetadata).formSchema as FormSchema,
          nodeUI: (dbComponent.metadata as ComponentDefinitionMetadata).nodeUI as NodeUI,
          componentData: (dbComponent.metadata as ComponentDefinitionMetadata).componentData as ComponentDefinitionData,
        },
      };

      // Add to component blocks (asset explorer에 출력)
      addComponentBlock(componentDefinition);
      
      // Switch to component mode and select the new component
      selectComponent(dbComponent.id);

      return { ok: true, data: { componentId: dbComponent.id } };
      
    } catch (error) {
      console.error("❌ Failed to create component:", error);
      return { ok: false, error: `Failed to create component: ${error instanceof Error ? error.message : String(error)}` };
    }
  }, [getNode, addNodes, deleteElements, updateNode]);

  // ============================================================================
  // Component Instance Creation
  // ============================================================================

  /**
   * Create a component instance from a component definition
   */
  const createComponentInstance = useCallback(async (
    definitionNodeId: string,
    // definitionBlock: Block // 나중에 추가하기 (테스트에 용이)
    position: { x: number; y: number },
    instanceName?: string
  ): Promise<CreateStatus> => {
    if (!definitionNodeId) {
      return { ok: false, error: `Component definition node not found` };
    }
    const definitionBlock = getComponentBlockById(definitionNodeId);
    if (!definitionBlock) {
      return { ok: false, error: `Component definition ${definitionNodeId} not found` };
    }

    const optimisticId = generateUUID();
    const now = new Date();
    const name = instanceName || `${definitionBlock.title} Instance`;

    try {
      // 1. Create component instance node with definition's data (optimistic update)
      // 인스턴스 입장에서 컴포넌트 노드의 필드는 수정이 불가해야하기 때문에 predefined 플래그 추가
      const convertedFormSchema = (definitionBlock.metadata.formSchema as FormSchema).fields.map((field: SchemaField) => ({
        ...field,
        config: {
          ...field.config,
          predefined: true,
        },
      }));
      const instanceNode = {
        id: optimisticId,
        type: definitionBlock.block_type as BlockType,
        position,
        data: {
          title: name,
          slug: `${name.toLowerCase().replace(/\s+/g, "-")}-${optimisticId.substring(0, 8)}-${now.getTime()}`,
          workspace_id: definitionBlock.workspace_id,
          parent_block_id: definitionBlock.parent_block_id,
          object: "block",
          order: definitionBlock.order,
          icon_name: definitionBlock.icon_name,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          // Definition의 데이터를 그대로 복제 (resolved된 상태로 보아야 함)
          formData: definitionBlock.metadata.formData,
          formSchema: convertedFormSchema, // default schema가 이미 반영되어 있어, user defined schema를 추출하지 않아도 됨.
          nodeUI: definitionBlock.metadata.nodeUI,
          role: "instance",
          instanceData: {
            componentId: definitionNodeId,
            overrides: {
              nodeUI: [],
              formData: [],
              formSchema: [],
            },
          },
        },
        width: definitionBlock.metadata.nodeUI.size.width,
        // height: definitionBlock.metadata.nodeUI.size.height,
      };

      // 2. Add instance to React Flow (optimistic update)
      addNodes([instanceNode]);

      // 3. Sync to database
      const dbResult = await createBlockAction({
        blockType: definitionBlock.block_type as BlockType,
        slug: instanceNode.data.slug,
        title: instanceNode.data.title,
        workspaceId: instanceNode.data.workspace_id,
        parentBlockId: instanceNode.data.parent_block_id,
        object: instanceNode.data.object as "block" | "page" | "component",
        order: instanceNode.data.order,
        icon_name: instanceNode.data.icon_name as string,
        metadata: {
          formData: definitionBlock.metadata.formData,
          formSchema: {
            fields: [],
          }, // formSchema는 빈 객체로 저장. 아직 사용자가 정의한 스키마가 없고 default와 컴포넌트 schema만 있었기 때문에.
          nodeUI: {
            size: (definitionBlock.metadata.nodeUI as NodeUI).size || { width: 150, height: 100 },
          }, // nodeUI는 사이즈만 유지
          role: instanceNode.data.role,
          instanceData: {
            componentId: definitionNodeId,
            overrides: {
              nodeUI: [],
              formData: [],
              formSchema: [],
            },
          },
        },
      });

      if (isFailure(dbResult)) {
        // Rollback optimistic update
        deleteElements({ nodes: [{id: optimisticId}] });
        return { 
          ok: false, 
          error: dbResult.error || "Failed to create instance in database"
        };
      }

      const dbInstance = dbResult.data as Block;

      // 4. Update component definition's connectedInstanceIds
      const definitionComponentData = definitionBlock.metadata.componentData as ComponentDefinitionData;
      const currentInstanceIds = definitionComponentData?.connectedInstanceIds || [];
      const updatedInstanceIds = [...currentInstanceIds, dbInstance.id];

      // Sync component definition update to database
      const definitionUpdateResult = await updateBlockAction({
        id: definitionNodeId,
        metadata: {
          ...definitionBlock.metadata,
          componentData: {
            ...definitionComponentData,
            connectedInstanceIds: updatedInstanceIds,
          },
        },
      });

      if (isFailure(definitionUpdateResult)) {
        // Rollback optimistic updates
        deleteElements({ nodes: [{id: optimisticId}] });
        return { 
          ok: false, 
          error: definitionUpdateResult.error || "Failed to update component definition in database"
        };
      }

      // 5. Create block position for instance
      const blockPositionResult = await createBlockPositionAction({
        blockId: dbInstance.id,
        contextBlockId: selectedPageId as string,
        x: position.x,
        y: position.y,
      });

      if (isFailure(blockPositionResult)) {
        // Rollback optimistic update
        deleteElements({ nodes: [{id: optimisticId}] });
        return { 
          ok: false, 
          error: blockPositionResult.error || "Failed to create instance position in database"
        };
      }

      // 5. Reconcile with database ID
      const reconciledInstance = {
        ...instanceNode,
        id: dbInstance.id,
        data: {
          ...instanceNode.data,
          created_at: dbInstance.created_at.toISOString(),
          updated_at: dbInstance.updated_at.toISOString(),
        },
      };

      updateNode(optimisticId, reconciledInstance);

      return { ok: true, data: { nodeId: dbInstance.id } };
      
    } catch (error) {
      console.error("❌ Failed to create component instance:", error);
      return { ok: false, error: `Failed to create component instance: ${error instanceof Error ? error.message : String(error)}` };
    }
  }, [getNode, addNodes, deleteElements, updateNode, selectedPageId, getComponentBlockById]);

  // ============================================================================
  // Component Style Management
  // ============================================================================

  /**
   * Update component instance form data with overrides
   */
  const updateComponentInstanceFormData = useCallback(async (
    instanceNode: Node,
    formData: Record<string, unknown>,
    fieldId: string
  ): Promise<CreateStatus> => {
    if (!instanceNode) {
      return { ok: false, error: `Component instance node not found` };
    }
    const instanceNodeId = instanceNode.id;

    if (instanceNode.data.role !== "instance") {
      return { ok: false, error: "Node is not a component instance" };
    }

    const originalFormData = { ...(instanceNode.data.formData as Record<string, unknown>) };

    try {
      // 1. Update React Flow Node immediately (optimistic update)
      updateNode(instanceNodeId, {
        data: {
          ...instanceNode.data,
          formData,
        },
      });

      // 2. Get current overrides and add new field
      const instanceData = instanceNode.data.instanceData as ComponentInstanceData;
      const currentOverrides = instanceData?.overrides?.formData || [];
      // const newOverrides = currentOverrides.includes(fieldId) 
      //   ? currentOverrides 
      //   : [...currentOverrides, fieldId];

      // 3. Sync to database
      const userDefinedSchema = extractUserDefinedSchema(instanceNode.type as BlockType, instanceNode.data.formSchema as FormSchema);
      const dbResult = await updateBlockAction({
        id: instanceNodeId,
        metadata: {
          formSchema: userDefinedSchema,
          formData,
          nodeUI: instanceNode.data.nodeUI,
          role: instanceNode.data.role,
          instanceData: {
            ...instanceData,
            overrides: {
              ...instanceData.overrides,
              formData: currentOverrides, // 인스턴스에서 formData의 값을 변경하면, 이는 override로 처리하지 않기 때문에, 동일한 override를 넘긴다.
            },
          },
        },
      });

      if (isFailure(dbResult)) {
        // Rollback optimistic update
        updateNode(instanceNodeId, {
          data: {
            ...instanceNode.data,
            formData: originalFormData,
          },
        });
        return { ok: false, error: dbResult.error || "Failed to update form data in database" };
      }

      return { ok: true, data: { nodeId: instanceNodeId, formData } };
      
    } catch (error) {
      // Rollback optimistic update
      updateNode(instanceNodeId, {
        data: {
          ...instanceNode.data,
          formData: originalFormData,
        },
      });
      console.error("❌ Failed to update component instance form data:", error);
      return { ok: false, error: `Failed to update component instance form data: ${error}` };
    }
  }, [getNode, updateNode]);

  /**
   * Update component instance nodeUI with overrides
   */
  const updateComponentInstanceNodeUI = useCallback(async (
    instanceNode: Node,
    nodeUI: NodeUI,
    fieldId: string
  ): Promise<CreateStatus> => {
    if (!instanceNode) {
      return { ok: false, error: `Component instance node not found` };
    }
    const instanceNodeId = instanceNode.id;

    if (instanceNode.data.role !== "instance") {
      return { ok: false, error: "Node is not a component instance" };
    }

    // 1. Get component definition
    const instanceData = instanceNode.data.instanceData as ComponentInstanceData;
    const componentId = instanceData.componentId;
    if (!componentId) {
      return { ok: false, error: "Component definition not found" };
    }

    const definitionBlock = getComponentBlockById(componentId);
    if (!definitionBlock) {
      return { ok: false, error: "Component definition not found" };
    }

    const originalNodeUI = { ...(instanceNode.data.nodeUI as NodeUI) };

    try {
      // 1. Update React Flow Node immediately (optimistic update)
      updateNode(instanceNodeId, {
        data: {
          ...instanceNode.data,
          nodeUI,
        },
      });

      // 2. Get current overrides and check if value is actually different from definition
      const instanceData = instanceNode.data.instanceData as ComponentInstanceData;
      const currentOverrides = instanceData?.overrides?.nodeUI || [];
      
      // definition의 값과 비교하여 실제로 다른 값인지 확인
      const definitionValue = (definitionBlock.metadata.nodeUI as NodeUI)?.[fieldId];
      const isValueDifferent = definitionValue !== nodeUI[fieldId];
      
      // 값이 다르거나 이미 override에 포함된 경우에만 override에 추가
      const newOverrides = isValueDifferent && !currentOverrides.includes(fieldId)
        ? [...currentOverrides, fieldId]
        : !isValueDifferent && currentOverrides.includes(fieldId)
        ? currentOverrides.filter(id => id !== fieldId) // 값이 같아지면 override에서 제거
        : currentOverrides; // 기존 상태 유지

      // 3. Sync to database
      const userDefinedSchema = extractUserDefinedSchema(instanceNode.type as BlockType, instanceNode.data.formSchema as FormSchema);
      const dbResult = await updateBlockAction({
        id: instanceNodeId,
        metadata: {
          formData: instanceNode.data.formData,
          formSchema: userDefinedSchema,
          nodeUI,
          role: instanceNode.data.role,
          instanceData: {
            ...instanceData,
            overrides: {
              ...instanceData.overrides,
              nodeUI: newOverrides,
            },
          },
        },
      });

      if (isFailure(dbResult)) {
        // Rollback optimistic update
        updateNode(instanceNodeId, {
          data: {
            ...instanceNode.data,
            nodeUI: originalNodeUI,
          },
        });
        return { ok: false, error: dbResult.error || "Failed to update nodeUI in database" };
      }

      return { ok: true, data: { nodeId: instanceNodeId, nodeUI } };
      
    } catch (error) {
      // Rollback optimistic update
      updateNode(instanceNodeId, {
        data: {
          ...instanceNode.data,
          nodeUI: originalNodeUI,
        },
      });
      console.error("❌ Failed to update component instance nodeUI:", error);
      return { ok: false, error: `Failed to update component instance nodeUI: ${error}` };
    }
  }, [getNode, updateNode]);

  
  /**
   * Reset component instance field to definition value
   */
  const resetComponentInstanceField = useCallback(async (
    instanceNode: Node,
    fieldId: string,
    fieldType: 'formData' | 'nodeUI'
  ): Promise<CreateStatus> => {
    if (!instanceNode) {
      return { ok: false, error: `Component instance node not found` };
    }
    const instanceNodeId = instanceNode.id;

    if (instanceNode.data.role !== "instance") {
      return { ok: false, error: "Node is not a component instance" };
    }

    // 1. Get component definition
    const instanceData = instanceNode.data.instanceData as ComponentInstanceData;
    const componentId = instanceData.componentId;
    if (!componentId) {
      return { ok: false, error: "Component definition not found" };
    }

    const definitionBlock = getComponentBlockById(componentId);
    if (!definitionBlock) {
      return { ok: false, error: "Component definition not found" };
    }

    // 2. Get definition value for the specific field
    let definitionValue: unknown;
    if (fieldType === 'formData') {
      definitionValue = (definitionBlock.metadata.formData as Record<string, unknown>)?.[fieldId];
    } else if (fieldType === 'nodeUI') {
      definitionValue = (definitionBlock.metadata.nodeUI as NodeUI)?.[fieldId];
    }

    // 3. Get current instance data for rollback
    const originalFormData = { ...(instanceNode.data.formData as Record<string, unknown>) };
    const originalNodeUI = { ...(instanceNode.data.nodeUI as NodeUI) };
    const updatedFormData = {
      ...originalFormData,
      [fieldId]: definitionValue,
    };
    const updatedNodeUI = {
      ...originalNodeUI,
      [fieldId]: definitionValue,
    };

    try {
      // 4. Update React Flow Node immediately (optimistic update)

      if (fieldType === 'formData') {
        updateNode(instanceNodeId, {
          data: {
            ...instanceNode.data,
            formData: updatedFormData,
          },
        });
      } else if (fieldType === 'nodeUI') {
        updateNode(instanceNodeId, {
          data: {
            ...instanceNode.data,
            nodeUI: updatedNodeUI,
          },
        });
      }

      // 5. Remove field from overrides
      const currentOverrides = instanceData.overrides[fieldType] || [];
      const newOverrides = currentOverrides.filter((overrideField: string) => overrideField !== fieldId);

      // 6. Sync to database
      const extractedFormSchema = extractUserDefinedSchema(instanceNode.type as BlockType, instanceNode.data.formSchema as FormSchema);
      const dbResult = await updateBlockAction({
        id: instanceNodeId,
        metadata: {
          formData: updatedFormData,
          nodeUI: updatedNodeUI,
          formSchema: extractedFormSchema,
          role: instanceNode.data.role,
          instanceData: {
            ...instanceData,
            overrides: {
              ...instanceData.overrides,
              [fieldType]: newOverrides,
            },
          },
        },
      });

      if (isFailure(dbResult)) {
        // Rollback optimistic update
        if (fieldType === 'formData') {
          updateNode(instanceNodeId, {
            data: {
              ...instanceNode.data,
              formData: originalFormData,
            },
          });
        } else if (fieldType === 'nodeUI') {
          updateNode(instanceNodeId, {
            data: {
              ...instanceNode.data,
              nodeUI: originalNodeUI,
            },
          });
        }
        return { ok: false, error: dbResult.error || "Failed to reset field in database" };
      }

      console.log(`✅ Component instance ${fieldType} field '${fieldId}' reset successfully:`, instanceNodeId);
      return { ok: true, data: { nodeId: instanceNodeId, fieldId, fieldType } };
      
    } catch (error) {
      // Rollback optimistic update
      if (fieldType === 'formData') {
        updateNode(instanceNodeId, {
          data: {
            ...instanceNode.data,
            formData: originalFormData,
          },
        });
      } else if (fieldType === 'nodeUI') {
        updateNode(instanceNodeId, {
          data: {
            ...instanceNode.data,
            nodeUI: originalNodeUI,
          },
        });
      }
      console.error("❌ Failed to reset component instance field:", error);
      return { ok: false, error: `Failed to reset component instance field: ${error}` };
    }
  }, [getNode, updateNode]);

  // ============================================================================
  // Component Definition Management
  // ============================================================================

  /**
   * Update component definition
   */
  const updateComponentDefinition = useCallback(async (
    definitionNode: Node,
    updates: any
  ): Promise<CreateStatus> => {
    if (!definitionNode) {
      return { ok: false, error: `Component definition not found` };
    }
    const definitionNodeId = definitionNode.id;

    if (definitionNode.data.object !== "component" || definitionNode.data.role !== "definition") {
      return { ok: false, error: "Node is not a component definition" };
    }

    const originalData = { ...definitionNode.data };
    const updatedData = {
      ...originalData,
      ...updates, // 뭐가 업데이트 됐는지 모름. formData, nodeUI 등등
    };

    try {
      // 1. Update React Flow Node immediately (optimistic update)
      updateNode(definitionNodeId, {
        data: updatedData,
      });

      // 2. Sync to database  
      const extractedFormSchema = extractUserDefinedSchema(definitionNode.type as BlockType, definitionNode.data.formSchema as FormSchema);
      const dbResult = await updateBlockAction({
        id: definitionNodeId,
        metadata: {
          nodeUI: updatedData.nodeUI,
          formSchema: extractedFormSchema,
          formData: updatedData.formData,
          componentData: updatedData.componentData,
          role: updatedData.role,
        },
      });

      if (isFailure(dbResult)) {
        // Rollback optimistic update
        updateNode(definitionNodeId, {
          data: originalData,
        });
        return { ok: false, error: dbResult.error || "Failed to update component definition in database" };
      }

      console.log("✅ Component definition updated successfully:", definitionNodeId);
      return { ok: true, data: { nodeId: definitionNodeId, updates } };
      
    } catch (error) {
      // Rollback optimistic update
      updateNode(definitionNodeId, {
        data: originalData,
      });
      console.error("❌ Failed to update component definition:", error);
      return { ok: false, error: `Failed to update component definition: ${error}` };
    }
  }, [getNode, updateNode]);

  /**
   * Delete component definition
   */
  const deleteComponentDefinition = useCallback(async (
    definitionNode: Node
  ): Promise<CreateStatus> => {
    if (!definitionNode) {
      return { ok: false, error: `Component definition not found` };
    }
    const definitionNodeId = definitionNode.id;

    if (definitionNode.data.role !== "definition") {
      return { ok: false, error: "Node is not a component definition" };
    }

    try {
      // 1. Get connected instance IDs from component definition
      const componentData = definitionNode.data.componentData as ComponentDefinitionData;
      const connectedInstanceIds = componentData?.connectedInstanceIds || [];

      // 2. Detach all instances first (convert to regular blocks) - 동시 처리
      const detachPromises = connectedInstanceIds.map(async (instanceId) => {
        const instanceNode = getNode(instanceId);
        if (!instanceNode) return { ok: true, instanceId };

        // Extract user-defined schema (remove default node schema)
        const currentFormSchema = instanceNode.data.formSchema as FormSchema;
        const nodeType = instanceNode.type as BlockType;
        const userDefinedSchema = extractUserDefinedSchema(nodeType, currentFormSchema);

        // Create detached node data (preserve current rendered state)
        const detachedNodeData = {
          ...instanceNode.data,
          // Remove component-related data
          role: undefined,
          instanceData: undefined,
          // Preserve current rendered state
          formData: instanceNode.data.formData,
          formSchema: instanceNode.data.formSchema, // 여기서는 렌더링된 상태 모두 저장
          nodeUI: instanceNode.data.nodeUI,
          updated_at: new Date().toISOString(),
        };

        // Update React Flow Node immediately (optimistic update)
        updateNode(instanceId, {
          data: detachedNodeData,
        });

        // Sync to database
        const dbResult = await updateBlockAction({
          id: instanceId,
          metadata: {
            formData: detachedNodeData.formData,
            formSchema: userDefinedSchema, // 사용자 정의 스키마만 저장
            nodeUI: detachedNodeData.nodeUI,
            // Remove component-related metadata
            role: undefined,
            instanceData: undefined,
          },
        });

        if (isFailure(dbResult)) {
          console.error(`Failed to detach instance ${instanceId}:`, dbResult.error);
          return { 
            ok: false, 
            instanceId, 
            error: `Failed to detach instance ${instanceId}: ${dbResult.error}` 
          };
        }

        return { ok: true, instanceId };
      });

      const detachResults = await Promise.all(detachPromises);
      
      // Check if any detach operations failed
      const failedDetaches = detachResults.filter(result => !result.ok);
      if (failedDetaches.length > 0) {
        console.error("Some instances failed to detach:", failedDetaches);
        return { 
          ok: false, 
          error: `Failed to detach ${failedDetaches.length} instances: ${failedDetaches.map(r => r.error).join(', ')}` 
        };
      }

      // 3. Remove component definition (optimistic update)
      deleteElements({ nodes: [{id: definitionNodeId}] });

      removeComponentBlock(definitionNodeId);

      // 4. Delete component definition from database
      const definitionResult = await updateBlockAction({
        id: definitionNodeId,
        deleted_at: new Date(),
      });

      if (isFailure(definitionResult)) {
        // Rollback optimistic update
        addNodes([definitionNode]);
        return { 
          ok: false, 
          error: definitionResult.error || "Failed to delete component definition in database" 
        };
      }

      console.log("✅ Component definition deleted successfully:", definitionNodeId);
      return { 
        ok: true, 
        data: { 
          nodeId: definitionNodeId, 
          detachedInstances: connectedInstanceIds.length,
          connectedInstanceIds 
        } 
      };
      
    } catch (error) {
      console.error("❌ Failed to delete component definition:", error);
      return { ok: false, error: `Failed to delete component definition: ${error}` };
    }
  }, [getNode, deleteElements, addNodes, updateBlockAction, removeComponentBlock]);

  // ============================================================================
  // Component Instance Detachment
  // ============================================================================

  /**
   * Detach component instance (convert to regular block)
   */
  const detachComponentInstance = useCallback(async (
    instanceNode: Node
  ): Promise<CreateStatus> => {
    if (!instanceNode) {
      return { ok: false, error: `Component instance not found` };
    }

    const instanceNodeId = instanceNode.id;
    if (instanceNode.data.role !== "instance") {
      return { ok: false, error: "Node is not a component instance" };
    }

    try {
      // 1. Get component definition
      const instanceData = instanceNode.data.instanceData as ComponentInstanceData;
      const componentId = instanceData?.componentId;
      if (!componentId) {
        return { ok: false, error: "Component definition not found" };
      }

      const definitionBlock = getComponentBlockById(componentId);
      if (!definitionBlock) {
        return { ok: false, error: "Component definition not found" };
      }

      // 2. Extract user-defined schema (remove default node schema)
      const currentFormSchema = instanceNode.data.formSchema as FormSchema;
      const userDefinedSchema = extractUserDefinedSchema(instanceNode.type as BlockType, currentFormSchema);

      // 3. Create detached node data (preserve current rendered state)
      const detachedNodeData = {
        ...instanceNode.data,
        // Remove component-related data
        role: undefined,
        instanceData: undefined,
        // Preserve current rendered state
        formData: instanceNode.data.formData,
        formSchema: instanceNode.data.formSchema, // 사용자 정의 스키마만 저장
        nodeUI: instanceNode.data.nodeUI,
        updated_at: new Date().toISOString(),
      };

      // 4. Update React Flow Node immediately (optimistic update)
      updateNode(instanceNodeId, {
        data: detachedNodeData,
      });

      // 5. Update component definition's connectedInstanceIds (remove this instance)
      const definitionComponentData = definitionBlock.metadata.componentData as ComponentDefinitionData;
      const currentInstanceIds = definitionComponentData?.connectedInstanceIds || [];
      const updatedInstanceIds = currentInstanceIds.filter(id => id !== instanceNodeId);

      // Optimistic update for component definition
      // 현재 컴포넌트가 react flow canvas에서 렌더링되고 있지 않기 때문에 처리하지 않음.
      // updateNode(componentId, {
      //   data: {
      //     ...definitionBlock.metadata,
      //     componentData: {
      //       ...definitionComponentData,
      //       connectedInstanceIds: updatedInstanceIds,
      //     },
      //   },
      // });

      // 6. Sync to database
      const dbResult = await updateBlockAction({
        id: instanceNodeId,
        metadata: {
          formData: instanceNode.data.formData,
          formSchema: userDefinedSchema, // 사용자 정의 스키마만 저장
          nodeUI: instanceNode.data.nodeUI,
          // Remove component-related metadata
          role: undefined,
          instanceData: undefined,
        },
      });

      if (isFailure(dbResult)) {
        // Rollback optimistic updates
        updateNode(instanceNodeId, {
          type: instanceNode.type,
          data: instanceNode.data,
        });
        return { ok: false, error: dbResult.error || "Failed to detach component instance in database" };
      }

      // Update component definition in database
      const definitionNodeUserDefinedSchema = extractUserDefinedSchema(definitionBlock.block_type as BlockType, definitionBlock.metadata.formSchema as FormSchema);
      const definitionUpdateResult = await updateBlockAction({
        id: componentId,
        metadata: {
          formData: definitionBlock.metadata.formData,
          formSchema: definitionNodeUserDefinedSchema,
          nodeUI: definitionBlock.metadata.nodeUI,
          role: definitionBlock.metadata.role,
          componentData: {
            ...definitionComponentData,
            connectedInstanceIds: updatedInstanceIds,
          },
        },
      });

      if (isFailure(definitionUpdateResult)) {
        // Rollback optimistic updates
        updateNode(instanceNodeId, {
          type: instanceNode.type,
          data: instanceNode.data,
        });
        return { ok: false, error: definitionUpdateResult.error || "Failed to update component definition in database" };
      }

      console.log("✅ Component instance detached successfully:", instanceNodeId);
      return { ok: true, data: { nodeId: instanceNodeId } };
      
    } catch (error) {
      // Rollback optimistic update
      updateNode(instanceNodeId, {
        type: instanceNode.type,
        data: instanceNode.data,
      });
      console.error("❌ Failed to detach component instance:", error);
      return { ok: false, error: `Failed to detach component instance: ${error}` };
    }
  }, [getNode, updateNode]);

  return {
    // Component Creation
    createComponentFromNode,
    createComponentInstance,
    
    // Component Instance Data Management
    updateComponentInstanceFormData,
    updateComponentInstanceNodeUI,  
    
    resetComponentInstanceField,
    
    // Component Definition Management
    updateComponentDefinition,
    deleteComponentDefinition,
    
    // Component Instance Detachment
    detachComponentInstance,
  } as const;
}
