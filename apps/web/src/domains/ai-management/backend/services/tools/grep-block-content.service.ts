/**
 * grepBlockContent Tool Service
 *
 * 블록 content_raw에서 패턴 검색. DB 레벨 ILIKE 필터링 후 서버 사이드 라인 파싱.
 * Architecture: Repository에서 DB 필터링 → Service에서 라인 파싱 + 컨텍스트 구성.
 * 패턴: SafeDTO(문자열) → Service에서 VO 변환 → Repository에 VO 기반 scope 전달.
 */

import { BlockMountId } from '@/domains/canvas-management/shared/value-objects/block-mount-id.vo';
import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import type { BlockSearchRepository, BlockSearchScope } from '../../repositories/interfaces/block-search.repository.interface';

// ─── Types ────────────────────────────────────────────────────────────────

export type GrepMatchSource = 'content_raw' | 'source_content' | 'source_summary';

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

// ─── Args (SafeDTO from tool call) ────────────────────────────────────────

export interface GrepBlockContentArgs {
  /** 검색 패턴 배열. 단일/OR(any) 또는 AND(all)는 matchMode로 결정 */
  patterns?: string[];
  /** 'any' = 한 패턴이라도 포함하면 매칭(OR), 'all' = 모든 패턴 포함 시 매칭(AND). 기본 'any' */
  matchMode?: 'any' | 'all';
  /** true면 패턴에 매칭되지 않는 줄만 반환 (grep -v). 기본 false */
  invert?: boolean;
  /** source_summary 검색 시 언어 필터 (예: ["ko","en"]). 미지정 시 전체. 프로그램적 호출용. */
  summaryLanguages?: string[];
  targetBlockMountIds?: string[];
  blockTypes?: string[];
  contextLines?: number;
  pageId?: string;
  workspaceId?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────

/**
 * SafeDTO 문자열 → BlockSearchScope(VO) 변환.
 * 잘못된 UUID는 무시하고 해당 스코프만 비움.
 */
function buildScopeFromArgs(
  args: GrepBlockContentArgs,
  options?: { pageId?: string }
): BlockSearchScope | null {
  const pageIdStr = args?.pageId ?? options?.pageId;
  const workspaceIdStr = args?.workspaceId;
  const targetIds = args?.targetBlockMountIds;

  try {
    const targetBlockMountIds =
      targetIds?.length &&
      targetIds.every(id => id && id.trim())
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

/**
 * @param options.pageId - 현재 페이지 ID (route에서 clientContext로 주입). LLM이 args.pageId를 넘기지 않으면 이 값으로 스코프 기본 적용.
 */
export async function* executeGrepBlockContent(
  repository: BlockSearchRepository,
  args: GrepBlockContentArgs,
  options?: { pageId?: string }
): AsyncGenerator<GrepBlockContentYield, GrepBlockContentFinal, void> {
  const contextLines = 5;
  const matchMode = args?.matchMode === 'all' ? 'all' : 'any';
  const invert = Boolean(args?.invert);

  const patterns: string[] = Array.isArray(args?.patterns)
    ? args.patterns
        .map(p => (typeof p === 'string' && p.trim() ? p.trim() : ''))
        .filter(Boolean)
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

  const sourceList: GrepMatchSource[] = [
    'content_raw',
    'source_content',
    'source_summary',
  ];

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

  function buildMatchesFromLines(
    lines: string[],
    source: GrepMatchSource
  ): GrepMatch[] {
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

  function addToMap(
    blockMountId: string,
    blockType: string,
    title: string,
    matches: GrepMatch[]
  ): void {
    if (matches.length === 0) return;
    const existing = byBlock.get(blockMountId);
    if (existing) {
      existing.matches.push(...matches);
    } else {
      byBlock.set(blockMountId, { blockMountId, blockType, title, matches });
    }
  }

  try {
    if (sourceList.includes('content_raw')) {
      const rows = await repository.findByContentPattern(patterns, scope);
      for (const row of rows) {
        if (!row.contentRaw) continue;
        const lines = row.contentRaw.split('\n');
        const blockMatches = buildMatchesFromLines(lines, 'content_raw');
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
    const errResult: GrepBlockContentFinal = {
      matches: [],
      totalMatches: 0,
      searchedBlocks: 0,
    };
    yield errResult;
    return errResult;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
