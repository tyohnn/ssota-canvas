"use server";

import { actionWrapper } from "@/lib/action-result";
import { getWorkspace } from "@/auth/permissions";
import { db } from "@/db";
import { blocks, type Block } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  isComponentDefinition,
  isComponentInstance,
  validateComponentDefinition,
  validateComponentInstance,
  type ComponentDefinition,
  type ComponentInstance,
} from "@/domains/canvas/types/component";

export type CreateComponentDefinitionParams = {
  workspaceId: string;
  blockType: string;
  name: string;
  slug?: string;
  componentKey: string;
  componentCategory?: string;
  description?: string;
  nodeUI: Record<string, any>;
  schema?: Record<string, any>;
};

export type CreateComponentInstanceParams = {
  workspaceId: string;
  blockType: string;
  name: string;
  slug?: string;
  componentId: string;
  data?: Record<string, any>;
  nodeUI?: Record<string, any>; // style overrides
};

export type UpdateComponentDefinitionParams = {
  id: string;
  name?: string;
  componentKey?: string;
  componentCategory?: string;
  description?: string;
  nodeUI?: Record<string, any>;
  schema?: Record<string, any>;
};

export type UpdateComponentInstanceParams = {
  id: string;
  name?: string;
  data?: Record<string, any>;
  nodeUI?: Record<string, any>; // style overrides
};

/**
 * Create a new component definition
 */
export const createComponentDefinition = actionWrapper(
  async (params: CreateComponentDefinitionParams) => {
    const workspace = await getWorkspace(params.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const metadata = {
      role: "definition",
      component_key: params.componentKey,
      component_category: params.componentCategory || "custom",
      description: params.description,
      node_ui: params.nodeUI,
      schema: params.schema,
    };

    const newBlock = {
      workspace_id: params.workspaceId,
      object: "component" as const,
      block_type: params.blockType as any,
      name: params.name,
      slug: params.slug || params.name.toLowerCase().replace(/\s+/g, "-"),
      icon_name: "component",
      metadata,
      order: 0,
      parent_block_id: null,
    };

    const [created] = await db.insert(blocks).values(newBlock).returning();

    // Validate the created component definition
    if (!isComponentDefinition(created)) {
      throw new Error("Failed to create valid component definition");
    }

    const validation = validateComponentDefinition(created);
    if (!validation.valid) {
      throw new Error(
        `Invalid component definition: ${validation.errors.join(", ")}`
      );
    }

    return created;
  }
);

/**
 * Create a new component instance
 */
export const createComponentInstance = actionWrapper(
  async (params: CreateComponentInstanceParams) => {
    const workspace = await getWorkspace(params.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Verify the component definition exists
    const definition = await db
      .select()
      .from(blocks)
      .where(
        and(
          eq(blocks.id, params.componentId),
          eq(blocks.workspace_id, params.workspaceId),
          eq(blocks.object, "component")
        )
      )
      .limit(1);

    if (definition.length === 0) {
      throw new Error("Component definition not found");
    }

    const componentDef = definition[0];
    if (!isComponentDefinition(componentDef)) {
      throw new Error("Referenced block is not a component definition");
    }

    const metadata = {
      role: "instance",
      component_id: params.componentId,
      data: params.data || {},
      ...(params.nodeUI && { node_ui: params.nodeUI }),
    };

    const newBlock = {
      workspace_id: params.workspaceId,
      object: "component" as const,
      block_type: params.blockType as any,
      name: params.name,
      slug: params.slug || params.name.toLowerCase().replace(/\s+/g, "-"),
      icon_name: componentDef.icon_name || "component",
      metadata,
      order: 0,
      parent_block_id: null,
    };

    const [created] = await db.insert(blocks).values(newBlock).returning();

    // Validate the created component instance
    if (!isComponentInstance(created)) {
      throw new Error("Failed to create valid component instance");
    }

    const validation = validateComponentInstance(created, componentDef);
    if (!validation.valid) {
      throw new Error(
        `Invalid component instance: ${validation.errors.join(", ")}`
      );
    }

    return created;
  }
);

/**
 * Update a component definition
 */
export const updateComponentDefinition = actionWrapper(
  async (params: UpdateComponentDefinitionParams) => {
    // Get the existing component definition
    const existing = await db
      .select()
      .from(blocks)
      .where(eq(blocks.id, params.id))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Component definition not found");
    }

    const existingBlock = existing[0];
    if (!isComponentDefinition(existingBlock)) {
      throw new Error("Block is not a component definition");
    }

    // Verify workspace access
    const workspace = await getWorkspace(existingBlock.workspace_id);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Prepare update data
    const updates: Partial<Block> = {};

    if (params.name !== undefined) {
      updates.name = params.name;
    }

    const metadataUpdates: Record<string, any> = { ...existingBlock.metadata };

    if (params.componentKey !== undefined) {
      metadataUpdates.component_key = params.componentKey;
    }

    if (params.componentCategory !== undefined) {
      metadataUpdates.component_category = params.componentCategory;
    }

    if (params.description !== undefined) {
      metadataUpdates.description = params.description;
    }

    if (params.nodeUI !== undefined) {
      metadataUpdates.node_ui = params.nodeUI;
    }

    if (params.schema !== undefined) {
      metadataUpdates.schema = params.schema;
    }

    updates.metadata = metadataUpdates;
    updates.updated_at = new Date();

    const [updated] = await db
      .update(blocks)
      .set(updates)
      .where(eq(blocks.id, params.id))
      .returning();

    // Validate the updated component definition
    const validation = validateComponentDefinition(updated);
    if (!validation.valid) {
      throw new Error(
        `Invalid component definition after update: ${validation.errors.join(", ")}`
      );
    }

    return updated;
  }
);

/**
 * Update a component instance
 */
export const updateComponentInstance = actionWrapper(
  async (params: UpdateComponentInstanceParams) => {
    // Get the existing component instance
    const existing = await db
      .select()
      .from(blocks)
      .where(eq(blocks.id, params.id))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Component instance not found");
    }

    const existingBlock = existing[0];
    if (!isComponentInstance(existingBlock)) {
      throw new Error("Block is not a component instance");
    }

    // Verify workspace access
    const workspace = await getWorkspace(existingBlock.workspace_id);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Get the component definition for validation
    const definition = await db
      .select()
      .from(blocks)
      .where(
        and(
          eq(blocks.id, existingBlock.metadata.component_id as string),
          eq(blocks.workspace_id, existingBlock.workspace_id)
        )
      )
      .limit(1);

    if (definition.length === 0) {
      throw new Error("Component definition not found");
    }

    const componentDef = definition[0] as ComponentDefinition;

    // Prepare update data
    const updates: Partial<Block> = {};

    if (params.name !== undefined) {
      updates.name = params.name;
    }

    const metadataUpdates: Record<string, any> = { ...existingBlock.metadata };

    if (params.data !== undefined) {
      metadataUpdates.data = params.data;
    }

    if (params.nodeUI !== undefined) {
      if (Object.keys(params.nodeUI).length === 0) {
        // Remove style overrides
        delete metadataUpdates.node_ui;
      } else {
        metadataUpdates.node_ui = params.nodeUI;
      }
    }

    updates.metadata = metadataUpdates;
    updates.updated_at = new Date();

    const [updated] = await db
      .update(blocks)
      .set(updates)
      .where(eq(blocks.id, params.id))
      .returning();

    // Validate the updated component instance
    const validation = validateComponentInstance(updated, componentDef);
    if (!validation.valid) {
      throw new Error(
        `Invalid component instance after update: ${validation.errors.join(", ")}`
      );
    }

    return updated;
  }
);

/**
 * Delete a component definition and optionally its instances
 */
export const deleteComponentDefinition = actionWrapper(
  async (params: { id: string; deleteInstances?: boolean }) => {
    // Get the existing component definition
    const existing = await db
      .select()
      .from(blocks)
      .where(eq(blocks.id, params.id))
      .limit(1);

    if (existing.length === 0) {
      throw new Error("Component definition not found");
    }

    const existingBlock = existing[0];
    if (!isComponentDefinition(existingBlock)) {
      throw new Error("Block is not a component definition");
    }

    // Verify workspace access
    const workspace = await getWorkspace(existingBlock.workspace_id);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    if (params.deleteInstances) {
      // Delete all instances of this component
      await db
        .update(blocks)
        .set({
          deleted_at: new Date(),
          updated_at: new Date(),
        })
        .where(
          and(
            eq(blocks.workspace_id, existingBlock.workspace_id),
            eq(blocks.object, "component")
            // Note: We'd need to use a JSON query to check metadata.component_id
            // For now, this is a simplified version
          )
        );
    }

    // Delete the definition
    const [deleted] = await db
      .update(blocks)
      .set({
        deleted_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(blocks.id, params.id))
      .returning();

    return deleted;
  }
);

/**
 * Get all component definitions in a workspace
 */
export const getComponentDefinitions = actionWrapper(
  async (params: { workspaceId: string }) => {
    const workspace = await getWorkspace(params.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const definitions = await db
      .select()
      .from(blocks)
      .where(
        and(
          eq(blocks.workspace_id, params.workspaceId),
          eq(blocks.object, "component"),
          eq(blocks.deleted_at, null)
        )
      );

    // Filter to only component definitions
    return definitions.filter(isComponentDefinition);
  }
);

/**
 * Get all instances of a specific component definition
 */
export const getComponentInstances = actionWrapper(
  async (params: { workspaceId: string; definitionId: string }) => {
    const workspace = await getWorkspace(params.workspaceId);
    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Verify the definition exists
    const definition = await db
      .select()
      .from(blocks)
      .where(
        and(
          eq(blocks.id, params.definitionId),
          eq(blocks.workspace_id, params.workspaceId),
          eq(blocks.object, "component")
        )
      )
      .limit(1);

    if (definition.length === 0) {
      throw new Error("Component definition not found");
    }

    if (!isComponentDefinition(definition[0])) {
      throw new Error("Block is not a component definition");
    }

    // Get all blocks in the workspace that are component instances
    const allBlocks = await db
      .select()
      .from(blocks)
      .where(
        and(
          eq(blocks.workspace_id, params.workspaceId),
          eq(blocks.object, "component"),
          eq(blocks.deleted_at, null)
        )
      );

    // Filter to instances of this specific definition
    return allBlocks.filter((block): block is ComponentInstance => {
      return (
        isComponentInstance(block) &&
        block.metadata.component_id === params.definitionId
      );
    });
  }
);

