import type { RecentEvent } from '@/domains/event-management';

/**
 * Context Builder for Agent V2
 *
 * Assembles dynamic context from client state to inject into user messages.
 * This allows the static system prompt to remain unchanged (enabling prompt caching).
 */

/**
 * Visible block metadata (excludes content)
 * blockMountId: canvas/selection reference; blockId: for content tools (readBlockLines, etc.)
 */
export interface VisibleBlockMeta {
  blockMountId: string;
  blockId?: string;
  blockType: string;
  title: string;
  connectedTo?: string[];
  connectedFrom?: string[];
}

/** Raw block shape from client (before validation) */
interface RawVisibleBlockMeta {
  blockMountId?: unknown;
  blockId?: unknown;
  blockType?: unknown;
  title?: unknown;
  connectedTo?: unknown;
  connectedFrom?: unknown;
}

/**
 * Dynamic context interface
 * Fields will be added incrementally per implementation step:
 * - Step 1-2: selectedBlocks, visibleBlocks ✓
 * - Step 1-12: activeJobs
 * - Step 1-13: recentEvents ✓
 */
export interface DynamicContext {
  // Step 1-2: Basic context layer
  pageId?: string;
  workspaceId?: string;
  orgId?: string;
  /** Selected blocks with full meta (blockMountId, blockId, type, title) — IDs derived from this when needed */
  selectedBlocks?: VisibleBlockMeta[];
  visibleBlocks?: VisibleBlockMeta[];
  /** Total blocks in viewport before cap (zoom-out edge case) */
  visibleBlocksTotalInView?: number;
  /** Number of blocks included in context (capped near center, max 20) */
  visibleBlocksInContext?: number;

  // Step 1-13: Recent events (injected server-side)
  recentEvents?: RecentEvent[];
}

/**
 * Build dynamic context string from client context
 *
 * @param clientContext - Raw client context from the request
 * @returns Formatted context string
 */
export function buildDynamicContext(clientContext: unknown): string {
  if (!clientContext || typeof clientContext !== 'object') {
    return '';
  }

  const ctx = parseDynamicContext(clientContext);
  return formatContextBlock(ctx);
}

/**
 * Parse raw client context into typed DynamicContext
 */
export function parseDynamicContext(raw: unknown): DynamicContext {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const ctx = raw as Record<string, unknown>;

  const recentEvents = Array.isArray(ctx.recentEvents)
    ? ctx.recentEvents.filter(
      (e): e is RecentEvent =>
        e != null &&
        typeof e === 'object' &&
        typeof e.type === 'string' &&
        typeof e.actor === 'string' &&
        typeof e.summary === 'string' &&
        typeof e.timestamp === 'string' &&
        typeof e.timeAgo === 'string'
    )
    : undefined;

  return {
    pageId: typeof ctx.pageId === 'string' ? ctx.pageId : undefined,
    workspaceId: typeof ctx.workspaceId === 'string' ? ctx.workspaceId : undefined,
    orgId: typeof ctx.orgId === 'string' ? ctx.orgId : undefined,
    selectedBlocks: Array.isArray(ctx.selectedBlocks)
      ? ctx.selectedBlocks
          .filter((block): block is RawVisibleBlockMeta => typeof block === 'object' && block !== null)
          .map((block) => ({
            blockMountId: typeof block.blockMountId === 'string' ? block.blockMountId : '',
            blockId: typeof block.blockId === 'string' ? block.blockId : undefined,
            blockType: typeof block.blockType === 'string' ? block.blockType : 'unknown',
            title: typeof block.title === 'string' ? block.title : 'Untitled',
            connectedTo: Array.isArray(block.connectedTo)
              ? block.connectedTo.filter((id): id is string => typeof id === 'string')
              : undefined,
            connectedFrom: Array.isArray(block.connectedFrom)
              ? block.connectedFrom.filter((id): id is string => typeof id === 'string')
              : undefined,
          }))
      : undefined,
    visibleBlocks: Array.isArray(ctx.visibleBlocks)
      ? ctx.visibleBlocks
        .filter((block): block is RawVisibleBlockMeta => typeof block === 'object' && block !== null)
        .map((block) => ({
          blockMountId: typeof block.blockMountId === 'string' ? block.blockMountId : '',
          blockId: typeof block.blockId === 'string' ? block.blockId : undefined,
          blockType: typeof block.blockType === 'string' ? block.blockType : 'unknown',
          title: typeof block.title === 'string' ? block.title : 'Untitled',
          connectedTo: Array.isArray(block.connectedTo)
            ? block.connectedTo.filter((id): id is string => typeof id === 'string')
            : undefined,
          connectedFrom: Array.isArray(block.connectedFrom)
            ? block.connectedFrom.filter((id): id is string => typeof id === 'string')
            : undefined,
        }))
      : undefined,
    visibleBlocksTotalInView:
      typeof ctx.visibleBlocksTotalInView === 'number' ? ctx.visibleBlocksTotalInView : undefined,
    visibleBlocksInContext:
      typeof ctx.visibleBlocksInContext === 'number' ? ctx.visibleBlocksInContext : undefined,
    recentEvents,
  };
}

/**
 * Format dynamic context as a text block for injection
 */
function formatContextBlock(ctx: DynamicContext): string {
  const sections: string[] = [];

  // Page info
  if (ctx.pageId || ctx.workspaceId || ctx.orgId) {
    sections.push('**Current Page**:');
    if (ctx.pageId) sections.push(`- Page ID: \`${ctx.pageId}\``);
    if (ctx.workspaceId) sections.push(`- Workspace ID: \`${ctx.workspaceId}\``);
    if (ctx.orgId) sections.push(`- Organization ID: \`${ctx.orgId}\``);
  }

  // Selected blocks (rich: blockMountId, blockId, type, title — same format as Visible Blocks)
  const selectedBlocks: VisibleBlockMeta[] = ctx.selectedBlocks ?? [];
  if (selectedBlocks.length > 0) {
    sections.push('');
    sections.push('**Selected Blocks**:');
    selectedBlocks.forEach((block, index) => {
      const parts: string[] = [
        `${index + 1}. Mount Id: \`${block.blockMountId}\``,
        `- Type: ${block.blockType}`,
        `- Title: "${block.title}"`,
      ];
      if (block.blockId) parts.push(`- Block ID: \`${block.blockId}\``);
      if (block.connectedFrom && block.connectedFrom.length > 0) {
        parts.push(`- Connected from (sources): ${block.connectedFrom.map((id: string) => `\`${id}\``).join(', ')}`);
      }
      if (block.connectedTo && block.connectedTo.length > 0) {
        parts.push(`- Connected to (targets): ${block.connectedTo.map((id: string) => `\`${id}\``).join(', ')}`);
      }
      sections.push(parts.join('\n  '));
    });
  }

  // Visible blocks (with total/in-context counts when provided for zoom-out cap)
  if (ctx.visibleBlocks && ctx.visibleBlocks.length > 0) {
    sections.push('');
    const totalInView = ctx.visibleBlocksTotalInView;
    const inContext = ctx.visibleBlocksInContext;
    if (
      typeof totalInView === 'number' &&
      typeof inContext === 'number' &&
      totalInView > inContext
    ) {
      sections.push(
        `**Visible Blocks**: ${totalInView} total in viewport; ${inContext} blocks near center included.`
      );
    } else {
      sections.push('**Visible Blocks** (currently in viewport):');
    }
    ctx.visibleBlocks.forEach((block, index) => {
      const parts: string[] = [
        `${index + 1}. Mount Id: \`${block.blockMountId}\``,
        `- Type: ${block.blockType}`,
        `- Title: "${block.title}"`,
      ];
      if (block.blockId) parts.push(`- Block ID: \`${block.blockId}\``);
      if (block.connectedFrom && block.connectedFrom.length > 0) {
        parts.push(`- Connected from (sources): ${block.connectedFrom.map((id: string) => `\`${id}\``).join(', ')}`);
      }
      if (block.connectedTo && block.connectedTo.length > 0) {
        parts.push(`- Connected to (targets): ${block.connectedTo.map((id: string) => `\`${id}\``).join(', ')}`);
      }
      sections.push(parts.join('\n  '));
    });
  }

  // Recent events (time-ordered activity log)
  if (ctx.recentEvents && ctx.recentEvents.length > 0) {
    sections.push('');
    sections.push('**Recent Events** (last ~15 actions on this page):');
    ctx.recentEvents.forEach((ev, index) => {
      const line = `- [${ev.timeAgo}] (${ev.actor}) ${ev.type}: ${ev.summary}`;
      sections.push(line);
    });
  }

  return sections.length > 0 ? sections.join('\n') : '';
}
