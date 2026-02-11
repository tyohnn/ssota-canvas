/**
 * globBlocks Tool Service
 *
 * 블록 메타데이터(title, type) 검색. content 내부는 검색하지 않음.
 * Architecture: Repository에서 DB 레벨 필터링 → Service에서 결과 포맷팅.
 * 패턴: SafeDTO(문자열) → Service에서 VO 변환 → Repository에 VO 기반 scope 전달.
 */

import { PageId } from '@/domains/workspace-management/shared/value-objects/page-id.vo';
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
import type { BlockSearchRepository, BlockSearchScope } from '../../repositories/interfaces/block-search.repository.interface';

// ─── Types ────────────────────────────────────────────────────────────────

export interface GlobBlockEntry {
  blockMountId: string;
  blockType: string;
  title: string;
  parentBlockMountId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type GlobBlocksIntermediate = {
  message?: string;
  step?: string;
};

export type GlobBlocksFinal = {
  blocks: GlobBlockEntry[];
  totalBlocks: number;
  filteredBy?: {
    query?: string;
    blockTypes?: string[];
    scope?: string;
  };
};

export type GlobBlocksYield = GlobBlocksIntermediate | GlobBlocksFinal;

// ─── Args (SafeDTO from tool call) ────────────────────────────────────────

export interface GlobBlocksArgs {
  query?: string;
  blockTypes?: string[];
  pageId?: string;
  workspaceId?: string;
  limit?: number;
}

// ─── Service ──────────────────────────────────────────────────────────────

/**
 * SafeDTO 문자열 → BlockSearchScope(VO) 변환.
 */
function buildScopeFromArgs(
  args: GlobBlocksArgs,
  options?: { pageId?: string }
): BlockSearchScope | null {
  const pageIdStr = args?.pageId ?? options?.pageId;
  const workspaceIdStr = args?.workspaceId;

  try {
    const pageId =
      pageIdStr && pageIdStr.trim() ? new PageId(pageIdStr.trim()) : undefined;
    const workspaceId =
      workspaceIdStr && workspaceIdStr.trim()
        ? new WorkspaceId(workspaceIdStr.trim())
        : undefined;

    if (!pageId && !workspaceId) {
      return null;
    }

    return {
      pageId,
      workspaceId,
      blockTypes: args?.blockTypes?.length ? args.blockTypes : undefined,
    };
  } catch {
    return null;
  }
}

export async function* executeGlobBlocks(
  repository: BlockSearchRepository,
  args: GlobBlocksArgs,
  options?: { pageId?: string }
): AsyncGenerator<GlobBlocksYield, GlobBlocksFinal, void> {
  const titleQuery = args?.query?.trim();
  const limit = Math.max(1, Math.min(100, args?.limit ?? 50));

  const scope = buildScopeFromArgs(args, options);
  if (!scope) {
    const noScope: GlobBlocksFinal = { blocks: [], totalBlocks: 0 };
    yield noScope;
    return noScope;
  }

  const filters: string[] = [];
  if (titleQuery) filters.push(`title: "${titleQuery}"`);
  if (scope.blockTypes?.length) filters.push(`types: [${scope.blockTypes.join(', ')}]`);
  const scopeLabel = scope.pageId ? 'page' : 'workspace';
  yield { message: `Searching blocks (${scopeLabel}${filters.length ? ', ' + filters.join(', ') : ''})...` };

  try {
    const rows = await repository.findByMetadata(titleQuery, scope, limit);

    const blockEntries: GlobBlockEntry[] = rows.map(row => ({
      blockMountId: row.blockMountId,
      blockType: row.blockType,
      title: row.title,
      parentBlockMountId: row.parentBlockMountId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));

    const final: GlobBlocksFinal = {
      blocks: blockEntries,
      totalBlocks: blockEntries.length,
      filteredBy: {
        ...(titleQuery && { query: titleQuery }),
        ...(scope.blockTypes?.length && { blockTypes: scope.blockTypes }),
        scope: scopeLabel,
      },
    };
    yield final;
    return final;
  } catch (error) {
    console.error('[globBlocks] Error:', error);
    const errResult: GlobBlocksFinal = { blocks: [], totalBlocks: 0 };
    yield errResult;
    return errResult;
  }
}
