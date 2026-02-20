/**
 * readBlockLines Tool Service
 *
 * 특정 블록의 note_content를 라인 번호와 함께 조회. (DB: content_raw)
 */

import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import type { BlockSearchRepository } from '@/domains/ai-management/backend/repositories/interfaces/block-search.repository.interface';
import { formatContextContentWithLineNumbers } from '@/domains/ai-management/shared/format-context-content-with-lines';

// ─── Limits ───────────────────────────────────────────────────────────────

const MAX_LINES_PER_READ = 50;
const MAX_CHARS_PER_READ = 5000;

// ─── Types ────────────────────────────────────────────────────────────────

export type ReadBlockLinesIntermediate = { status: 'processing' };

export type ReadBlockLinesSource =
  | 'note_content'
  | 'source_content'
  | 'source_summary';

export type ReadBlockLinesFinal = {
  blockMountId: string;
  status: 'done' | 'error';
  totalLines: number;
  chars: number;
  /** Lines actually returned (1-based inclusive). For next chunk: startLine = actualEnd + 1 */
  actualStart?: number;
  actualEnd?: number;
  /** Block title for display (e.g. "[제목] Note") */
  title?: string;
  /** Source type for display: note_content→Note, source_summary→Summary, source_content→Raw Content */
  source?: ReadBlockLinesSource;
  /** Formatted content with line numbers (e.g. "   1| line1\n   2| line2"). Same format as context builder. */
  content?: string;
};

export type ReadBlockLinesYield = ReadBlockLinesIntermediate | ReadBlockLinesFinal;

export interface ReadBlockLinesArgs {
  blockMountId?: string;
  startLine?: number;
  endLine?: number;
  source?: ReadBlockLinesSource;
  summaryLanguage?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────

function buildErrorFinal(
  blockMountIdStr: string,
  title?: string,
  source?: ReadBlockLinesSource
): ReadBlockLinesFinal {
  return {
    blockMountId: blockMountIdStr,
    status: 'error',
    totalLines: 0,
    chars: 0,
    title,
    source,
    content: 'Error reading block',
  };
}

export async function* executeReadBlockLines(
  repository: BlockSearchRepository,
  args: ReadBlockLinesArgs,
  options?: { pageId?: string }
): AsyncGenerator<ReadBlockLinesYield, ReadBlockLinesFinal, void> {
  const blockMountIdStr = args?.blockMountId?.trim();
  const startLine = Math.max(1, args?.startLine ?? 1);
  const endLine = args?.endLine ?? undefined;
  const src: ReadBlockLinesSource = args?.source ?? 'note_content';

  if (!blockMountIdStr) {
    const err = buildErrorFinal('');
    yield err;
    return err;
  }

  const isSlug = (s: string) => s.length === 8 && /^[0-9a-f]+$/i.test(s);
  const isUuid = (s: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim());

  let pageIdVO: PageId | undefined;
  try {
    pageIdVO = options?.pageId?.trim() ? new PageId(options.pageId.trim()) : undefined;
  } catch {
    pageIdVO = undefined;
  }

  let blockMountIdVO: BlockMountId | null = null;
  let useSlugLookup = false;
  if (isSlug(blockMountIdStr) && pageIdVO) {
    useSlugLookup = true;
  } else if (isUuid(blockMountIdStr)) {
    try {
      blockMountIdVO = new BlockMountId(blockMountIdStr);
    } catch {
      const err = buildErrorFinal(blockMountIdStr);
      yield err;
      return err;
    }
  } else {
    const err = buildErrorFinal(blockMountIdStr);
    yield err;
    return err;
  }

  // slug인 경우 UUID로 변환 (source_content/source_summary용)
  if (useSlugLookup && pageIdVO && !blockMountIdVO) {
    const resolvedId = await repository.findBlockMountIdBySlugAndPageId(blockMountIdStr.toLowerCase(), pageIdVO);
    if (resolvedId) {
      try {
        blockMountIdVO = new BlockMountId(resolvedId);
      } catch {
        blockMountIdVO = null;
      }
    }
  }

  if (!blockMountIdVO) {
    const notFound = buildErrorFinal(blockMountIdStr);
    yield notFound;
    return notFound;
  }

  yield { status: 'processing' as const };

  try {
    if (src === 'note_content') {
      const row = await repository.findContentByBlockMountId(blockMountIdVO, pageIdVO);
      if (!row) {
        yield buildErrorFinal(blockMountIdStr);
        return buildErrorFinal(blockMountIdStr);
      }
      if (!row.contentRaw) {
        const final: ReadBlockLinesFinal = {
          blockMountId: blockMountIdStr,
          status: 'done',
          totalLines: 0,
          chars: 0,
          title: row.title,
          source: 'note_content',
          content: 'Empty block',
        };
        yield final;
        return final;
      }
      const { formatted, totalLines, actualStart, actualEnd } = formatContextContentWithLineNumbers(
        row.contentRaw,
        startLine,
        endLine,
        { maxLines: MAX_LINES_PER_READ, maxChars: MAX_CHARS_PER_READ }
      );
      const final: ReadBlockLinesFinal = {
        blockMountId: blockMountIdStr,
        status: 'done',
        totalLines,
        chars: formatted.length,
        actualStart,
        actualEnd,
        title: row.title,
        source: 'note_content',
        content: formatted,
      };
      yield final;
      return final;
    }

    if (src === 'source_content') {
      const row = await repository.findSourceContentByBlockMountId(blockMountIdVO, pageIdVO);
      if (!row) {
        const contentRow = await repository.findContentByBlockMountId(blockMountIdVO, pageIdVO);
        const notFound = buildErrorFinal(
          blockMountIdStr,
          contentRow?.title,
          'source_content'
        );
        yield notFound;
        return notFound;
      }
      const { formatted, totalLines, actualStart, actualEnd } = formatContextContentWithLineNumbers(
        row.rawContent,
        startLine,
        endLine,
        { maxLines: MAX_LINES_PER_READ, maxChars: MAX_CHARS_PER_READ }
      );
      const final: ReadBlockLinesFinal = {
        blockMountId: blockMountIdStr,
        status: 'done',
        totalLines,
        chars: formatted.length,
        actualStart,
        actualEnd,
        title: row.title,
        source: 'source_content',
        content: formatted,
      };
      yield final;
      return final;
    }

    const requestedLang = args?.summaryLanguage?.trim() || undefined;
    let row = await repository.findSourceSummaryByBlockMountId(
      blockMountIdVO,
      pageIdVO,
      requestedLang
    );
    if (!row && requestedLang && requestedLang.toLowerCase() !== 'en') {
      row = await repository.findSourceSummaryByBlockMountId(
        blockMountIdVO,
        pageIdVO,
        'en'
      );
    }
    if (!row) {
      const contentRow = await repository.findContentByBlockMountId(blockMountIdVO, pageIdVO);
      const notFound = buildErrorFinal(
        blockMountIdStr,
        contentRow?.title,
        'source_summary'
      );
      yield notFound;
      return notFound;
    }
    const { formatted, totalLines, actualStart, actualEnd } = formatContextContentWithLineNumbers(
      row.summary,
      startLine,
      endLine,
      { maxLines: MAX_LINES_PER_READ, maxChars: MAX_CHARS_PER_READ }
    );
    const final: ReadBlockLinesFinal = {
      blockMountId: blockMountIdStr,
      status: 'done',
      totalLines,
      chars: formatted.length,
      actualStart,
      actualEnd,
      title: row.title,
      source: 'source_summary',
      content: formatted,
    };
    yield final;
    return final;
  } catch (error) {
    console.error('[readBlockLines] Error:', error);
    const errResult = buildErrorFinal(blockMountIdStr);
    yield errResult;
    return errResult;
  }
}
