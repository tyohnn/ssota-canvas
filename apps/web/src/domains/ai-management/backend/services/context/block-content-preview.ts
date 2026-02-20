import type { BlockSearchRepository } from '@/domains/ai-management/backend/repositories/interfaces/block-search.repository.interface';
import type { BlockMountRepository } from '@/domains/canvas-management/backend/repositories/interfaces/block-mount.repository.interface';
import { formatContextContentWithLineNumbers } from '@/domains/ai-management/shared/format-context-content-with-lines';
import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';

/** Per-block content preview for agent context. note_content, summary, and line counts. */
export interface BlockContentPreview {
  noteContent?: string;
  summary?: string;
  /** Line count of note_content (0 when empty). Enables AI to skip read when 0. */
  noteContentLines?: number;
  /** Lines actually included in note_content preview (for "L1-N of M" display). */
  noteContentLinesIncluded?: number;
  /** Line count of source_summary (total). */
  summaryLines?: number;
  /** Lines actually included in summary preview (for "lines 1-N of M" display). */
  summaryLinesIncluded?: number;
  /** Line count of source raw_content. */
  sourceContentLines?: number;
}

export interface BlockMetaRef {
  blockMountId: string;
}

export interface BlockContentPreviewLimits {
  selected: { maxLines: number; maxChars: number };
  visible: { maxChars: number };
}

export interface BlockContentPreviewInput {
  pageId?: string;
  selectedBlocks: BlockMetaRef[];
  /** Visible blocks in nearness order; first 5 (excluding selected) get content. */
  visibleBlocks: BlockMetaRef[];
  /** Limits for note_content formatting. Required. */
  noteContentLimits: BlockContentPreviewLimits;
}

export interface BlockContentPreviewDeps {
  blockSearchRepository: BlockSearchRepository;
  /** Required when client sends blockMountId as 8-char slug (page-scoped); used to resolve slug → UUID. */
  blockMountRepository: BlockMountRepository;
}

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
 * Fetches note_content and (for source blocks) source_summary for selected and nearest visible blocks.
 * Selected: 20 lines + 2,500 chars each for note_content and summary.
 * Visible (first 5 not in selected): 2,000 chars each; no source_content.
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

  const { noteContentLimits } = input;

  const addPreview = async (
    blockMountIdStr: string,
    isSelected: boolean
  ): Promise<void> => {
    const noteContentOpts = isSelected
      ? { maxLines: noteContentLimits.selected.maxLines, maxChars: noteContentLimits.selected.maxChars }
      : { maxLines: 999, maxChars: noteContentLimits.visible.maxChars };
    let noteContent: string | undefined;
    let summary: string | undefined;
    let noteContentLines = 0;
    let noteContentLinesIncluded: number | undefined;
    let summaryLines = 0;
    let summaryLinesIncluded: number | undefined;
    let sourceContentLines = 0;
    const mountId = await resolveMountId(blockMountIdStr);
    if (!mountId) return;
    try {
      const [contentRow, summaryRow, sourceContentRow] = await Promise.all([
        blockSearchRepository.findContentByBlockMountId(mountId, pageIdVo),
        blockSearchRepository.findSourceSummaryByBlockMountId(mountId, pageIdVo),
        blockSearchRepository.findSourceContentByBlockMountId(mountId, pageIdVo),
      ]);
      if (contentRow?.contentRaw != null && contentRow.contentRaw !== '') {
        noteContentLines = contentRow.contentRaw.split('\n').length;
        const { formatted, actualEnd, totalLines } = formatContextContentWithLineNumbers(
          contentRow.contentRaw,
          1,
          undefined,
          noteContentOpts
        );
        noteContentLinesIncluded = actualEnd;
        noteContent =
          actualEnd < totalLines
            ? `${formatted}\n  (... L1-${actualEnd} of ${totalLines})`
            : formatted;
      }
      if (summaryRow?.summary != null && summaryRow.summary !== '') {
        summaryLines = summaryRow.summary.split('\n').length;
        // Selected blocks: always include full summary; visible: truncated. Both use line-number format (1| xxx).
        const summaryOpts = isSelected
          ? { maxLines: 99_999, maxChars: 999_999 }
          : { maxLines: 999, maxChars: noteContentLimits.visible.maxChars };
        const { formatted: summaryFormatted, actualEnd: summaryEnd } = formatContextContentWithLineNumbers(
          summaryRow.summary,
          1,
          undefined,
          summaryOpts
        );
        summaryLinesIncluded = summaryEnd;
        summary =
          summaryEnd < summaryLines
            ? `${summaryFormatted}\n  (... L1-${summaryEnd} of ${summaryLines})`
            : summaryFormatted;
      }
      if (sourceContentRow?.rawContent != null && sourceContentRow.rawContent !== '') {
        sourceContentLines = sourceContentRow.rawContent.split('\n').length;
      }
    } catch {
      // skip block on repo error
    }
    // Include block when we have content or line counts (even all zeros, so AI can skip read for empty note_content)
    const hasContent = noteContent !== undefined || summary !== undefined;
    const hasLineInfo =
      noteContentLines !== undefined ||
      summaryLines !== undefined ||
      sourceContentLines !== undefined;
    if (hasContent || hasLineInfo) {
      result[blockMountIdStr] = {
        noteContent,
        summary,
        noteContentLines,
        noteContentLinesIncluded,
        summaryLines,
        summaryLinesIncluded,
        sourceContentLines,
      };
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
