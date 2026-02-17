/**
 * Agent V2 Tool Definitions
 *
 * This file defines all tools available to the main agent.
 * Tools are added incrementally per implementation step:
 * - Step 1-3: web_search, x_search (xAI native - no schema needed) ✓
 * - Step 1-4: renderCanvasdown, patchCanvasdown
 * - Step 1-5: grepBlockContent, globBlocks, readBlockLines
 * - Step 1-6: editBlockLines
 * - Step 1-7: hopSearch, searchGroup, searchBySemantic
 * - Step 1-8: organizeLayout
 * - Step 1-9: createTodos
 * - Step 1-11: canvasAction
 */

import { z } from 'zod';

// ============================================================================
// Step 1-3: Search (Server-side — xAI Live Search via dedicated tool)
// ============================================================================
// xaiSearch runs on the server: it calls xAI with searchParameters and returns
// content + citations. The main agent uses Chat API only (no Responses API),
// so we can mix this server tool with client-side renderCanvasdown/patchCanvasdown.

const xaiSearchArgsSchema = z.object({
  query: z.string().describe('Search query (e.g. "latest news about X", "what is Y")'),
});

/**
 * xaiSearch - Server-side tool that runs xAI Live Search.
 * Execute is attached in route.ts (calls generateText with searchParameters).
 */
export const xaiSearchTool = {
  description: `Search the web or X (Twitter) for current information. Use when the user asks for:
- Real-time or recent information, news, events
- "Search for...", "Find...", "Look up...", "What is the latest..."
- Fact-checking or up-to-date data

Call with a clear query. Search covers both web and X (Twitter) as needed.`,
  inputSchema: xaiSearchArgsSchema,
};

// ============================================================================
// Step 1-4: Canvasdown Tools (Client-side)
// ============================================================================

/**
 * renderCanvasdown - Create new blocks with Full DSL
 *
 * Reference: Visual Summarizer's renderCanvasdownTool
 * Creates blocks, edges, and layout in a single declarative call.
 */
export const renderCanvasdownTool = {
  description: `Render Canvasdown DSL code to create new blocks on the canvas.

Canvasdown is a DSL that converts structured text into interactive canvas nodes and edges.


=== WHEN TO USE ===
- Creating NEW blocks (markdown, shape, zone/group)
- Adding edges between blocks
- Setting up initial layout

=== SYNTAX ===

**Canvas Direction**: canvas TB | LR | RL | BT

**Shape Block**:
@shape id "Label" {
  shapeType: rectangle | ellipse | triangle | diamond | hexagon | parallelogram | cylinder,
  color: red | orange | amber | green | blue | purple | pink | gray,
  borderStyle: solid | dashed | dotted,
  title: "Content",
  content: "Markdown text"
}

**Markdown Block**:
@markdown id "Label" {
  color: gray,
  title: "Title",
  content: "Markdown text"
}

**Zone (Group)**:
@zone id "Label" {
  direction: TB | LR | RL | BT,
  color: red | orange | amber | green | blue | purple | pink | gray,
  title: "Zone Title",
  content: "Markdown text"
}
  @shape child_id "Child" { ... }
@end

**Edges**:
# Basic edge
source_id -> target_id

# Edge with label
source_id -> target_id : "label"

# Edge with properties
source_id -> target_id {
  label: "Connection",
  markerEnd: "arrowclosed",
  markerStart: "arrow",
  style: { stroke: "red" | "green" | "blue" | "purple" | "gray" | "orange" | "amber" | "pink", strokeWidth: 2 },
  shape: "default" | "straight" | "step" | "smoothstep" | "simplebezier"
}

=== EDGE MARKERS ===
markerEnd (target side) and markerStart (source side):
- arrow, arrowclosed: Filled arrow
- arrow-open: Outline arrow
- circle, circle-open: Filled/outline circle
- diamond, diamond-open: Filled/outline diamond

=== RULES ===
- Strings: NO apostrophes ("Do Not" NOT "Don't")
- Properties: Comma-separated
- Include edges in the same render as blocks for proper layout

=== ZONE PARSING (CRITICAL) ===
- @zone property block MUST be closed with } BEFORE child blocks
- CORRECT: @zone id "Label" { direction: TB, color: blue, title: "Title" }
  @shape child "Child" { ... }
@end
- WRONG: @zone id "Label" { direction: TB, title: "Title"
  @shape child ...  (missing } before @shape - causes parse error)

=== EXAMPLES ===

Example 1: Simple research findings
\`\`\`
canvas LR

@markdown idea1 "Main Idea" {
  title: "AI Startup Trends",
  content: "Key findings from research"
}

@shape company1 "Company 1" {
  shapeType: rectangle,
  color: blue,
  title: "OpenAI",
  content: "Leading AI research company"
}

@shape company2 "Company 2" {
  shapeType: rectangle,
  color: green,
  title: "Anthropic",
  content: "AI safety focused startup"
}

idea1 -> company1 : "example"
idea1 -> company2 : "example"
\`\`\`

Example 2: Multi-zone organization
\`\`\`
canvas TB

@zone research "Research Zone" {
  direction: LR,
  color: purple,
  title: "Research Findings"
}
  @markdown finding1 "Finding 1" {
    title: "Market Size",
    content: "$100B market"
  }
  @markdown finding2 "Finding 2" {
    title: "Growth Rate",
    content: "40% YoY growth"
  }
@end

@zone companies "Companies Zone" {
  direction: LR,
  color: blue,
  title: "AI Startups"
}
  @shape startup1 "Startup 1" {
    shapeType: rectangle,
    color: green,
    title: "Company A"
  }
  @shape startup2 "Startup 2" {
    shapeType: rectangle,
    color: amber,
    title: "Company B"
  }
@end
\`\`\`

=== RESULT ===
Returns { success: true, blockIdMap: { canvasdownId: blockMountId } }
Save blockIdMap for subsequent patches.`,
  inputSchema: z.object({
    dsl: z.string().describe('Canvasdown Full DSL code'),
    anchorBlockMountId: z.string().optional().describe('Optional anchor block to position relative to'),
    position: z.enum(['right', 'below']).default('right').optional().describe('Position relative to anchor'),
  }),
};

/**
 * patchCanvasdown - Modify existing blocks with Patch DSL
 *
 * Updates, connects, moves, or deletes existing blocks.
 */
export const patchCanvasdownTool = {
  description: `Modify existing blocks using Patch DSL.

=== WHEN TO USE ===
- Updating existing block content or properties
- Connecting blocks with new edges
- Moving or resizing blocks
- Deleting blocks

=== SYNTAX ===

**Update Block**:
@update blockMountId { title: "New content" }
@update blockMountId { title: "X", content: "Markdown here" }

**Connect Blocks**:
@connect blockMountId1 -> blockMountId2
@connect blockMountId1 -> blockMountId2 : "label"

**Move Block**:
@move blockMountId { x: 100, y: 200 }

**Delete Block**:
@delete blockMountId

=== CRITICAL RULES ===
- **Never use \`->\` or \`<-\`** inside @update title or content. Use "to", "implies", "→" instead.
  - BAD: content: "A -> B"
  - GOOD: content: "A leads to B" or "A → B"
- Keep title and content as single-line double-quoted strings
- Use \\n (backslash n) for line breaks inside strings

=== BLOCK MOUNT ID MAPPING ===
CRITICAL: Use actual blockMountId from previous renderCanvasdown results, NOT the original canvasdown ID.

When you create blocks with renderCanvasdown, it returns:
{ blockIdMap: { "your_canvasdown_id": "block-mount-abc123" } }

For patches, use the blockMountId value:
- CORRECT: @update block-mount-abc123 { title: "New" }
- WRONG: @update your_canvasdown_id { title: "New" }`,
  inputSchema: z.object({
    dsl: z.string().describe('Canvasdown Patch DSL (@update, @delete, @connect, @move, @resize)'),
  }),
};

// ============================================================================
// Step 1-5: Block Search/Read Tools (Server-side)
// ============================================================================

/**
 * grepBlockContent — Search block content for text patterns (like terminal `grep`).
 *
 * Searches blocks.content_raw via DB ILIKE, then server-side line parsing.
 * Options: matchMode (any=OR / all=AND), invert (lines that do not match). Scope: pageId (default), workspaceId, or targetBlockMountIds.
 */
export const grepBlockContentTool = {
  description: `Search for text patterns inside block content. Like terminal grep, but for canvas blocks.

Searches block content_raw, linked source extracted content (e.g. YouTube transcript, PDF text), and linked source AI summary. Returns matching lines with context (5 lines). Use readBlockLines to fetch more context if needed.

Use when:
- User asks: "Where does this keyword appear?", "Find all blocks mentioning X", "Search for a phrase in content".
- You need context: to understand what's on the page, what the current work state is, or what terms/topics appear in content before acting or answering. Use grep to ground your understanding in actual content.
- patterns: ["TODO"] (single) or ["TODO", "FIXME"] (OR).
- matchMode "all": line must contain every pattern (AND).
- invert: true = return lines that do NOT match (like grep -v).

Scope priority: targetBlockMountIds > pageId > workspaceId. Default scope = current page.

Returns: blockMountId + line number + matching line + surrounding context lines.`,
  inputSchema: z.object({
    patterns: z.array(z.string()).min(1).describe('Search patterns. One: ["TODO"]. OR: ["TODO", "FIXME"]. AND: use matchMode "all".'),
    matchMode: z.enum(['any', 'all']).default('any').optional().describe('"any" = line matches if it contains any pattern (OR). "all" = line must contain every pattern (AND).'),
    invert: z.boolean().default(false).optional().describe('If true, return lines that do NOT match the pattern(s) (like grep -v).'),
    targetBlockMountIds: z.array(z.string()).optional().describe('Search only these specific blocks'),
    blockTypes: z.array(z.string()).optional().describe('Filter by block types (e.g. ["markdown", "text"])'),
    pageId: z.string().optional().describe('Search within this page (default: current page)'),
    workspaceId: z.string().optional().describe('Search across entire workspace'),
  }),
};

/**
 * globBlocks — Search blocks by metadata (like terminal `find` / `ls *.md`).
 *
 * Searches block metadata (title, type) without looking inside content.
 * Scope: pageId (default: current page) or workspaceId.
 * Multiple title patterns: pass an array and use queryMatchMode for OR/AND.
 */
export const globBlocksTool = {
  description: `Search blocks by metadata (title, type). Does NOT search inside content — use grepBlockContent for that.

Use when: "List all markdown blocks", "Find blocks titled X", "What blocks exist on this page?".

Scope: pageId (default: current page) or workspaceId.

Multiple title patterns: pass an array and use queryMatchMode for OR/AND.

Returns: blockMountId, blockType, title, parentBlockMountId, timestamps.`,
  inputSchema: z.object({
    query: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .describe(
        'Title pattern(s). Single string or array. Case-insensitive substring match. Multiple patterns use queryMatchMode.'
      ),
    queryMatchMode: z
      .enum(['any', 'all'])
      .default('any')
      .optional()
      .describe(
        'For multiple query patterns: "any" = title contains any pattern (OR), "all" = title must contain every pattern (AND).'
      ),
    blockTypes: z.array(z.string()).optional().describe('Filter by block types (e.g. ["markdown", "youtube"])'),
    pageId: z.string().optional().describe('Search within this page (default: current page)'),
    workspaceId: z.string().optional().describe('Search across entire workspace'),
    limit: z.number().min(1).max(100).default(50).optional().describe('Max results (default: 50)'),
  }),
};

/**
 * readBlockLines — Read specific lines from a block's content.
 *
 * Reads block content_raw by blockMountId, or linked source content/summary when source is set.
 */
export const readBlockLinesTool = {
  description: `Read specific lines from a block's content (like terminal cat/head/tail).

Use when: "Show me the content of block X", "Read lines 10-20", "What does this block say?".

Use source to read linked source transcript (source_content) or AI summary (source_summary); use summaryLanguage for a specific summary language.

Returns: line-numbered text content for the requested range.`,
  inputSchema: z.object({
    blockMountId: z.string().describe('The block mount ID to read from'),
    startLine: z.number().min(1).default(1).describe('Starting line number (1-based, default: 1)'),
    endLine: z.number().min(1).optional().describe('Ending line (reads to end if omitted)'),
    source: z
      .enum(['content_raw', 'source_content', 'source_summary'])
      .default('content_raw')
      .optional()
      .describe(
        'Where to read from: block content_raw, linked source extracted content (e.g. transcript), or linked source summary. Default: content_raw.'
      ),
    summaryLanguage: z
      .string()
      .optional()
      .describe(
        'When source is source_summary: language code (e.g. "ko", "en"). Omit to get one available summary.'
      ),
  }),
};

// ============================================================================
// Step 1-6: Block Edit Tool (Client-side)
// ============================================================================

/**
 * editBlockLines — Edit block text by line range (replace, insert, delete).
 * Use after grep/read to modify specific lines. Client-side only.
 */
export const editBlockLinesTool = {
  description: `Edit block content by line range. Use after grepBlockContent or readBlockLines to modify specific lines.

- replace: Overwrite lines startLine through endLine (inclusive) with newContent. If endLine omitted, only startLine is replaced.
- insert: Insert newContent at line startLine (existing line and below shift down).
- delete: Remove lines startLine through endLine (inclusive). newContent not used.

Line numbers are 1-based. Returns success or error message.`,
  inputSchema: z.object({
    blockMountId: z.uuid().describe('Block mount ID to edit'),
    operation: z.enum(['replace', 'insert', 'delete']).describe('replace | insert | delete'),
    startLine: z.number().min(1).describe('Starting line (1-based)'),
    endLine: z.number().min(1).optional().describe('End line for replace/delete (inclusive). Omit to affect only startLine.'),
    newContent: z.string().optional().describe('New text for replace/insert. Required for replace and insert.'),
  }),
};

// ============================================================================
// Step 1-7: Connection Search Tools (Server-side)
// ============================================================================

/**
 * hopSearch — Find blocks N-hops away from a starting block via edge connections.
 */
export const hopSearchTool = {
  description: `Find blocks N-hops away from a starting block via edge connections.

Use when: exploring block relationships, finding connected blocks in a workflow, discovering related blocks through graph traversal.

- hops: 1 = directly connected, 2 = through one intermediary, 3 = max depth.
- direction: "out" (default) = follow outgoing edges, "in" = incoming, "both" = both directions.

Returns: blockMountIds and byHop entries with blockMountId, hop, edges (label, stroke, strokeWidth per connection), and optional blockType/title.`,
  inputSchema: z.object({
    startBlockMountId: z.uuid().describe('Starting block mount ID'),
    hops: z.number().min(1).max(3).default(1).optional().describe('Number of hops (default: 1, max: 3)'),
    direction: z.enum(['out', 'in', 'both']).default('out').optional().describe('Edge direction: out, in, or both'),
    pageId: z.uuid().optional().describe('Page scope (default: current page from context)'),
  }),
};

/**
 * searchGroup — Find blocks inside a group/zone by parent block mount ID.
 */
export const searchGroupTool = {
  description: `Find blocks inside a group or zone (blocks whose parent is the given group block mount).

Use when: "What is inside this group?", "List blocks in this zone."

Returns: blockMountIds and metadata (blockType, title) of direct children.`,
  inputSchema: z.object({
    groupBlockMountId: z.string().uuid().describe('Parent group/zone block mount ID'),
    pageId: z.string().uuid().optional().describe('Page scope (default: current page from context)'),
  }),
};

/**
 * searchBySemantic — Find blocks by semantic similarity to a query (MVP: stub or simple text similarity).
 */
export const searchBySemanticTool = {
  description: `Find contextually relevant blocks using semantic similarity to a natural language query.

Use when: finding blocks related to a concept or topic, discovering similar content with different wording.

MVP: May return stub message or simple text-based similarity. Full embedding-based search is planned.`,
  inputSchema: z.object({
    query: z.string().describe('Natural language query describing what to find'),
    topK: z.number().min(1).max(20).default(10).optional().describe('Max results (default: 10, max: 20)'),
    blockTypes: z.array(z.string()).optional().describe('Filter by block types (e.g. ["markdown", "text"])'),
    pageId: z.uuid().optional().describe('Page scope (default: current page from context)'),
  }),
};

// ============================================================================
// Event History (getPageEvents, grepEvents) — Server-side
// ============================================================================

/**
 * getPageEvents — Time-ordered activity history for the page.
 */
export const getPageEventsTool = {
  description: `Get page activity history — time-ordered events (user messages, agent actions, tool calls).

Use when: "What happened on this page?", "Show recent activity", "What did we do yesterday?", "History for this block."

- since/until: "1d", "1w", or ISO date string.
- eventTypes: filter by type (e.g. ["user_utterance", "tool_call", "ai_response"]).
- userId: filter by user.
- blockMountId: filter to events related to this block.
- groupByExecution: group events by agent execution (default: true).`,
  inputSchema: z.object({
    pageId: z.uuid().optional().describe('Page ID (default: current page)'),
    since: z.string().optional().describe('Start of range: "1d", "1w", or ISO date'),
    until: z.string().optional().describe('End of range: ISO date or relative'),
    eventTypes: z.array(z.string()).optional().describe('Filter by event types'),
    userId: z.uuid().optional().describe('Filter by user ID'),
    blockMountId: z.string().optional().describe('Filter to events related to this block'),
    groupByExecution: z.boolean().default(true).optional().describe('Group by agent execution'),
    limit: z.number().min(1).max(100).default(30).optional().describe('Max events (default: 30)'),
  }),
};

/**
 * grepEvents — Keyword search over event content (BM25).
 */
export const grepEventsTool = {
  description: `Search events by keyword (BM25). Use for "Who said X?", "Find when we discussed Y", "Events containing Z."

Same filters as getPageEvents: eventTypes, actor (user/agent/system), userId, blockMountId, since.`,
  inputSchema: z.object({
    query: z.string().describe('Search query (keywords)'),
    pageId: z.string().uuid().optional().describe('Page ID (default: current page)'),
    eventTypes: z.array(z.string()).optional().describe('Filter by event types'),
    actor: z.enum(['user', 'agent', 'system', 'all']).default('all').optional().describe('Filter by actor'),
    userId: z.string().uuid().optional().describe('Filter by user ID'),
    blockMountId: z.string().optional().describe('Filter to events related to this block'),
    since: z.string().optional().describe('"1d", "1w", or ISO date'),
    limit: z.number().min(1).max(50).default(20).optional().describe('Max results (default: 20)'),
  }),
};

// ============================================================================
// Step 1-8: Layout Tool (Client-side)
// ============================================================================

/**
 * organizeLayout — Reorganize existing blocks into a structured layout (client-side).
 */
export const organizeLayoutTool = {
  description: `Reorganize existing blocks into a structured layout. Client-side only.

=== LAYOUT TYPES ===
- grid: Arrange blocks in rows and columns. Use "columns" option.
- stack: Arrange blocks in a single line (vertical or horizontal). Use "direction" option (TB or LR).
- flow: Directed graph layout following edge connections. Uses ELK layered algorithm. Use "direction" option.
- tree: Hierarchical tree layout following edge connections. Uses ELK tree algorithm. Use "direction" option.
- mindmap: Radial layout expanding from a center node outward. Requires "centerBlockMountId".

=== LAYER CONSTRAINT ===
All target blocks MUST be on the same layer (same parent). Cannot mix root-level blocks with group children, or children from different groups.

=== EXAMPLES ===
- "Organize in 3 columns" -> type: grid, options: { columns: 3 }
- "Stack vertically" -> type: stack, options: { direction: TB }
- "Auto-layout as flowchart" -> type: flow, options: { direction: LR }
- "Make a mindmap from this block" -> type: mindmap, options: { centerBlockMountId: "..." }

=== RESULT ===
Returns { success: true, movedCount: N } or error message.`,
  inputSchema: z.object({
    type: z.enum(['grid', 'flow', 'tree', 'mindmap', 'stack']),
    options: z
      .object({
        columns: z
          .number()
          .min(1)
          .max(20)
          .optional()
          .describe('Grid columns (grid only, default: auto-calculate)'),
        direction: z
          .enum(['LR', 'RL', 'TB', 'BT'])
          .optional()
          .describe(
            'Layout direction (flow/tree/stack, default: LR for flow/tree, TB for stack)'
          ),
        spacing: z
          .number()
          .min(10)
          .max(500)
          .optional()
          .describe('Gap between blocks in px (default: 60)'),
        centerBlockMountId: z
          .string()
          .optional()
          .describe('Center node for mindmap layout (required for mindmap)'),
      })
      .optional(),
    targetBlockMountIds: z
      .array(z.string())
      .optional()
      .describe(
        'Specific blocks to organize. If omitted, all root-level blocks on the current canvas.'
      ),
  }),
};

// ============================================================================
// Step 1-9: Todo Tool (Client-side)
// ============================================================================

/**
 * createTodos — Create a task list for complex multi-step work (client-side).
 * Returns the list to the model only; no Status Window in MVP.
 */
export const createTodosTool = {
  description: `Create a todo list for the current complex task. Use when the user request has multiple clear steps (e.g. "organize these 5 blocks and add a summary block"). Returns the list to the model for reference.`,
  inputSchema: z.object({
    todos: z
      .array(
        z.object({
          title: z.string().describe('Short task title'),
          description: z.string().optional().describe('Optional detail'),
        })
      )
      .describe('List of tasks'),
  }),
};

// ============================================================================
// Step 1-11: Canvas Action Tool (Client-side)
// ============================================================================

/**
 * canvasAction — Select block, zoom viewport, or open block editor (client-side).
 */
export const canvasActionTool = {
  description: `Control canvas UI: select a block, zoom to a block or fit all, or open the block editor panel. Use when: "select that block", "zoom to that block", "show the whole canvas", "open that block's editor".`,
  inputSchema: z.object({
    action: z
      .enum(['select', 'zoomTo', 'openEditor'])
      .describe('Action: select block, zoom viewport, or open editor'),
    blockMountId: z
      .uuid()
      .optional()
      .describe('Block mount ID. Required for select and openEditor; required for zoomTo when zoomTarget is block'),
    zoomTarget: z
      .enum(['block', 'fit'])
      .optional()
      .describe('For zoomTo only: block = center on block, fit = fit entire canvas'),
  }),
};

// ============================================================================
// Type Exports
// ============================================================================

/** V2 agent tool names  */
export type V2ToolName =
  | 'xaiSearch'
  | 'renderCanvasdown'
  | 'patchCanvasdown'
  | 'grepBlockContent'
  | 'globBlocks'
  | 'readBlockLines'
  | 'hopSearch'
  | 'searchGroup'
  | 'searchBySemantic'
  | 'editBlockLines'
  | 'createTodos'
  | 'canvasAction'
  | 'organizeLayout'

/** Tool call shape for client typing */
export interface V2ToolCall {
  toolName: V2ToolName;
  args?: unknown;
}

/** Union of tool argument shapes for UI message part.input / part.args */
export type V2ToolArgs = Record<string, unknown>;
