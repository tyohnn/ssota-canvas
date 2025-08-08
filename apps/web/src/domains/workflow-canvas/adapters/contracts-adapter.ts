import { Block as DbBlock, Edge as DbEdge } from "@/db/schema";
import {
  BlockRecord,
  EdgeRecord,
  BlockRegistry,
  BlockMetadata,
  EdgeType,
} from "../contracts";

export function toBlockRecord(block: DbBlock): BlockRecord {
  return {
    id: block.id,
    block_type: block.block_type as BlockRecord["block_type"],
    slug: block.slug,
    name: block.name,
    metadata: block.metadata as unknown as BlockMetadata,
  };
}

export function toEdgeRecord(edge: DbEdge): EdgeRecord {
  return {
    id: edge.id,
    edge_type: edge.edge_type as EdgeType,
    source_block_id: edge.source_block_id,
    target_block_id: edge.target_block_id,
    metadata: edge.metadata as unknown as Record<string, unknown> | undefined,
  };
}

export function toRegistry(
  workspace: { id?: string; name?: string } | undefined,
  blocks: DbBlock[],
  edges: DbEdge[]
): BlockRegistry {
  return {
    version: "1",
    workspace,
    blocks: blocks.map(toBlockRecord),
    edges: edges.map(toEdgeRecord),
  };
}
