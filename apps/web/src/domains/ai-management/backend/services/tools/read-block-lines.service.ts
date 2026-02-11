/**
 * readBlockLines Tool Service
 *
 * 특정 블록의 content_raw를 라인 번호와 함께 조회.
 * Architecture: Repository에서 단일 블록 content_raw 조회 → Service에서 라인 범위 추출 + 포맷팅.
 * 패턴: SafeDTO(문자열) → Service에서 VO 변환 → Repository에 BlockMountId, PageId(VO) 전달.
 */

import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import type { BlockSearchRepository } from '../../repositories/interfaces/block-search.repository.interface';

// ─── Types ────────────────────────────────────────────────────────────────

export type ReadBlockLinesIntermediate = {
  message?: string;
  step?: string;
};

export type ReadBlockLinesFinal = {
  blockMountId: string;
  blockType: string;
  title: string;
  content: string;
  totalLines: number;
  requestedRange: { start: number; end: number };
  actualRange: { start: number; end: number };
};

export type ReadBlockLinesYield = ReadBlockLinesIntermediate | ReadBlockLinesFinal;

// ─── Args (SafeDTO from tool call) ────────────────────────────────────────

export interface ReadBlockLinesArgs {
  blockMountId?: string;
  startLine?: number;
  endLine?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────

export async function* executeReadBlockLines(
  repository: BlockSearchRepository,
  args: ReadBlockLinesArgs,
  options?: { pageId?: string }
): AsyncGenerator<ReadBlockLinesYield, ReadBlockLinesFinal, void> {
  const blockMountIdStr = args?.blockMountId?.trim();
  const startLine = Math.max(1, args?.startLine ?? 1);
  const endLine = args?.endLine ?? undefined;

  if (!blockMountIdStr) {
    const err: ReadBlockLinesFinal = {
      blockMountId: '',
      blockType: 'unknown',
      title: 'blockMountId is required',
      content: '',
      totalLines: 0,
      requestedRange: { start: startLine, end: endLine ?? 0 },
      actualRange: { start: 0, end: 0 },
    };
    yield err;
    return err;
  }

  let blockMountIdVO: BlockMountId;
  try {
    blockMountIdVO = new BlockMountId(blockMountIdStr);
  } catch {
    const err: ReadBlockLinesFinal = {
      blockMountId: blockMountIdStr,
      blockType: 'unknown',
      title: 'Invalid blockMountId format',
      content: '',
      totalLines: 0,
      requestedRange: { start: startLine, end: endLine ?? 0 },
      actualRange: { start: 0, end: 0 },
    };
    yield err;
    return err;
  }

  let pageIdVO: PageId | undefined;
  try {
    pageIdVO =
      options?.pageId && options.pageId.trim()
        ? new PageId(options.pageId.trim())
        : undefined;
  } catch {
    pageIdVO = undefined;
  }

  yield { message: 'Reading block content...' };

  try {
    const row = await repository.findContentByBlockMountId(
      blockMountIdVO,
      pageIdVO
    );

    if (!row) {
      const notFound: ReadBlockLinesFinal = {
        blockMountId: blockMountIdStr,
        blockType: 'unknown',
        title: 'Block not found',
        content: '',
        totalLines: 0,
        requestedRange: { start: startLine, end: endLine ?? 0 },
        actualRange: { start: 0, end: 0 },
      };
      yield notFound;
      return notFound;
    }

    if (!row.contentRaw) {
      const noContent: ReadBlockLinesFinal = {
        blockMountId: blockMountIdStr,
        blockType: row.blockType,
        title: row.title,
        content: '(no text content)',
        totalLines: 0,
        requestedRange: { start: startLine, end: endLine ?? 0 },
        actualRange: { start: 0, end: 0 },
      };
      yield noContent;
      return noContent;
    }

    const lines = row.contentRaw.split('\n');
    const totalLines = lines.length;
    const actualStart = Math.min(startLine, totalLines);
    const actualEnd = endLine ? Math.min(endLine, totalLines) : totalLines;

    const sliced = lines.slice(actualStart - 1, actualEnd);
    const formatted = sliced
      .map((line, idx) => {
        const num = actualStart + idx;
        return `${String(num).padStart(4)}| ${line}`;
      })
      .join('\n');

    const final: ReadBlockLinesFinal = {
      blockMountId: blockMountIdStr,
      blockType: row.blockType,
      title: row.title,
      content: formatted,
      totalLines,
      requestedRange: { start: startLine, end: endLine ?? totalLines },
      actualRange: { start: actualStart, end: actualEnd },
    };
    yield final;
    return final;
  } catch (error) {
    console.error('[readBlockLines] Error:', error);
    const errResult: ReadBlockLinesFinal = {
      blockMountId: blockMountIdStr,
      blockType: 'unknown',
      title: 'Error reading block',
      content: '',
      totalLines: 0,
      requestedRange: { start: startLine, end: endLine ?? 0 },
      actualRange: { start: 0, end: 0 },
    };
    yield errResult;
    return errResult;
  }
}
