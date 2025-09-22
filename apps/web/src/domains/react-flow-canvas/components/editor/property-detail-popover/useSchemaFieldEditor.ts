"use client";

import { useCallback, useMemo } from "react";
import { useReactFlowCommandsContext } from "@/domains/react-flow-canvas/contexts/ReactFlowCommandsContext";
import type { Node } from "@xyflow/react";
import {
  SchemaField,
  FormSchema,
  SchemaFieldOption,
  SchemaFieldType,
} from "@/domains/blocks/types";
import { createSlug } from "@/lib/regex";

type DuplicateParams = {
  label?: string;
  options?: SchemaFieldOption[];
};

// Helper functions for schema field operations
function updateFormSchemaField(
  node: Node,
  fieldId: string,
  updates: Partial<SchemaField>
): { 
  formSchema: FormSchema;
  formData: Record<string, unknown>;
} {
  const schema = (node.data.formSchema as FormSchema) || { fields: [] };
  const data = (node.data.formData as Record<string, unknown>) || {};

  // Update field in schema
  const updatedSchema = {
    ...schema,
    fields: (schema.fields as SchemaField[]).map((f) =>
      f.id === fieldId ? { ...f, ...updates } : f
    ),
  };

  // Handle field ID change (rename)
  let updatedData = { ...data };
  if (updates.id && updates.id !== fieldId) {
    const { [fieldId]: oldValue, ...rest } = data;
    updatedData = { ...rest, [updates.id]: oldValue };
  }

  return {
    formSchema: updatedSchema,
    formData: updatedData,
  };
}

function removeFormSchemaField(
  node: Node,
  fieldId: string
): { 
  formSchema: FormSchema;
  formData: Record<string, unknown> ;
} {
  const schema = (node.data.formSchema as FormSchema) || { fields: [] };
  const data = (node.data.formData as Record<string, unknown>) || {};

  const target = (schema.fields as SchemaField[]).find((f: SchemaField) => f.id === fieldId);
  if (target?.config?.predefined) {
    return { formSchema: schema, formData: data }; // do not remove predefined fields
  }

  // Remove field from schema
  const updatedSchema = {
    ...schema,
    fields: (schema.fields as SchemaField[]).filter((f: SchemaField) => f.id !== fieldId),
  };

  // Remove field value from data
  const { [fieldId]: removed, ...updatedData } = data;

  return {
    formSchema: updatedSchema,
    formData: updatedData,
  };
}

function addFormSchemaField(
  node: Node,
  newField: SchemaField
): { formSchema: FormSchema } {
  const schema = (node.data.formSchema as FormSchema) || { fields: [] };

  const updatedSchema = {
    ...schema,
    fields: [...(schema.fields as SchemaField[]), newField],
  };

  return {
    formSchema: updatedSchema,
  };
}

export function useSchemaFieldEditor(args: {
  node: Node;
  field: SchemaField;
}) {
  const { node, field } = args;
  const commands = useReactFlowCommandsContext();

  const formFields = (node.data.formSchema as FormSchema)?.fields || [];
  const formField = useMemo(
    () =>
      formFields.find((f: SchemaField) => f.id === field.id) as SchemaField | undefined,
    [formFields, field.id]
  );
  const isPredefined = !!formField?.config?.predefined;

  const persistNodeData = useCallback(
    async (updates: { 
      formSchema?: FormSchema; 
      formData?: Record<string, unknown> 
    }) => {
      // 모든 노드 타입(일반, 컴포넌트 정의, 컴포넌트 인스턴스)에 대해 동일한 updateNodeData 사용
      const result = await commands.nodeCommands.updateNodeData(node, updates);

      if (!result.ok) {
        console.error("Failed to update node:", result.error);
      }
    },
    [node, commands]
  );

  const saveLabel = useCallback(
    async (label: string) => {
      if (isPredefined) return;
      const { formSchema, formData } = updateFormSchemaField(node, field.id, {
        label,
      });
      await persistNodeData({ formSchema, formData });
    },
    [node, field.id, isPredefined, persistNodeData]
  );

  const deleteField = useCallback(async () => {
    if (isPredefined) return;
    const { formSchema, formData } = removeFormSchemaField(node, field.id);
    await persistNodeData({ formSchema, formData });
  }, [node, field.id, isPredefined, persistNodeData]);

  const duplicateField = useCallback(
    async (params: DuplicateParams) => {
      if (!formField) return;
      const base: SchemaField = {
        id: createSlug(`${field.id}_copy_${Date.now()}`),
        label: `${params.label || field.label} Copy`,
        type: field.type as SchemaFieldType,
        path: [createSlug(`${field.id}_copy_${Date.now()}`)], // Add path property
        options: params.options ?? formField.options,
        placeholder: formField.placeholder,
        validation: formField.validation,
      };
      const { formSchema } = addFormSchemaField(node, base);
      await persistNodeData({ formSchema });
    },
    [node, field.id, field.label, field.type, persistNodeData, formField]
  );

  const commitOptions = useCallback(
    async (options: SchemaFieldOption[]) => {
      if (isPredefined) return;
      const { formSchema } = updateFormSchemaField(node, field.id, {
        options,
      });
      await persistNodeData({ formSchema });
    },
    [node, field.id, isPredefined, persistNodeData]
  );

  return {
    isPredefined,
    formField,
    saveLabel,
    deleteField,
    duplicateField,
    commitOptions,
  };
}
