/**
 * grepBlockContent Tool Service
 *
 * 블록 note_content에서 패턴 검색. (DB: content_raw) DB 레벨 ILIKE 필터링 후 서버 사이드 라인 파싱.
 */

import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import type { BlockSearchRepository, BlockSearchScope } from '@/domains/ai-management/backend/repositories/interfaces/block-search.repository.interface';

// ─── Types ────────────────────────────────────────────────────────────────

export type GrepMatchSource = 'note_content' | 'source_content' | 'source_summary';

export interface GrepMatch {
  lineNumber: number;
  content: string;
  context: string;
  source?: GrepMatchSource;
}

export interface GrepBlockResult {
  blockMountId: string;
  blockType: string;
  title: string;
  matches: GrepMatch[];
}

export type GrepBlockContentIntermediate = {
  message?: string;
  step?: string;
};

export type GrepBlockContentFinal = {
  matches: GrepBlockResult[];
  totalMatches: number;
  searchedBlocks: number;
};

export type GrepBlockContentYield = GrepBlockContentIntermediate | GrepBlockContentFinal;

export interface GrepBlockContentArgs {
  patterns?: string[];
  matchMode?: 'any' | 'all';
  invert?: boolean;
  summaryLanguages?: string[];
  targetBlockMountIds?: string[];
  blockTypes?: string[];
  contextLines?: number;
  pageId?: string;
  workspaceId?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────

function buildScopeFromArgs(
  args: GrepBlockContentArgs,
  options?: { pageId?: string }
): BlockSearchScope | null {
  const pageIdStr = args?.pageId ?? options?.pageId;
  const workspaceIdStr = args?.workspaceId;
  const targetIds = args?.targetBlockMountIds;

  try {
    const targetBlockMountIds =
      targetIds?.length && targetIds.every(id => id && id.trim())
        ? targetIds.map(id => new BlockMountId(id.trim()))
        : undefined;

    const pageId =
      pageIdStr && pageIdStr.trim() ? new PageId(pageIdStr.trim()) : undefined;
    const workspaceId =
      workspaceIdStr && workspaceIdStr.trim()
        ? new WorkspaceId(workspaceIdStr.trim())
        : undefined;

    if (!targetBlockMountIds?.length && !pageId && !workspaceId) {
      return null;
    }

    return {
      targetBlockMountIds,
      pageId,
      workspaceId,
      blockTypes: args?.blockTypes?.length ? args.blockTypes : undefined,
    };
  } catch {
    return null;
  }
}

export async function* executeGrepBlockContent(
  repository: BlockSearchRepository,
  args: GrepBlockContentArgs,
  options?: { pageId?: string }
): AsyncGenerator<GrepBlockContentYield, GrepBlockContentFinal, void> {
  const contextLines = 5;
  const matchMode = args?.matchMode === 'all' ? 'all' : 'any';
  const invert = Boolean(args?.invert);

  const patterns: string[] = Array.isArray(args?.patterns)
    ? args.patterns.map(p => (typeof p === 'string' && p.trim() ? p.trim() : '')).filter(Boolean)
    : [];

  if (patterns.length === 0) {
    const empty: GrepBlockContentFinal = { matches: [], totalMatches: 0, searchedBlocks: 0 };
    yield empty;
    return empty;
  }

  const scope = buildScopeFromArgs(args, options);
  if (!scope) {
    const noScope: GrepBlockContentFinal = { matches: [], totalMatches: 0, searchedBlocks: 0 };
    yield noScope;
    return noScope;
  }

  const sourceList: GrepMatchSource[] = ['note_content', 'source_content', 'source_summary'];

  yield { message: 'Searching block content...' };

  const regexes = patterns.map(p => new RegExp(escapeRegex(p), 'gi'));
  const lineMatches = (line: string): boolean => {
    if (matchMode === 'any') {
      for (const re of regexes) {
        re.lastIndex = 0;
        if (re.test(line)) return true;
      }
      return false;
    }
    for (const re of regexes) {
      re.lastIndex = 0;
      if (!re.test(line)) return false;
    }
    return true;
  };

  function buildMatchesFromLines(lines: string[], source: GrepMatchSource): GrepMatch[] {
    const blockMatches: GrepMatch[] = [];
    for (let i = 0; i < lines.length; i++) {
      const matches = lineMatches(lines[i]!);
      if (invert ? !matches : matches) {
        const ctxStart = Math.max(0, i - contextLines);
        const ctxEnd = Math.min(lines.length - 1, i + contextLines);
        const context = lines
          .slice(ctxStart, ctxEnd + 1)
          .map((line, idx) => {
            const lineNum = ctxStart + idx + 1;
            const marker = lineNum === i + 1 ? '>' : ' ';
            return `${marker} ${String(lineNum).padStart(4)}| ${line}`;
          })
          .join('\n');
        blockMatches.push({
          lineNumber: i + 1,
          content: lines[i]!.trim(),
          context,
          source,
        });
      }
    }
    return blockMatches;
  }

  const byBlock = new Map<string, GrepBlockResult>();

  function addToMap(blockMountId: string, blockType: string, title: string, matches: GrepMatch[]): void {
    if (matches.length === 0) return;
    const existing = byBlock.get(blockMountId);
    if (existing) {
      existing.matches.push(...matches);
    } else {
      byBlock.set(blockMountId, { blockMountId, blockType, title, matches });
    }
  }

  try {
    if (sourceList.includes('note_content')) {
      const rows = await repository.findByContentPattern(patterns, scope);
      for (const row of rows) {
        if (!row.contentRaw) continue;
        const lines = row.contentRaw.split('\n');
        const blockMatches = buildMatchesFromLines(lines, 'note_content');
        addToMap(row.blockMountId, row.blockType, row.title, blockMatches);
      }
    }

    if (sourceList.includes('source_content')) {
      try {
        const rows = await repository.findBySourceContentPattern(patterns, scope);
        for (const row of rows) {
          const lines = row.rawContent.split('\n');
          const blockMatches = buildMatchesFromLines(lines, 'source_content');
          addToMap(row.blockMountId, row.blockType, row.title, blockMatches);
        }
      } catch (e) {
        console.warn('[grepBlockContent] source_content search failed:', e);
      }
    }

    if (sourceList.includes('source_summary')) {
      try {
        const rows = await repository.findBySourceSummaryPattern(
          patterns,
          scope,
          args.summaryLanguages?.length ? args.summaryLanguages : undefined
        );
        for (const row of rows) {
          const lines = row.summary.split('\n');
          const blockMatches = buildMatchesFromLines(lines, 'source_summary');
          addToMap(row.blockMountId, row.blockType, row.title, blockMatches);
        }
      } catch (e) {
        console.warn('[grepBlockContent] source_summary search failed:', e);
      }
    }

    const results = Array.from(byBlock.values());
    const totalMatches = results.reduce((s, r) => s + r.matches.length, 0);
    const final: GrepBlockContentFinal = {
      matches: results,
      totalMatches,
      searchedBlocks: results.length,
    };
    yield final;
    return final;
  } catch (error) {
    console.error('[grepBlockContent] Error:', error);
    const errResult: GrepBlockContentFinal = { matches: [], totalMatches: 0, searchedBlocks: 0 };
    yield errResult;
    return errResult;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
