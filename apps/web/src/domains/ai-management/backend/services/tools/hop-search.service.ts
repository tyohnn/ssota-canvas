/**
 * hopSearch Tool Service
 *
 * Find blocks N-hops away from a starting block via edges.
 * Uses EdgeRepository for BFS. Returns edge label and style per connection.
 */

import type { ConnectionSearchRepository } from '@/domains/ai-management/backend/repositories/interfaces/connection-search.repository.interface';
import type { EdgeAggregate } from '@/domains/canvas-management/shared/aggregates/edge.aggregate';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

/** Edge label + style (stroke, strokeWidth) for a connection in hop result */
export interface HopSearchEdgeInfo {
  label: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface HopSearchEntry {
  blockMountId: string;
  hop: number;
  /** Edges that connect from the previous hop to this block (label + style) */
  edges: HopSearchEdgeInfo[];
  blockType?: string;
  title?: string;
}

export interface HopSearchFinal {
  blockMountIds: string[];
  byHop: HopSearchEntry[];
  message: string;
}

export interface HopSearchArgs {
  startBlockMountId?: string;
  hops?: number;
  direction?: 'out' | 'in' | 'both';
  pageId?: string;
}

function getNeighborsWithEdges(
  edges: EdgeAggregate[],
  fromBlockMountId: string,
  direction: 'out' | 'in' | 'both'
): Array<{ neighborId: string; label: string; stroke: string; strokeWidth: number }> {
  const result: Array<{ neighborId: string; label: string; stroke: string; strokeWidth: number }> = [];
  const style = (agg: EdgeAggregate) => agg.edge.edgeStyle.toReactFlowStyle();
  for (const agg of edges) {
    const src = agg.edge.sourceBlockMountId.value;
    const tgt = agg.edge.targetBlockMountId.value;
    const s = style(agg);
    if (direction === 'out' && src === fromBlockMountId) {
      result.push({ neighborId: tgt, label: agg.edge.edgeLabel, stroke: s.stroke, strokeWidth: s.strokeWidth });
    } else if (direction === 'in' && tgt === fromBlockMountId) {
      result.push({ neighborId: src, label: agg.edge.edgeLabel, stroke: s.stroke, strokeWidth: s.strokeWidth });
    } else if (direction === 'both') {
      if (src === fromBlockMountId) result.push({ neighborId: tgt, label: agg.edge.edgeLabel, stroke: s.stroke, strokeWidth: s.strokeWidth });
      else if (tgt === fromBlockMountId) result.push({ neighborId: src, label: agg.edge.edgeLabel, stroke: s.stroke, strokeWidth: s.strokeWidth });
    }
  }
  return result;
}

export async function executeHopSearch(
  connectionSearchRepository: ConnectionSearchRepository,
  args: HopSearchArgs,
  options?: { pageId?: string }
): Promise<HopSearchFinal> {
  const startIdStr = args?.startBlockMountId?.trim();
  const pageIdStr = args?.pageId ?? options?.pageId;
  const hops = Math.min(3, Math.max(1, args?.hops ?? 1));
  const direction = args?.direction ?? 'out';

  if (!startIdStr) {
    return { blockMountIds: [], byHop: [], message: 'startBlockMountId is required' };
  }

  let startId: BlockMountId;
  let pageIdVO: PageId | undefined;
  try {
    startId = new BlockMountId(startIdStr);
  } catch {
    return { blockMountIds: [], byHop: [], message: 'Invalid startBlockMountId' };
  }
  if (pageIdStr?.trim()) {
    try {
      pageIdVO = new PageId(pageIdStr.trim());
    } catch {
      pageIdVO = undefined;
    }
  }

  const byHop: HopSearchEntry[] = [];
  const allIds = new Set<string>();
  let currentLevel = new Set<string>([startIdStr]);

  for (let hop = 1; hop <= hops; hop++) {
    const nextLevel = new Set<string>();
    const entriesThisHop = new Map<string, HopSearchEntry>();

    for (const bid of currentLevel) {
      try {
        const blockMountIdVO = new BlockMountId(bid);
        const edges =
          pageIdVO != null
            ? await connectionSearchRepository.findEdgesByConnectedBlockMountIdAndPageId(blockMountIdVO, pageIdVO)
            : await connectionSearchRepository.findEdgesByConnectedBlockMountId(blockMountIdVO);

        const neighbors = getNeighborsWithEdges(edges, bid, direction);
        for (const { neighborId, label, stroke, strokeWidth } of neighbors) {
          if (!allIds.has(neighborId)) {
            allIds.add(neighborId);
            nextLevel.add(neighborId);
            const edgeInfo: HopSearchEdgeInfo = { label, stroke, strokeWidth };
            const existing = entriesThisHop.get(neighborId);
            if (existing) {
              existing.edges.push(edgeInfo);
            } else {
              entriesThisHop.set(neighborId, {
                blockMountId: neighborId,
                hop,
                edges: [edgeInfo],
              });
            }
          }
        }
      } catch {
        // skip invalid id
      }
    }

    byHop.push(...entriesThisHop.values());
    currentLevel = nextLevel;
  }

  const blockMountIds = Array.from(allIds);

  return {
    blockMountIds,
    byHop,
    message: `Found ${blockMountIds.length} block(s) within ${hops} hop(s)`,
  };
}
