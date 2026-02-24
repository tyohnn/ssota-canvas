/**
 * searchBySemantic Tool Service
 *
 * Find blocks by semantic similarity to a query.
 * MVP: stub response. Full embedding-based search is planned.
 */

export interface SearchBySemanticEntry {
  blockMountId: string;
  blockType?: string;
  title?: string;
  score?: number;
}

export interface SearchBySemanticFinal {
  blockMountIds: string[];
  blocks: SearchBySemanticEntry[];
  message: string;
}

export interface SearchBySemanticArgs {
  query?: string;
  topK?: number;
  blockTypes?: string[];
  pageId?: string;
}

export async function executeSearchBySemantic(
  _args: SearchBySemanticArgs,
  _options?: { pageId?: string }
): Promise<SearchBySemanticFinal> {
  return {
    blockMountIds: [],
    blocks: [],
    message:
      'Semantic search is not yet implemented (MVP). Use grepBlockContent or globBlocks for now.',
  };
}
