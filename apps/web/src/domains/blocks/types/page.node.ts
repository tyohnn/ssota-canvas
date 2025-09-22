import type { Block } from "@/db/schema";
import type { DefaultMetadata, FormSchema } from "@/domains/blocks/types";

// Page Block - represents a page in the canvas
export type PageBlockData = {
  description?: string;
  views: {
    default: string;
    definitions: Array<{
      id: string;
      name: string;
      type: string;
      componentFilter?: string;
      config?: Record<string, unknown>;
    }>;
  };
  allowed_component_ids: string[];
  allowed_edge_types: string[];
};

export type PageBlockMetadata = DefaultMetadata & {
  pageData: PageBlockData;
};

export type PageBlock = Block & {
  object: "page";
  metadata: PageBlockMetadata;
};

// Type guard
export function isPageBlock(block: Block): block is PageBlock {
  return block.object === "page"
}
