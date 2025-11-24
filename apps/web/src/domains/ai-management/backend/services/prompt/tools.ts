import { z } from 'zod';

/**
 * Tool Schemas for SSOTA Canvas Agent
 *
 * Tools are divided into two categories:
 * 1. Client-Side Tools: Executed in browser (no execute function)
 * 2. Server-Side Tools: Executed on server (with execute function)
 */

// ============================================================================
// Client-Side Tools (executed in browser)
// ============================================================================

export const addBlocksTool = {
  description: `Create one or more blocks on the canvas.

⚠️ IMPORTANT: Before creating blocks, you MUST call getBlockTypeDetail to understand:
- Available properties for each block type
- Proper usage and examples
- Block-specific configuration

This tool can create a single block or multiple blocks:
- Single block: Pass an array with one block object
- Multiple blocks: Pass an array with multiple block objects

Use this tool for both single and multiple block creation to reduce tool calls.

Position and size will be automatically calculated by the client based on:
- Selected blocks location
- Existing blocks on canvas
- Default: viewport center

Examples:
- Single block: {"blocks":[{"blockType":"markdown","title":"Meeting Notes","content":"# Agenda","properties":{"color":"blue"}}]}
- Multiple blocks: {"blocks":[{"blockType":"markdown","title":"Note 1","content":"# First"},{"blockType":"image","title":"Image 1","properties":{"imageUrl":"https://..."}}]}`,
  inputSchema: z.object({
    blocks: z
      .array(
        z.object({
          blockType: z
            .string()
            .describe(
              'REQUIRED: Block type as string (e.g., "markdown", "python", "image"). Call getBlockTypeDetail first to verify the block type exists.'
            ),
          title: z.string().describe('REQUIRED: Title of the block'),
          content: z
            .string()
            .optional()
            .describe(
              'OPTIONAL: Initial content for the block (markdown string)'
            ),
          properties: z
            .record(z.string(), z.any())
            .optional()
            .describe(
              'OPTIONAL: Initial properties for the block. Use getBlockTypeDetail to see available properties.'
            ),
        })
      )
      .min(1)
      .describe('REQUIRED: Array of blocks to create (at least 1 block)'),
  }),
};

export const searchByKeywordInPageTool = {
  description: `Search blocks by keyword in the current page only (client-side search).

When to use:
- Finding blocks in the current visible page
- Fast search without server round-trip
- Searching in title, properties, and content

Search scope (current page only):
- Block titles
- Block properties (all basic and custom properties)
- Block content

Note: For searching across all pages, use 'searchByKeyword' (server-side) instead.

Examples:
- Find all TODO blocks in current page: {"keyword":"TODO"}
- Find API-related code in current page: {"keyword":"API","blockTypes":["python"]}`,
  inputSchema: z.object({
    keyword: z.string().describe('REQUIRED: Search keyword or phrase'),
    blockTypes: z
      .array(z.string())
      .optional()
      .describe(
        'OPTIONAL: Filter by block types (e.g., ["markdown", "python"])'
      ),
  }),
};

export const updateTitleTool = {
  description: `Update the title of a block.

When to use:
- Changing block title (NOT a property, but an attribute)
- Renaming blocks

⚠️ CRITICAL: Use blockMountId from context, NOT blockId.
- blockMountId: The ID of the block instance on the page (use this for tool calls)
- blockId: The actual block data ID (internal use only, don't use in tools)

Example: {"blockMountId":"...","title":"New Title"}`,
  inputSchema: z.object({
    blockMountId: z
      .uuid()
      .describe(
        'REQUIRED: Block mount ID (the block instance on this page). Use the blockMountId value from context.'
      ),
    title: z.string().describe('REQUIRED: New title for the block'),
  }),
};

export const updateContentTool = {
  description: `Update the content of a block.

When to use:
- Modifying block content (NOT a property, but an attribute)
- For markdown blocks, text blocks, and other content-based blocks

⚠️ CRITICAL: Use blockMountId from context, NOT blockId.
- blockMountId: The ID of the block instance on the page (use this for tool calls)
- blockId: The actual block data ID (internal use only, don't use in tools)

Content format:
- Always provide as markdown string
- The client will automatically convert to Tiptap JSON format
- Use standard markdown syntax: # for headers, ** for bold, * for italic, etc.

Examples:
- Simple text: {"blockMountId":"...","content":"Hello World"}
- Markdown: {"blockMountId":"...","content":"# Title\\n\\n**Bold** and *italic* text"}`,
  inputSchema: z.object({
    blockMountId: z
      .uuid()
      .describe(
        'REQUIRED: Block mount ID (the block instance on this page). Use the blockMountId value from context.'
      ),
    content: z
      .string()
      .describe(
        'REQUIRED: New content as markdown string. Will be converted to Tiptap JSON on client.'
      ),
  }),
};

export const updatePropertiesTool = {
  description: `Update properties of one or more blocks.

⚠️ CRITICAL: Use blockMountId from context, NOT blockId.
- blockMountId: The ID of the block instance on the page (use this for tool calls)
- blockId: The actual block data ID (internal use only, don't use in tools)

⚠️ IMPORTANT: Before updating properties, you MUST:
1. For basic properties: Call getBlockTypeDetail to understand:
  - Available property names
  - Property types (string, number, enum, color, etc.)
  - Valid enum values (e.g., fontSize: "small" | "medium" | "large")
  - Default values and constraints
2. For custom properties: Check the selected block's customProperties in context

This tool can update a single block or multiple blocks:
- Single block: Pass an array with one update object
- Multiple blocks: Pass an array with multiple update objects

When to use:
- Changing block properties (NOT title or content)
- Updating basic properties (color, fontSize, textAlign, etc.)
- Updating custom properties (status, tags, dates, etc.)
- Applying images from imageSearch results to blocks
- Reducing tool calls when updating many blocks

Property Format:
- Pass properties as an object: {"imageUrl":"https://...","alt":"Image 1"}
- Multiple properties can be updated at once: {"color":"blue","fontSize":"large"}

Examples:
- Single block: {"updates":[{"blockMountId":"...","properties":{"imageUrl":"https://...","alt":"Image 1"}}]}
- Multiple blocks: {"updates":[{"blockMountId":"...","properties":{"imageUrl":"https://...","alt":"Image 1"}},{"blockMountId":"...","properties":{"imageUrl":"https://...","alt":"Image 2"}}]}`,
  inputSchema: z.object({
    updates: z
      .array(
        z.object({
          blockMountId: z
            .uuid()
            .describe(
              'REQUIRED: Block mount ID (the block instance on this page). Use the blockMountId value from context.'
            ),
          properties: z
            .record(z.string(), z.any())
            .describe(
              'REQUIRED: Object with property key-value pairs to update. Use getBlockTypeDetail to see available properties.'
            ),
        })
      )
      .min(1)
      .describe('REQUIRED: Array of block updates (at least 1 update)'),
  }),
};

export const connectBlocksTool = {
  description: `Connect one or more pairs of blocks with edges to express semantic relationships.

⚠️ CRITICAL: After creating related blocks, always consider connecting them.
Edges maintain context and align with SSOTA's philosophy.

This tool can create a single connection or multiple connections:
- Single connection: Pass an array with one connection object
- Multiple connections: Pass an array with multiple connection objects

Handle Positioning (Controls edge attachment points):
- Available handles: "top", "bottom", "left", "right"
- sourceHandle: Where the edge starts from the source block
- targetHandle: Where the edge ends on the target block
- Default: Auto-calculated if not specified

Visual Guidelines:
- Horizontal flows: Use right→left (sourceHandle: "right", targetHandle: "left")
- Vertical flows: Use bottom→top (sourceHandle: "bottom", targetHandle: "top")
- Star/Hub patterns: All edges from center (sourceHandle: varies)

When to use:
- Creating workflows or process flows (A → B → C)
- Expressing dependencies between blocks
- Grouping related blocks (connect to header/category block)
- Creating reference relationships
- Showing derivation (source → result)

Examples:
- Horizontal workflow: {"connections":[{"sourceBlockId":"a","targetBlockId":"b","sourceHandle":"right","targetHandle":"left"}]}
- Vertical timeline: {"connections":[{"sourceBlockId":"a","targetBlockId":"b","sourceHandle":"bottom","targetHandle":"top"}]}
- Hub connection: {"connections":[{"sourceBlockId":"hub","targetBlockId":"item1","sourceHandle":"bottom","targetHandle":"top"},{"sourceBlockId":"hub","targetBlockId":"item2","sourceHandle":"bottom","targetHandle":"top"}]}`,
  inputSchema: z.object({
    connections: z
      .array(
        z.object({
          sourceBlockId: z
            .uuid()
            .describe('REQUIRED: UUID of the source block (edge starts here)'),
          targetBlockId: z
            .uuid()
            .describe('REQUIRED: UUID of the target block (edge ends here)'),
          edgeType: z
            .string()
            .optional()
            .describe('OPTIONAL: Type of edge (default: "default")'),
          sourceHandle: z
            .enum(['top', 'bottom', 'left', 'right'])
            .optional()
            .describe(
              'OPTIONAL: Handle position on source block (top/bottom/left/right). Default: auto-calculated'
            ),
          targetHandle: z
            .enum(['top', 'bottom', 'left', 'right'])
            .optional()
            .describe(
              'OPTIONAL: Handle position on target block (top/bottom/left/right). Default: auto-calculated'
            ),
        })
      )
      .min(1)
      .describe('REQUIRED: Array of connections to create (minimum 1)'),
  }),
};

export const executeBlockActionTool = {
  description: `Execute a special action on a block.

⚠️ CRITICAL: Use blockMountId from context, NOT blockId.
- blockMountId: The ID of the block instance on the page (use this for tool calls)
- blockId: The actual block data ID (internal use only, don't use in tools)

⚠️ IMPORTANT: Before executing an action, you MUST call getBlockTypeDetail to:
- Verify the action exists for that block type
- Understand required parameters and their types
- Check action description and expected behavior

When to use:
- Code blocks: formatCode, refactor, addComments, execute
- Markdown blocks: summarize, translate, formatMarkdown
- Image blocks: generateImage, searchSimilar
- PDF blocks: extractText, convertToMarkdown
- Link blocks: fetchMetadata
- GitHub PR blocks: fetchPRData

Each block type has different actions - always check getBlockTypeDetail first.

Example: {"blockMountId":"...","action":"refactor","blockType":"python","params":{"style":"functional"}}`,
  inputSchema: z.object({
    blockMountId: z
      .uuid()
      .describe(
        'REQUIRED: Block mount ID (the block instance on this page). Use the blockMountId value from context.'
      ),
    blockType: z
      .string()
      .describe(
        'REQUIRED: Block type. Call getBlockTypeDetail first to see available block types.'
      ),
    action: z
      .string()
      .describe(
        'REQUIRED: Action name. Call getBlockTypeDetail first to see available actions for this block type.'
      ),
    params: z
      .record(z.string(), z.any())
      .optional()
      .describe(
        'OPTIONAL: Additional parameters for the action. Check getBlockTypeDetail for required params.'
      ),
  }),
};

// ============================================================================
// Server-Side Tools (executed on server)
// ============================================================================

export const getBlockTypeDetailTool = {
  description: `Get detailed information about a specific block type.

⚠️ CRITICAL: You MUST call this tool before:
- Creating a new block (addBlock)
- Updating block properties (updateProperty)
- Executing block actions (executeBlockAction)

Returns:
- Block type description and use cases
- Complete schema of basic properties
- List of available actions with parameters
- Usage examples

Example: {"blockType":"markdown"}`,
  inputSchema: z.object({
    blockType: z
      .string()
      .describe(
        'REQUIRED: Block type to get details for (e.g., "markdown", "python", "image")'
      ),
  }),
};

export const searchByKeywordTool = {
  description: `Search blocks by keyword in title, properties, and content.

When to use:
- Finding blocks containing specific text
- Searching for blocks with certain tags or labels
- Locating blocks by title

Search scope:
- Block titles
- Block properties (all basic and custom properties)
- Block content (markdown, code, text, etc.)

Examples:
- Find all TODO blocks: {"keyword":"TODO"}
- Find API-related code: {"keyword":"API","blockTypes":["python"]}`,
  inputSchema: z.object({
    keyword: z.string().describe('REQUIRED: Search keyword or phrase'),
    blockTypes: z
      .array(z.string())
      .optional()
      .describe(
        'OPTIONAL: Filter by block types (e.g., ["markdown", "python"])'
      ),
  }),
};

export const searchByHopTool = {
  description: `Find blocks N-hops away from a starting block via edge connections.

When to use:
- Exploring block relationships and dependencies
- Finding connected blocks in a workflow
- Navigating through block hierarchies
- Discovering related blocks through graph traversal

Hop count:
- 1 hop: Directly connected blocks
- 2 hops: Blocks connected through one intermediary
- 3 hops: Maximum depth (blocks connected through two intermediaries)

Direction:
- "out": Follow outgoing edges (default)
- "in": Follow incoming edges
- "both": Follow edges in both directions

Examples:
- Find directly connected blocks: {"startBlockId":"...","hops":1}
- Find 2-hop neighbors in both directions: {"startBlockId":"...","hops":2,"direction":"both"}`,
  inputSchema: z.object({
    startBlockId: z.uuid().describe('REQUIRED: UUID of the starting block'),
    hops: z
      .number()
      .min(1)
      .max(3)
      .default(1)
      .describe('OPTIONAL: Number of hops to traverse (default: 1, max: 3)'),
    direction: z
      .enum(['out', 'in', 'both'])
      .optional()
      .default('out')
      .describe('OPTIONAL: Edge direction - "out" (default), "in", or "both"'),
  }),
};

export const searchBySemanticTool = {
  description: `Find contextually relevant blocks using semantic similarity.

When to use:
- Finding blocks related to a concept or topic
- Discovering similar content with different wording
- Context-aware block retrieval without exact keyword matches

How it works:
- Uses semantic embeddings to understand meaning
- Finds blocks with similar concepts, not just matching text
- Ranks results by semantic relevance

Examples:
- Find ML-related blocks: {"query":"machine learning models","topK":5}
- Find planning docs: {"query":"project planning and roadmap","topK":10,"blockTypes":["markdown"]}`,
  inputSchema: z.object({
    query: z
      .string()
      .describe('REQUIRED: Natural language query describing what to find'),
    topK: z
      .number()
      .min(1)
      .max(20)
      .default(10)
      .describe('OPTIONAL: Number of results to return (default: 10, max: 20)'),
    blockTypes: z
      .array(z.string())
      .optional()
      .describe('OPTIONAL: Filter by block types (e.g., ["markdown", "text"])'),
  }),
};

export const searchBlockTypesTool = {
  description: `Search for block types by keyword or get list of all available block types.

When to use:
- Finding the right block type for a specific purpose
- Need to know what block types exist
- Searching for block types by functionality or use case

Returns:
- List of matching block types with brief descriptions
- For detailed information, call getBlockTypeDetail

Note: This returns a summary list. Use getBlockTypeDetail for complete information about a specific block type.

Example: {"query":"code"} or {"query":""}`,
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe(
        'OPTIONAL: Search query to filter block types. Empty string returns all block types.'
      ),
  }),
};
