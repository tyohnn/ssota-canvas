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

Searches blocks.content_raw (plain text) and returns matching lines with context.

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
    contextLines: z.number().min(0).max(10).default(3).optional().describe('Context lines around each match (default: 3)'),
    pageId: z.string().optional().describe('Search within this page (default: current page)'),
    workspaceId: z.string().optional().describe('Search across entire workspace'),
  }),
};

/**
 * globBlocks — Search blocks by metadata (like terminal `find` / `ls *.md`).
 *
 * Searches block metadata (title, type) without looking inside content.
 * Scope: pageId (default: current page) or workspaceId.
 */
export const globBlocksTool = {
  description: `Search blocks by metadata (title, type). Does NOT search inside content — use grepBlockContent for that.

Use when: "List all markdown blocks", "Find blocks titled X", "What blocks exist on this page?".

Scope: pageId (default: current page) or workspaceId.

Returns: blockMountId, blockType, title, parentBlockMountId, timestamps.`,
  inputSchema: z.object({
    query: z.string().optional().describe('Title pattern to search (case-insensitive substring match)'),
    blockTypes: z.array(z.string()).optional().describe('Filter by block types (e.g. ["markdown", "youtube"])'),
    pageId: z.string().optional().describe('Search within this page (default: current page)'),
    workspaceId: z.string().optional().describe('Search across entire workspace'),
    limit: z.number().min(1).max(100).default(50).optional().describe('Max results (default: 50)'),
  }),
};

/**
 * readBlockLines — Read specific lines from a block's content.
 *
 * Reads block content_raw by blockMountId, returns line-numbered text.
 */
export const readBlockLinesTool = {
  description: `Read specific lines from a block's content (like terminal cat/head/tail).

Use when: "Show me the content of block X", "Read lines 10-20", "What does this block say?".

Returns: line-numbered text content for the requested range.`,
  inputSchema: z.object({
    blockMountId: z.string().describe('The block mount ID to read from'),
    startLine: z.number().min(1).default(1).describe('Starting line number (1-based, default: 1)'),
    endLine: z.number().min(1).optional().describe('Ending line (reads to end if omitted)'),
  }),
};

// ============================================================================
// Step 1-6: Block Edit Tool (Client-side)
// ============================================================================
// TODO: Add editBlockLinesTool

// ============================================================================
// Step 1-7: Connection Search Tools (Server-side)
// ============================================================================
// TODO: Add hopSearchTool, searchGroupTool, searchBySemanticTool

// ============================================================================
// Step 1-8: Layout Tool (Client-side)
// ============================================================================
// TODO: Add organizeLayoutTool

// ============================================================================
// Step 1-9: Todo Tool (Client-side)
// ============================================================================
// TODO: Add createTodosTool

// ============================================================================
// Step 1-11: Canvas Action Tool (Client-side)
// ============================================================================
// TODO: Add canvasActionTool

// ============================================================================
// Type Exports
// ============================================================================

/** V2 agent tool names (includes legacy web_search/x_search for old messages). */
export type V2ToolName =
  | 'xaiSearch'
  | 'renderCanvasdown'
  | 'patchCanvasdown'
  | 'grepBlockContent'
  | 'globBlocks'
  | 'readBlockLines'
  | 'web_search'
  | 'x_search'
  // Step 1-6+: Additional tool names will be added here
  ;

/** Tool call shape for client typing */
export interface V2ToolCall {
  toolName: V2ToolName;
  args?: unknown;
}

/** Union of tool argument shapes for UI message part.input / part.args */
export type V2ToolArgs = Record<string, unknown>;
