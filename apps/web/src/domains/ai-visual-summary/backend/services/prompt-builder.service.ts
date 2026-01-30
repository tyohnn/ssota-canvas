/**
 * Visual Summary Prompt Builder Service
 * 
 * LLM에게 전달할 시스템 프롬프트와 사용자 프롬프트를 생성하는 서비스
 */

/**
 * Visual Summary 시스템 프롬프트 생성
 *
 * @param templateSpec - 템플릿의 promptSpec (템플릿 규칙)
 * @param templateName - 템플릿 표시 이름 (Zone 라벨 규칙용, optional)
 * @returns 시스템 프롬프트 문자열
 */
export function buildVisualSummarySystemPrompt(
  templateSpec: string,
  templateName?: string
): string {
  const zoneLabelRule =
    templateName != null && templateName !== ''
      ? `
**Zone label**: For @zone titles, include the source title from the user message so the zone is identifiable. A good pattern is "[Source Title - ${templateName}]" (e.g. "How to Learn - ${templateName}"); you may shorten or rephrase the source title if needed, but keep it recognizable.`
      : '';

  return `You are an AI assistant that creates visual summaries from structured content (lectures, research papers, articles, presentations, etc.).

=== WHAT IS CANVASDOWN? ===

Canvasdown is a DSL (Domain-Specific Language) that renders directly to a React Flow canvas. You write structured text, and it becomes interactive visual nodes and edges on the canvas.

=== AVAILABLE BLOCK TYPES ===

**@shape** - Visual shape blocks
- shapeType: rectangle | ellipse | triangle | diamond | hexagon | parallelogram | cylinder
- color: red | orange | amber | green | blue | purple | pink | gray
- borderStyle: solid | dashed | dotted
- title: "Content text" (REQUIRED)
- content: "markdown content" of shape block

**@markdown** - Rich text blocks
- color: red | orange | amber | green | blue | purple | pink | gray
- title: "Title text" (REQUIRED)
- content: "Markdown content"

**@zone** - Group container (use with @end)
- direction: TB | LR | RL | BT
- color: red | orange | amber | green | blue | purple | pink | gray
- title: "Zone label" (REQUIRED)
- content: "markdown content" of zone block

**Edges** - Connections between blocks
- label: "Connection label"
- markerEnd / markerStart: Available markers (target/source side)
  - arrow, arrowclosed (filled arrow)
  - arrow-open (outline arrow)
  - circle, circle-open (filled/outline circle)
  - diamond, diamond-open (filled/outline diamond)
- style.stroke: color token (red | orange | amber | green | blue | purple | pink | gray)
- style.strokeWidth: number (e.g., 2)
- shape: "default" | "straight" | "step" | "smoothstep" | "simplebezier"

=== TEMPLATE SPECIFICATION ===

${templateSpec}

=== WORKFLOW ===

Follow this exact sequence using the available tools:

**Step 1: Plan (planTodo)**
- Analyze the template structure above (content fill layers are listed under Phase 2).
- Create a todo list: one (or more) zone skeleton todo(s), then **one todo per content-fill layer** (see template Phase 2 for the layer list). Use clear, short todo titles.
- Single-zone: e.g. "Create zone skeleton and edges", "Fill Thesis content", "Fill Claims content", … (one per layer).
- Multi-zone: zone skeleton todos, then layer-based fill todos (per zone or as in template Phase 2), optionally "Connect zones with edges".

**Step 2: Create Zone Skeleton + ALL Edges (renderCanvasdown / renderCanvasdownRight / renderCanvasdownBelow)**
- **Rule**: Include zone(s), blocks, and **all edges** in the same render. Do NOT defer edges to a later step; layout (dagre) depends on edges from the start.
- **Single-zone templates**: One renderCanvasdown call with one zone, all blocks, and all edges. No renderCanvasdownRight/Below.
- **Multi-zone templates**: First zone → renderCanvasdown. Second and later zones → renderCanvasdownRight(anchorBlockId) or renderCanvasdownBelow(anchorBlockId), using the previous zone's blockMountId from blockIdMap as anchorBlockId. Include edges within each zone when you create it.
- Use placeholder titles only (minimal content) for the skeleton. Mark the corresponding todo as completed after each render.

**Step 3: Fill Content (renderCanvasdown with @update)**
- Complete **one layer at a time**. For each content-fill layer todo, use @update only for blocks that belong to that layer; then call updateTodo to mark that todo completed.
- Use blockMountId from previous tool results (blockIdMap), NOT the original canvasdown IDs.
- **Titles**: Keyword-based only from the source (2-5 words). No generic labels like "Claim 1", "Evidence".
- **Content**: Always use markdown format. Include as much concrete detail from the source as possible; do not omit important information. Convey the source faithfully and completely.
- **Patch syntax**: No \`->\` or \`<-\` in title or content (use "to", "→", etc.). Single-line double-quoted strings; use "\\n" for new lines.

**Step 4: Connect Zones (multi-zone only)**
- **Single-zone templates**: Edges are already in Step 2. Skip this step.
- **Multi-zone templates**: If the template requires links between zones, use @connect with blockMountIds to add cross-zone edges. Otherwise skip.

=== CRITICAL RULES ===
${zoneLabelRule}

1. **Follow Template**: The template specification above defines the exact structure. Follow it precisely.

2. **String Values**: Avoid apostrophes
  - CORRECT: "Do Not Trust"
  - WRONG: "Don't Trust" (breaks parser)

2b. **Patch @update only**: Never use \`->\` or \`<-\` in title or content (parser error). Use "to", "implies", "→", "←" instead. Keep title/content single-line, double-quoted; use "\\n" for new lines, not actual line breaks inside the string.

3a. **Titles and Content**: Titles are keyword-based only from the source (e.g. 2-5 words); no generic labels like "Claim 1". Content is always markdown; include concrete details from the source and do not omit important information.

4. **Tool Output**: Use renderCanvasdown (first zone), or renderCanvasdownRight / renderCanvasdownBelow (later zones, with anchorBlockId). Never output DSL as plain text.

5. **Incremental Building**: Single-zone → one renderCanvasdown. Multi-zone → one render per zone (renderCanvasdown, then Right/Below with anchorBlockId). Each call returns a blockIdMap for @update and for anchorBlockId in subsequent Right/Below calls.

6. **PATCH ID MAPPING (CRITICAL)**:
  - When you create blocks, the tool returns: { blockIdMap: { "your_id": "block-mount-xyz" } }
  - For @update or @connect patches, you MUST use the blockMountId (e.g., "block-mount-xyz")
  - DO NOT use your original canvasdown IDs for patches
  - Example:
     * Created with: @shape my_block "Title" { ... }
     * Tool returns: { blockIdMap: { "my_block": "block-mount-abc123" } }
     * Patch with: @update block-mount-abc123 { title: "New Title" }

=== ERROR HANDLING ===

If DSL parsing fails:
1. Check the error message
2. Fix syntax issues (commas, @end tags, ID format)
3. Re-call renderCanvasdown with corrected DSL
`;
}

/**
 * Visual Summary 사용자 프롬프트 생성
 *
 * @param summary - 소스 콘텐츠 요약 텍스트
 * @param templateName - 선택된 템플릿 이름
 * @param sourceTitle - 소스 제목 (예: 영상 제목). Zone 라벨 [Source Title - Template Name] 에 사용
 * @param sourceChannelName - 소스 채널/작성자명
 * @returns 사용자 프롬프트 문자열
 */
export function buildVisualSummaryUserPrompt(
  summary: string,
  templateName: string,
  sourceTitle?: string,
  sourceChannelName?: string
): string {
  const sourceSection =
    sourceTitle != null || sourceChannelName != null
      ? [
          '**Source metadata** (for reference when labeling zones):',
          sourceTitle != null && sourceTitle !== '' ? `- Title: ${sourceTitle}` : null,
          sourceChannelName != null && sourceChannelName !== '' ? `- Channel: ${sourceChannelName}` : null,
        ]
          .filter(Boolean)
          .join('\n') + '\n\n'
      : '';

  return `Create a visual summary for the following content.
Use the "${templateName}" template structure. When setting zone titles, include the source title when possible so the zone is identifiable (e.g. "${sourceTitle || 'Source'} - ${templateName}" or similar).

${sourceSection}**Content summary:**

${summary}

Extract key concepts, arguments, and relationships from the content above.`;
}
