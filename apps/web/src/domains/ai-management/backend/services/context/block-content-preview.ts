import type { BlockSearchRepository } from '@/domains/ai-management/backend/repositories/interfaces/block-search.repository.interface';
import type { BlockMountRepository } from '@/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

/** Per-block content preview for agent context. Only content_raw and summary (no source_content). */
export interface BlockContentPreview {
  contentRaw?: string;
  summary?: string;
}

export interface BlockMetaRef {
  blockMountId: string;
}

export interface BlockContentPreviewInput {
  pageId?: string;
  selectedBlocks: BlockMetaRef[];
  /** Visible blocks in nearness order; first 5 (excluding selected) get content. */
  visibleBlocks: BlockMetaRef[];
}

export interface BlockContentPreviewDeps {
  blockSearchRepository: BlockSearchRepository;
  /** Required when client sends blockMountId as 8-char slug (page-scoped); used to resolve slug → UUID. */
  blockMountRepository: BlockMountRepository;
}

const SELECTED_MAX_LINES = 20;
const SELECTED_MAX_CHARS = 2_500;
const VISIBLE_MAX_CHARS = 500;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** 8-char hex slug (client/events often send this instead of full UUID) */
function isSlug(id: string): boolean {
  return id.length === 8 && /^[0-9a-f]+$/i.test(id);
}

/**
 * Truncate text for preview: first maxLines lines, then slice to maxChars.
 */
export function truncateTextForPreview(
  text: string,
  maxLines: number,
  maxChars: number
): string {
  if (!text || maxLines <= 0 || maxChars <= 0) return '';
  const lines = text.split('\n').slice(0, maxLines);
  const joined = lines.join('\n');
  if (joined.length <= maxChars) return joined;
  return joined.slice(0, maxChars) + (joined.length > maxChars ? '…' : '');
}

/**
 * Fetches content_raw and (for source blocks) source_summary for selected and nearest visible blocks.
 * Selected: 20 lines + 2,500 chars each for content_raw and summary.
 * Visible (first 5 not in selected): 500 chars each; no source_content.
 * Overlap: blocks that are both selected and visible get content only once (selected limits).
 */
export async function getBlockContentPreviews(
  deps: BlockContentPreviewDeps,
  input: BlockContentPreviewInput
): Promise<Record<string, BlockContentPreview>> {
  const { blockSearchRepository, blockMountRepository } = deps;
  const { pageId, selectedBlocks, visibleBlocks } = input;
  const pageIdVo = pageId ? new PageId(pageId) : undefined;
  const selectedSet = new Set(selectedBlocks.map(b => b.blockMountId));
  const result: Record<string, BlockContentPreview> = {};

  /** Resolve client id (UUID or 8-char slug) to BlockMountId. Returns null if unresolvable. */
  const resolveMountId = async (
    blockMountIdStr: string
  ): Promise<BlockMountId | null> => {
    if (UUID_REGEX.test(blockMountIdStr.trim())) {
      try {
        return new BlockMountId(blockMountIdStr);
      } catch {
        return null;
      }
    }
    if (isSlug(blockMountIdStr) && pageIdVo) {
      const aggregate = await blockMountRepository.findByPageIdAndSlug(
        pageIdVo,
        blockMountIdStr.toLowerCase()
      );
      return aggregate?.getBlockMount().id ?? null;
    }
    return null;
  };

  const addPreview = async (
    blockMountIdStr: string,
    isSelected: boolean
  ): Promise<void> => {
    const maxLines = isSelected ? SELECTED_MAX_LINES : 0;
    const maxChars = isSelected ? SELECTED_MAX_CHARS : VISIBLE_MAX_CHARS;
    let contentRaw: string | undefined;
    let summary: string | undefined;
    const mountId = await resolveMountId(blockMountIdStr);
    if (!mountId) return;
    try {
      const [contentRow, summaryRow] = await Promise.all([
        blockSearchRepository.findContentByBlockMountId(mountId, pageIdVo),
        blockSearchRepository.findSourceSummaryByBlockMountId(mountId, pageIdVo),
      ]);
      if (contentRow?.contentRaw != null && contentRow.contentRaw !== '') {
        contentRaw =
          maxLines > 0
            ? truncateTextForPreview(contentRow.contentRaw, maxLines, maxChars)
            : truncateTextForPreview(contentRow.contentRaw, 999, maxChars);
      }
      if (summaryRow?.summary != null && summaryRow.summary !== '') {
        summary =
          maxLines > 0
            ? truncateTextForPreview(summaryRow.summary, maxLines, maxChars)
            : truncateTextForPreview(summaryRow.summary, 999, maxChars);
      }
    } catch {
      // skip block on repo error
    }
    if (contentRaw !== undefined || summary !== undefined) {
      result[blockMountIdStr] = { contentRaw, summary };
    }
  };

  for (const b of selectedBlocks) {
    await addPreview(b.blockMountId, true);
  }

  let visibleWithContent = 0;
  for (const b of visibleBlocks) {
    if (selectedSet.has(b.blockMountId)) continue;
    if (visibleWithContent >= 5) break;
    await addPreview(b.blockMountId, false);
    visibleWithContent += 1;
  }

  return result;
}
