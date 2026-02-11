/**
 * Context Builder for Agent V2
 *
 * Assembles dynamic context from client state to inject into user messages.
 * This allows the static system prompt to remain unchanged (enabling prompt caching).
 */

/**
 * Visible block metadata (excludes content)
 */
export interface VisibleBlockMeta {
  blockMountId: string;
  blockType: string;
  title: string;
  connectedTo?: string[];
}

/**
 * Dynamic context interface
 * Fields will be added incrementally per implementation step:
 * - Step 1-2: selectedBlockIds, visibleBlocks ✓
 * - Step 1-12: activeJobs
 * - Step 1-13: recentEvents
 */
export interface DynamicContext {
  // Step 1-2: Basic context layer
  pageId?: string;
  workspaceId?: string;
  orgId?: string;
  selectedBlockIds?: string[];
  visibleBlocks?: VisibleBlockMeta[];
  
  // Step 1-12: Active jobs
  // activeJobs?: ActiveJob[];
  
  // Step 1-13: Recent events
  // recentEvents?: RecentEvent[];
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

  return {
    pageId: typeof ctx.pageId === 'string' ? ctx.pageId : undefined,
    workspaceId: typeof ctx.workspaceId === 'string' ? ctx.workspaceId : undefined,
    orgId: typeof ctx.orgId === 'string' ? ctx.orgId : undefined,
    selectedBlockIds: Array.isArray(ctx.selectedBlockIds)
      ? ctx.selectedBlockIds.filter((id): id is string => typeof id === 'string')
      : undefined,
    visibleBlocks: Array.isArray(ctx.visibleBlocks)
      ? ctx.visibleBlocks
          .filter((block): block is Record<string, unknown> => typeof block === 'object' && block !== null)
          .map((block) => ({
            blockMountId: typeof block.blockMountId === 'string' ? block.blockMountId : '',
            blockType: typeof block.blockType === 'string' ? block.blockType : 'unknown',
            title: typeof block.title === 'string' ? block.title : 'Untitled',
            connectedTo: Array.isArray(block.connectedTo)
              ? block.connectedTo.filter((id): id is string => typeof id === 'string')
              : undefined,
          }))
      : undefined,
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

  // Selected blocks
  if (ctx.selectedBlockIds && ctx.selectedBlockIds.length > 0) {
    sections.push('');
    sections.push('**Selected Blocks**:');
    ctx.selectedBlockIds.forEach((id, index) => {
      sections.push(`${index + 1}. Block Mount ID: \`${id}\``);
    });
  }

  // Visible blocks
  if (ctx.visibleBlocks && ctx.visibleBlocks.length > 0) {
    sections.push('');
    sections.push('**Visible Blocks** (currently in viewport):');
    ctx.visibleBlocks.forEach((block, index) => {
      const parts: string[] = [
        `${index + 1}. \`${block.blockMountId}\``,
        `- Type: ${block.blockType}`,
        `- Title: "${block.title}"`,
      ];
      if (block.connectedTo && block.connectedTo.length > 0) {
        parts.push(`- Connected to: ${block.connectedTo.map((id) => `\`${id}\``).join(', ')}`);
      }
      sections.push(parts.join('\n  '));
    });
  }

  return sections.length > 0 ? sections.join('\n') : '';
}
