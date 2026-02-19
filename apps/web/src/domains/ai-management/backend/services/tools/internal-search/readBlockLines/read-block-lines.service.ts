/**
 * readBlockLines Tool Service
 *
 * 특정 블록의 content_raw를 라인 번호와 함께 조회.
 */

import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import type { BlockSearchRepository } from '@/domains/ai-management/backend/repositories/interfaces/block-search.repository.interface';

// ─── Types ────────────────────────────────────────────────────────────────

export type ReadBlockLinesIntermediate = { message?: string; step?: string };

export type ReadBlockLinesSource =
  | 'content_raw'
  | 'source_content'
  | 'source_summary';

export type ReadBlockLinesFinal = {
  blockMountId: string;
  blockType: string;
  title: string;
  content: string;
  totalLines: number;
  requestedRange: { start: number; end: number };
  actualRange: { start: number; end: number };
  source?: ReadBlockLinesSource;
  summaryLanguage?: string;
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

function formatLineRange(
  text: string,
  startLine: number,
  endLine: number | undefined
): {
  formatted: string;
  totalLines: number;
  actualStart: number;
  actualEnd: number;
} {
  const lines = text.split('\n');
  const totalLines = lines.length;
  const actualStart = Math.min(startLine, totalLines);
  const actualEnd = endLine ? Math.min(endLine, totalLines) : totalLines;
  const sliced = lines.slice(actualStart - 1, actualEnd);
  const formatted = sliced
    .map((line, idx) => `${String(actualStart + idx).padStart(4)}| ${line}`)
    .join('\n');
  return { formatted, totalLines, actualStart, actualEnd };
}

function buildErrorFinal(
  blockMountIdStr: string,
  blockType: string,
  title: string,
  startLine: number,
  endLine: number,
  source?: ReadBlockLinesSource
): ReadBlockLinesFinal {
  return {
    blockMountId: blockMountIdStr,
    blockType,
    title,
    content: '',
    totalLines: 0,
    requestedRange: { start: startLine, end: endLine },
    actualRange: { start: 0, end: 0 },
    ...(source && { source }),
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
  const src: ReadBlockLinesSource = args?.source ?? 'content_raw';

  if (!blockMountIdStr) {
    const err = buildErrorFinal('', 'unknown', 'blockMountId is required', startLine, endLine ?? 0);
    yield err;
    return err;
  }

  let blockMountIdVO: BlockMountId;
  try {
    blockMountIdVO = new BlockMountId(blockMountIdStr);
  } catch {
    const err = buildErrorFinal(blockMountIdStr, 'unknown', 'Invalid blockMountId format', startLine, endLine ?? 0);
    yield err;
    return err;
  }

  let pageIdVO: PageId | undefined;
  try {
    pageIdVO = options?.pageId?.trim() ? new PageId(options.pageId.trim()) : undefined;
  } catch {
    pageIdVO = undefined;
  }

  yield { message: 'Reading block content...' };

  try {
    if (src === 'content_raw') {
      const row = await repository.findContentByBlockMountId(blockMountIdVO, pageIdVO);
      if (!row) {
        const notFound = buildErrorFinal(blockMountIdStr, 'unknown', 'Block not found', startLine, endLine ?? 0, src);
        yield notFound;
        return notFound;
      }
      if (!row.contentRaw) {
        const noContent = buildErrorFinal(blockMountIdStr, row.blockType, row.title, startLine, endLine ?? 0, src);
        noContent.content = '(no text content)';
        yield noContent;
        return noContent;
      }
      const { formatted, totalLines, actualStart, actualEnd } = formatLineRange(row.contentRaw, startLine, endLine);
      const final: ReadBlockLinesFinal = {
        blockMountId: blockMountIdStr,
        blockType: row.blockType,
        title: row.title,
        content: formatted,
        totalLines,
        requestedRange: { start: startLine, end: endLine ?? totalLines },
        actualRange: { start: actualStart, end: actualEnd },
        source: src,
      };
      yield final;
      return final;
    }

    if (src === 'source_content') {
      const row = await repository.findSourceContentByBlockMountId(blockMountIdVO, pageIdVO);
      if (!row) {
        const notFound = buildErrorFinal(
          blockMountIdStr,
          'unknown',
          'Block not found or no source content',
          startLine,
          endLine ?? 0,
          src
        );
        yield notFound;
        return notFound;
      }
      const { formatted, totalLines, actualStart, actualEnd } = formatLineRange(row.rawContent, startLine, endLine);
      const final: ReadBlockLinesFinal = {
        blockMountId: blockMountIdStr,
        blockType: row.blockType,
        title: row.title,
        content: formatted,
        totalLines,
        requestedRange: { start: startLine, end: endLine ?? totalLines },
        actualRange: { start: actualStart, end: actualEnd },
        source: src,
      };
      yield final;
      return final;
    }

    const row = await repository.findSourceSummaryByBlockMountId(
      blockMountIdVO,
      pageIdVO,
      args?.summaryLanguage?.trim() || undefined
    );
    if (!row) {
      const notFound = buildErrorFinal(
        blockMountIdStr,
        'unknown',
        'Block not found or no source summary (try summaryLanguage?)',
        startLine,
        endLine ?? 0,
        src
      );
      yield notFound;
      return notFound;
    }
    const { formatted, totalLines, actualStart, actualEnd } = formatLineRange(row.summary, startLine, endLine);
    const final: ReadBlockLinesFinal = {
      blockMountId: blockMountIdStr,
      blockType: row.blockType,
      title: row.title,
      content: formatted,
      totalLines,
      requestedRange: { start: startLine, end: endLine ?? totalLines },
      actualRange: { start: actualStart, end: actualEnd },
      source: src,
      summaryLanguage: row.language,
    };
    yield final;
    return final;
  } catch (error) {
    console.error('[readBlockLines] Error:', error);
    const errResult = buildErrorFinal(blockMountIdStr, 'unknown', 'Error reading block', startLine, endLine ?? 0, src);
    yield errResult;
    return errResult;
  }
}
