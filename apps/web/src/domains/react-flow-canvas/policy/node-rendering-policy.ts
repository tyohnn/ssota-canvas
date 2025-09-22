import type { Node as ReactFlowNode } from "@xyflow/react";
import type { Block, BlockPosition, BlockType } from "@/db/schema";
import {
  isComponentInstance,
  isComponentDefinition,
  type ComponentDefinition,
  type ComponentInstance,
  ComponentDefinitionMetadata,
  ComponentInstanceMetadata,
  type OverrideFlags
} from "@/domains/block-components";
import type {
  // Common Types
  DefaultMetadata,
  FormSchema,
  NodeUI,
} from "@/domains/blocks/types";
import { generateDefaultFormSchemaByType } from "./node-form-schema-policy";

/**
 * Merge default schema with database schema
 * Default fields come first, then user-defined fields
 */
function mergeFormSchemas(blockType: BlockType, dbSchema: FormSchema): FormSchema {
  const defaultSchema = generateDefaultFormSchemaByType(blockType);
  const dbFields = dbSchema?.fields || [];
  
  // 필드 ID로 중복 제거 (기본 스키마가 우선)
  const defaultFieldIds = new Set(defaultSchema.fields?.map((f: any) => f.id) || []);
  const userFields = dbFields.filter((f: any) => !defaultFieldIds.has(f.id));
  
  return {
    fields: [
      // default field가 먼저 렌더링
      ...(defaultSchema.fields || []),
      ...userFields
    ]
  };
}

/**
 * Merge schemas for component instance: 기본 스키마 + 컴포넌트 정의 스키마 + 인스턴스 스키마
 * Priority: 기본 스키마 < 컴포넌트 정의 스키마 < 인스턴스 스키마
 */
function mergeComponentInstanceSchemas(
  blockType: BlockType,
  definition: ComponentDefinition,
  instance: ComponentInstance
): any {
  // 1. 기본 스키마 (노드 타입별)
  const defaultSchema = generateDefaultFormSchemaByType(blockType);
  const defaultFields = defaultSchema.fields || [];
  
  // 2. 컴포넌트 정의 스키마 (DB에서)
  const definitionMetadata = definition.metadata as ComponentDefinitionMetadata;
  const definitionSchema = definitionMetadata.formSchema || { fields: [] };
  const definitionFields = definitionSchema.fields || [];
  
  // 3. 인스턴스 스키마 (DB에서)
  const instanceMetadata = instance.metadata as ComponentInstanceMetadata;
  const instanceSchema = instanceMetadata.formSchema || { fields: [] };
  const instanceFields = instanceSchema.fields || [];
  
  // 필드 ID로 중복 제거 (우선순위: 기본 < 정의 < 인스턴스)
  const allFieldIds = new Set<string>();
  const mergedFields: any[] = [];
  
  // 기본 스키마 필드 추가
  defaultFields.forEach((field: any) => {
    if (!allFieldIds.has(field.id)) {
      mergedFields.push(field);
      allFieldIds.add(field.id);
    }
  });
  
  // 컴포넌트 정의 스키마 필드 추가 (기본 스키마와 중복되지 않는 것만)
  definitionFields.forEach((field: any) => {
    if (!allFieldIds.has(field.id)) {
      // 컴포넌트 정의 필드에 predefined 플래그 추가
      // 인스턴스 노드 입장에서 컴포넌트 노드의 필드는 수정이 불가해야하기 때문에 predefined 플래그 추가
      mergedFields.push({
        ...field,
        config: {
          ...field.config,
          predefined: true
        }
      });
      allFieldIds.add(field.id);
    }
  });
  
  // 인스턴스 스키마 필드 추가 (기본/정의 스키마와 중복되지 않는 것만)
  instanceFields.forEach((field: any) => {
    if (!allFieldIds.has(field.id)) {
      mergedFields.push(field);
      allFieldIds.add(field.id);
    }
  });
  
  return {
    fields: mergedFields
  };
}

/**
 * Resolve nodeUI for component instance with override detection
 * Uses OverrideFlags to determine which fields are actually overridden
 */
function resolveInstanceNodeStyle(
  instance: ComponentInstance,
  definition: ComponentDefinition
): NodeUI {
  const instanceMetadata = instance.metadata as ComponentInstanceMetadata;
  const definitionMetadata = definition.metadata as ComponentDefinitionMetadata;
  
  // 컴포넌트 정의의 nodeUI를 기본값으로 사용
  const baseStyle = definitionMetadata.nodeUI || {};
  const resolvedStyle = { ...baseStyle };
  
  // OverrideFlags에 있는 필드만 실제로 오버라이드
  const overriddenFields = (instanceMetadata.instanceData.overrides as OverrideFlags)?.nodeUI || [];
  
  overriddenFields.forEach((fieldName: string) => {
    if (instanceMetadata.nodeUI?.[fieldName] !== undefined) {
      (resolvedStyle as any)[fieldName] = (instanceMetadata.nodeUI as any)[fieldName];
    }
  });
  
  return resolvedStyle as NodeUI;
}

/**
 * Resolve formData for component instance with override detection
 * Uses OverrideFlags to determine which fields are actually overridden
 */
function resolveInstanceFormData(
  instance: ComponentInstance,
  definition: ComponentDefinition
): Record<string, unknown> {
  const instanceMetadata = instance.metadata as ComponentInstanceMetadata;
  const definitionMetadata = definition.metadata as ComponentDefinitionMetadata;
  
  // 컴포넌트 정의의 formData를 기본값으로 사용
  const baseData = definitionMetadata.formData || {};
  const resolvedData = { ...baseData };
  
  // OverrideFlags에 있는 필드만 실제로 오버라이드
  const overriddenFields = (instanceMetadata.instanceData.overrides as OverrideFlags)?.formData || [];
  
  overriddenFields.forEach((fieldName: string) => {
    if (instanceMetadata.formData?.[fieldName] !== undefined) {
      resolvedData[fieldName] = (instanceMetadata.formData as any)[fieldName];
    }
  });
  
  return resolvedData;
}


// ============================================================================
// React Flow Node Building Functions
// ============================================================================


/**
 * Build React Flow node for component instance with override logic
 */
export function buildComponentInstanceNode(
  instance: ComponentInstance,
  position: BlockPosition,
  componentDefinitionsById: Record<string, ComponentDefinition>
): ReactFlowNode {
  const metadata = instance.metadata as ComponentInstanceMetadata;
  const definition = componentDefinitionsById[metadata.instanceData.componentId];

  if (!definition) {
    throw new Error(`Component definition not found for instance: ${instance.id}`);
  }

  // 3단계 스키마 병합: 기본 스키마 + 컴포넌트 정의 스키마 + 인스턴스 스키마
  const mergedSchema = mergeComponentInstanceSchemas(
    instance.block_type,
    definition,
    instance
  );

  // Apply override logic with new nodeUI and formData override detection
  const resolvedStyle = resolveInstanceNodeStyle(instance, definition);
  const resolvedData = resolveInstanceFormData(instance, definition);

  return {
    id: instance.id,
    type: instance.block_type,
    position: {
      x: Number(position.x_position) || 0,
      y: Number(position.y_position) || 0,
    },
    data: {
      title: instance.title,
      slug: instance.slug,
      workspace_id: instance.workspace_id,
      parent_block_id: instance.parent_block_id,
      order: instance.order,
      icon_name: instance.icon_name,
      object: instance.object, // block
      created_at: instance.created_at,
      updated_at: instance.updated_at,
      ...metadata,
      formData: resolvedData,
      formSchema: mergedSchema, // 병합된 스키마 사용
      nodeUI: resolvedStyle,
      role: metadata.role,
      instanceData: metadata.instanceData,
    },
    width: resolvedStyle.size.width,
    // height: resolvedStyle.size.height,
  } as ReactFlowNode;
}

/**
 * Build React Flow node for component definition
 */
export function buildComponentDefinitionNode(
  definition: ComponentDefinition,
  position: BlockPosition
): ReactFlowNode {
  const metadata = definition.metadata as ComponentDefinitionMetadata;

  // 공통 함수로 스키마 병합 (컴포넌트 정의도 기본 스키마를 가질 수 있음)
  const mergedSchema = mergeFormSchemas(definition.block_type, metadata.formSchema);

  return {
    id: definition.id,
    type: definition.block_type,
    position: {
      x: Number(position.x_position) || 0,
      y: Number(position.y_position) || 0,
    },
    data: {
      title: definition.title,
      slug: definition.slug,
      workspace_id: definition.workspace_id,
      parent_block_id: definition.parent_block_id,
      order: definition.order,
      icon_name: definition.icon_name,
      object: definition.object, // component
      created_at: definition.created_at,
      updated_at: definition.updated_at,
      ...metadata,
      formSchema: mergedSchema, // 병합된 스키마 사용
      role: definition.metadata.role,
      componentData: definition.metadata.componentData,
    },
    width: metadata.nodeUI.size.width,
    // height: metadata.nodeUI.size.height,
  } as ReactFlowNode;
}

/**
 * Build React Flow node for regular block (non-component)
 */
export function buildRegularNode(
  block: Block,
  position: BlockPosition
): ReactFlowNode {
  const metadata = block.metadata as DefaultMetadata;
  
  // 공통 함수로 스키마 병합
  const mergedSchema = mergeFormSchemas(block.block_type, metadata.formSchema);
  
  return {
    id: block.id,
    type: block.block_type,
    position: {
      x: Number(position.x_position) || 0,
      y: Number(position.y_position) || 0,
    },
    data: {
      title: block.title,
      slug: block.slug,
      workspace_id: block.workspace_id,
      parent_block_id: block.parent_block_id,
      order: block.order,
      icon_name: block.icon_name,
      object: block.object,
      created_at: block.created_at,
      updated_at: block.updated_at,
      ...metadata,
      formSchema: mergedSchema, // 병합된 스키마 사용
    },
    width: metadata.nodeUI.size.width,
    // height: metadata.nodeUI.size.height,
  } as ReactFlowNode;
}

/**
 * Transform a block with position to React Flow node
 */
export function transformBlockToReactFlowNode(
  block: Block,
  position: BlockPosition,
  componentDefinitionsById: Record<string, ComponentDefinition>
): ReactFlowNode {
  try {
    // Handle different block types
    if (isComponentInstance(block)) {
      return buildComponentInstanceNode(block, position, componentDefinitionsById);
    }
    
    if (isComponentDefinition(block)) {
      return buildComponentDefinitionNode(block, position);
    }
    
    // Regular block
    return buildRegularNode(block, position);
  } catch (error) {
    console.error('Failed to transform block to React Flow node:', error, block);
    throw error;
  }
}
