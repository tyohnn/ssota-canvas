"use client";

import { useCallback, useMemo } from "react";
import { useCanvasCommandsContext } from "@/domains/canvas/contexts/CanvasCommandsContext";
import type { Block } from "@/db/schema";
import type { EditorField } from "@/domains/canvas/policy/block-editor-policy";
import {
  addUserSchemaField,
  removeUserSchemaField,
  updateUserSchemaField,
} from "@/domains/canvas/policy/block-editor-policy";
import type {
  DefaultMetadata,
  UserSchemaField,
} from "@/domains/canvas/policy/block-rendering-policy";
import { createSlug } from "@/lib/regex";

type DuplicateParams = {
  label?: string;
  options?: any[];
};

export function useSchemaFieldEditor(args: {
  block: Block;
  field: EditorField;
}) {
  const { block, field } = args;
  const commands = useCanvasCommandsContext();

  const metadata = (block.metadata || {}) as DefaultMetadata;
  const userFields = metadata.schema?.fields || [];
  const userField = useMemo(
    () =>
      userFields.find((f) => f.id === field.key) as UserSchemaField | undefined,
    [userFields, field.key]
  );
  const isPredefined = !!userField?.config?.predefined;

  const persistMetadata = useCallback(
    async (nextMetadata: DefaultMetadata) => {
      const result = await commands.updateBlock(block.id, {
        metadata: nextMetadata as any,
      });

      if (!result.ok) {
        console.error("Failed to update block:", result.error);
      }
    },
    [block.id, commands]
  );

  const saveLabel = useCallback(
    async (label: string) => {
      if (isPredefined) return;
      const { metadata: md } = updateUserSchemaField(block, field.key, {
        label,
      });
      await persistMetadata(md as DefaultMetadata);
    },
    [block, field.key, isPredefined, persistMetadata]
  );

  const deleteField = useCallback(async () => {
    if (isPredefined) return;
    const { metadata: md } = removeUserSchemaField(block, field.key);
    await persistMetadata(md as DefaultMetadata);
  }, [block, field.key, isPredefined, persistMetadata]);

  const duplicateField = useCallback(
    async (params?: DuplicateParams) => {
      const base: UserSchemaField = {
        id: createSlug(`${field.key}_copy_${Date.now()}`),
        label: `${params?.label || field.label} Copy`,
        type: field.type as any,
        options: params?.options ?? (userField as any)?.options,
        placeholder: (userField as any)?.placeholder,
        validation: (userField as any)?.validation,
      };
      const { metadata: md } = addUserSchemaField(block, base);
      await persistMetadata(md as DefaultMetadata);
    },
    [block, field.key, field.label, field.type, persistMetadata, userField]
  );

  const commitOptions = useCallback(
    async (options: any[]) => {
      if (isPredefined) return;
      const { metadata: md } = updateUserSchemaField(block, field.key, {
        options,
      } as any);
      await persistMetadata(md as DefaultMetadata);
    },
    [block, field.key, isPredefined, persistMetadata]
  );

  return {
    isPredefined,
    userField,
    saveLabel,
    deleteField,
    duplicateField,
    commitOptions,
  };
}
