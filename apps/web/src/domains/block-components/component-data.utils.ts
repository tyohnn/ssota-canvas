import type { Block } from "@/db/schema";
import type { FormSchema } from "@/domains/blocks/types/common.node";
import type { ComponentInstance, ComponentDefinition, ComponentMetadata } from '@/domains/block-components/types';


/**
 * Extract component definitions from blocks
 */
export function extractComponentDefinitions(
  blocks: Block[]
): ComponentDefinition[] {
  return blocks.filter(block => 
    block.object === "component" && 
    (block.metadata as ComponentMetadata)?.role === "definition"
  );
}