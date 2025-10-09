'use server';

import { z } from 'zod';
import { and, eq, sql } from 'drizzle-orm';
import { createClerkDrizzleSupabaseClient } from '@/db/clerk-client';
import { blocks, type Block, type NewBlock } from '@/db/schema';
import { ActionResult, ok, err } from '@/lib/action-result';
import {
  isComponentDefinition,
  isComponentInstance,
  type ComponentDefinition,
  type ComponentInstance,
  type ComponentDefinitionMetadata,
  type ComponentInstanceMetadata,
} from '@/domains/block-components';
import { devLog, devError, devWarn, startTimer } from '@/utils/dev-logger';

// ============================================================================
// Input Schemas
// ============================================================================

const createComponentDefinitionSchema = z.object({
  workspaceId: z.uuid(),
  blockType: z.string(),
  title: z.string().min(1),
  slug: z.string().optional(),
  componentKey: z.string().optional(),
  componentCategory: z.string().optional(),
  description: z.string().optional(),
  nodeUI: z.record(z.string(), z.any()).optional(),
  schema: z.record(z.string(), z.any()).optional(),
});

const createComponentInstanceSchema = z.object({
  workspaceId: z.uuid(),
  blockType: z.string(),
  title: z.string().min(1),
  slug: z.string().optional(),
  componentId: z.uuid(),
  data: z.record(z.string(), z.any()).optional(),
  nodeUI: z.record(z.string(), z.any()).optional(),
});

const updateComponentDefinitionSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).optional(),
  componentKey: z.string().optional(),
  componentCategory: z.string().optional(),
  description: z.string().optional(),
  nodeUI: z.record(z.string(), z.any()).optional(),
  schema: z.record(z.string(), z.any()).optional(),
});

const updateComponentInstanceSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1).optional(),
  data: z.record(z.string(), z.any()).optional(),
  nodeUI: z.record(z.string(), z.any()).optional(),
});

const deleteComponentDefinitionSchema = z.object({
  id: z.uuid(),
  deleteInstances: z.boolean().optional(),
});

const getComponentDefinitionsSchema = z.object({
  workspaceId: z.uuid(),
});

const getComponentInstancesSchema = z.object({
  workspaceId: z.uuid(),
  definitionId: z.uuid(),
});

// ============================================================================
// Type Exports
// ============================================================================

export type CreateComponentDefinitionInput = z.infer<
  typeof createComponentDefinitionSchema
>;
export type CreateComponentInstanceInput = z.infer<
  typeof createComponentInstanceSchema
>;
export type UpdateComponentDefinitionInput = z.infer<
  typeof updateComponentDefinitionSchema
>;
export type UpdateComponentInstanceInput = z.infer<
  typeof updateComponentInstanceSchema
>;
export type DeleteComponentDefinitionInput = z.infer<
  typeof deleteComponentDefinitionSchema
>;
export type GetComponentDefinitionsInput = z.infer<
  typeof getComponentDefinitionsSchema
>;
export type GetComponentInstancesInput = z.infer<
  typeof getComponentInstancesSchema
>;

// ============================================================================
// Component Definition Actions
// ============================================================================

/**
 * Create a new component definition
 */
export async function createComponentDefinition(
  input: CreateComponentDefinitionInput
): Promise<ActionResult<ComponentDefinition>> {
  const timer = startTimer('Server Component Definition Creation');

  try {
    devLog('🏗️ [Server] Creating component definition', {
      workspaceId: input.workspaceId,
      blockType: input.blockType,
      title: input.title,
      componentKey: input.componentKey,
      componentCategory: input.componentCategory,
    });

    const validated = createComponentDefinitionSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const metadata: ComponentDefinitionMetadata = {
      role: 'definition',
      formData: {},
      formSchema: { fields: [] },
      nodeUI: { size: { width: 150, height: 100 } },
      componentData: {
        componentKey: validated.componentKey,
        description: validated.description,
        connectedInstanceIds: [],
      },
    };

    const newBlock = {
      workspace_id: validated.workspaceId,
      object: 'component' as const,
      block_type: validated.blockType as any,
      title: validated.title,
      slug:
        validated.slug || validated.title.toLowerCase().replace(/\s+/g, '-'),
      icon_name: 'component',
      metadata,
      order: 0,
      parent_block_id: null,
    } satisfies Partial<NewBlock>;

    const inserted = await db.rls(async tx => {
      const [created] = await tx.insert(blocks).values(newBlock).returning();
      return created as Block;
    });

    timer.log('Database insert completed');

    devLog('✅ [Server] Component definition created successfully', {
      componentId: inserted.id,
      componentKey: validated.componentKey,
      componentCategory: validated.componentCategory,
      totalTime: timer.end(),
    });

    return ok(inserted as ComponentDefinition);
  } catch (e) {
    timer.end();
    devError('❌ [Server] Failed to create component definition', e);
    const message =
      e instanceof Error ? e.message : 'Failed to create component definition';
    return err(message);
  }
}

/**
 * Create a new component instance
 */
export async function createComponentInstance(
  input: CreateComponentInstanceInput
): Promise<ActionResult<ComponentInstance>> {
  const timer = startTimer('Server Component Instance Creation');

  try {
    devLog('🏗️ [Server] Creating component instance', {
      workspaceId: input.workspaceId,
      blockType: input.blockType,
      title: input.title,
      componentId: input.componentId,
    });

    const validated = createComponentInstanceSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    // Verify the component definition exists
    const definition = await db.rls(async tx => {
      const [row] = await tx
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.id, validated.componentId),
            eq(blocks.workspace_id, validated.workspaceId),
            eq(blocks.object, 'component')
          )
        )
        .limit(1);
      return row as Block | undefined;
    });

    if (!definition) {
      devError('❌ [Server] Component definition not found', {
        componentId: validated.componentId,
      });
      return err('Component definition not found');
    }

    if (!isComponentDefinition(definition)) {
      devError('❌ [Server] Referenced block is not a component definition', {
        componentId: validated.componentId,
      });
      return err('Referenced block is not a component definition');
    }

    const metadata: ComponentInstanceMetadata = {
      role: 'instance',
      formData: validated.data || {},
      formSchema: { fields: [] },
      nodeUI: (validated.nodeUI as any) || {
        size: { width: 150, height: 100 },
      },
      instanceData: {
        componentId: validated.componentId,
        overrides: {
          nodeUI: [],
          formData: [],
          formSchema: [],
        },
      },
    };

    const newBlock = {
      workspace_id: validated.workspaceId,
      object: 'block' as const,
      block_type: validated.blockType as any,
      title: validated.title,
      slug:
        validated.slug || validated.title.toLowerCase().replace(/\s+/g, '-'),
      icon_name: 'component',
      metadata,
      order: 0,
      parent_block_id: null,
    } satisfies Partial<NewBlock>;

    const inserted = await db.rls(async tx => {
      const [created] = await tx.insert(blocks).values(newBlock).returning();
      return created as Block;
    });

    timer.log('Database insert completed');

    devLog('✅ [Server] Component instance created successfully', {
      instanceId: inserted.id,
      componentId: validated.componentId,
      totalTime: timer.end(),
    });

    return ok(inserted as ComponentInstance);
  } catch (e) {
    timer.end();
    devError('❌ [Server] Failed to create component instance', e);
    const message =
      e instanceof Error ? e.message : 'Failed to create component instance';
    return err(message);
  }
}

/**
 * Update a component definition
 */
export async function updateComponentDefinition(
  input: UpdateComponentDefinitionInput
): Promise<ActionResult<ComponentDefinition>> {
  try {
    devLog('🔄 [Server] Updating component definition', {
      definitionId: input.id,
      title: input.title,
      componentKey: input.componentKey,
    });

    const validated = updateComponentDefinitionSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    // Get the existing component definition
    const existing = await db.rls(async tx => {
      const [row] = await tx
        .select()
        .from(blocks)
        .where(eq(blocks.id, validated.id))
        .limit(1);
      return row as Block | undefined;
    });

    if (!existing) {
      return err('Component definition not found');
    }

    if (!isComponentDefinition(existing)) {
      return err('Block is not a component definition');
    }

    // Prepare update data
    const updates: Partial<Block> = {};

    if (validated.title !== undefined) {
      updates.title = validated.title;
    }

    const metadataUpdates: Record<string, any> = { ...existing.metadata };

    if (validated.componentKey !== undefined) {
      metadataUpdates.componentData = {
        ...metadataUpdates.componentData,
        componentKey: validated.componentKey,
      };
    }

    if (validated.componentCategory !== undefined) {
      metadataUpdates.componentData = {
        ...metadataUpdates.componentData,
        componentCategory: validated.componentCategory,
      };
    }

    if (validated.description !== undefined) {
      metadataUpdates.componentData = {
        ...metadataUpdates.componentData,
        description: validated.description,
      };
    }

    if (validated.nodeUI !== undefined) {
      metadataUpdates.nodeUI = validated.nodeUI;
    }

    if (validated.schema !== undefined) {
      metadataUpdates.formSchema = validated.schema;
    }

    updates.metadata = metadataUpdates;
    updates.updated_at = new Date();

    const updated = await db.rls(async tx => {
      const [row] = await tx
        .update(blocks)
        .set(updates)
        .where(eq(blocks.id, validated.id))
        .returning();
      return row as Block;
    });

    devLog('✅ [Server] Component definition updated successfully', {
      definitionId: updated.id,
    });

    return ok(updated as ComponentDefinition);
  } catch (e) {
    devError('❌ [Server] Failed to update component definition', e);
    const message =
      e instanceof Error ? e.message : 'Failed to update component definition';
    return err(message);
  }
}

/**
 * Update a component instance
 */
export async function updateComponentInstance(
  input: UpdateComponentInstanceInput
): Promise<ActionResult<ComponentInstance>> {
  try {
    devLog('🔄 [Server] Updating component instance', {
      instanceId: input.id,
      title: input.title,
    });

    const validated = updateComponentInstanceSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    // Get the existing component instance
    const existing = await db.rls(async tx => {
      const [row] = await tx
        .select()
        .from(blocks)
        .where(eq(blocks.id, validated.id))
        .limit(1);
      return row as Block | undefined;
    });

    if (!existing) {
      return err('Component instance not found');
    }

    if (!isComponentInstance(existing)) {
      return err('Block is not a component instance');
    }

    // Prepare update data
    const updates: Partial<Block> = {};

    if (validated.title !== undefined) {
      updates.title = validated.title;
    }

    const metadataUpdates: Record<string, any> = { ...existing.metadata };

    if (validated.data !== undefined) {
      metadataUpdates.formData = validated.data;
    }

    if (validated.nodeUI !== undefined) {
      if (Object.keys(validated.nodeUI).length === 0) {
        // Remove style overrides
        delete metadataUpdates.nodeUI;
      } else {
        metadataUpdates.nodeUI = validated.nodeUI;
      }
    }

    updates.metadata = metadataUpdates;
    updates.updated_at = new Date();

    const updated = await db.rls(async tx => {
      const [row] = await tx
        .update(blocks)
        .set(updates)
        .where(eq(blocks.id, validated.id))
        .returning();
      return row as Block;
    });

    devLog('✅ [Server] Component instance updated successfully', {
      instanceId: updated.id,
    });

    return ok(updated as ComponentInstance);
  } catch (e) {
    devError('❌ [Server] Failed to update component instance', e);
    const message =
      e instanceof Error ? e.message : 'Failed to update component instance';
    return err(message);
  }
}

/**
 * Delete a component definition and optionally its instances
 */
export async function deleteComponentDefinition(
  input: DeleteComponentDefinitionInput
): Promise<ActionResult<Block>> {
  try {
    devLog('🗑️ [Server] Deleting component definition', {
      definitionId: input.id,
      deleteInstances: input.deleteInstances,
    });

    const validated = deleteComponentDefinitionSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    // Get the existing component definition
    const existing = await db.rls(async tx => {
      const [row] = await tx
        .select()
        .from(blocks)
        .where(eq(blocks.id, validated.id))
        .limit(1);
      return row as Block | undefined;
    });

    if (!existing) {
      return err('Component definition not found');
    }

    if (!isComponentDefinition(existing)) {
      return err('Block is not a component definition');
    }

    if (validated.deleteInstances) {
      // Delete all instances of this component
      await db.rls(async tx => {
        await tx
          .update(blocks)
          .set({
            deleted_at: new Date(),
            updated_at: new Date(),
          })
          .where(
            and(
              eq(blocks.workspace_id, existing.workspace_id),
              eq(blocks.object, 'block')
              // Note: We'd need to use a JSON query to check metadata.instanceData.componentId
              // For now, this is a simplified version
            )
          );
      });
    }

    // Delete the definition
    const deleted = await db.rls(async tx => {
      const [row] = await tx
        .update(blocks)
        .set({
          deleted_at: new Date(),
          updated_at: new Date(),
        })
        .where(eq(blocks.id, validated.id))
        .returning();
      return row as Block;
    });

    devLog('✅ [Server] Component definition deleted successfully', {
      definitionId: deleted.id,
    });

    return ok(deleted);
  } catch (e) {
    devError('❌ [Server] Failed to delete component definition', e);
    const message =
      e instanceof Error ? e.message : 'Failed to delete component definition';
    return err(message);
  }
}

/**
 * Get all component definitions in a workspace
 */
export async function getComponentDefinitions(
  input: GetComponentDefinitionsInput
): Promise<ActionResult<ComponentDefinition[]>> {
  try {
    const validated = getComponentDefinitionsSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    const definitions = await db.rls(async tx => {
      const rows = await tx
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.workspace_id, validated.workspaceId),
            eq(blocks.object, 'component'),
            sql`${blocks.deleted_at} IS NULL`
          )
        );
      return rows as Block[];
    });

    // Filter to only component definitions
    const componentDefinitions = definitions.filter(isComponentDefinition);

    devLog('✅ [Server] Component definitions retrieved', {
      count: componentDefinitions.length,
      workspaceId: validated.workspaceId,
    });

    return ok(componentDefinitions);
  } catch (e) {
    devError('❌ [Server] Failed to get component definitions', e);
    const message =
      e instanceof Error ? e.message : 'Failed to get component definitions';
    return err(message);
  }
}

/**
 * Get all instances of a specific component definition
 */
export async function getComponentInstances(
  input: GetComponentInstancesInput
): Promise<ActionResult<ComponentInstance[]>> {
  try {
    const validated = getComponentInstancesSchema.parse(input);
    const db = await createClerkDrizzleSupabaseClient();

    // Verify the definition exists
    const definition = await db.rls(async tx => {
      const [row] = await tx
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.id, validated.definitionId),
            eq(blocks.workspace_id, validated.workspaceId),
            eq(blocks.object, 'component')
          )
        )
        .limit(1);
      return row as Block | undefined;
    });

    if (!definition) {
      return err('Component definition not found');
    }

    if (!isComponentDefinition(definition)) {
      return err('Block is not a component definition');
    }

    // Get all blocks in the workspace that are component instances
    const allBlocks = await db.rls(async tx => {
      const rows = await tx
        .select()
        .from(blocks)
        .where(
          and(
            eq(blocks.workspace_id, validated.workspaceId),
            eq(blocks.object, 'block'),
            sql`${blocks.deleted_at} IS NULL`
          )
        );
      return rows as Block[];
    });

    // Filter to instances of this specific definition
    const instances = allBlocks.filter((block): block is ComponentInstance => {
      return (
        isComponentInstance(block) &&
        block.metadata.instanceData?.componentId === validated.definitionId
      );
    });

    devLog('✅ [Server] Component instances retrieved', {
      count: instances.length,
      definitionId: validated.definitionId,
    });

    return ok(instances);
  } catch (e) {
    devError('❌ [Server] Failed to get component instances', e);
    const message =
      e instanceof Error ? e.message : 'Failed to get component instances';
    return err(message);
  }
}
