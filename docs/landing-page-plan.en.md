## xbowl Landing Page Plan — Single Use Case Focus

Reference layout inspiration: [Railway](https://railway.com/)

Primary internal references: `docs/canvas-domain-architecture.md`, `docs/analyst/project-brief.md`, `docs/analyst/market-research.md`, `docs/analyst/competitor-analysis.md`, `docs/domains/`

---

### 0) Positioning / Key Message

- **Positioning**: Workspace-native 2D AI — “Scratch for AI agents” roots, re-focused on 2D document understanding and generation.
- **Core value**: Ingest 2D documents, understand their structure and relationships, generate new 2D documents to spec. Agent workflows exist as an optional accelerator, not the core.
- **Primary CTAs**: Start free, Watch demo, Explore templates.

---

### 1) Hero

- **Headline**: `ai canvas for [vibe coder]`
  - Rotating bracket: vibe coder → Cursor → Claude Code → Content Creator → Founder → Indie Hacker → Student → Agency
- **Subcopy (2 lines)**:
  - “Your workspace, understood. 2D docs in, 2D docs out.”
  - “xbowl ingests and interprets IA, user stories, wireframes, domain maps, storyboards, mindmaps—and generates new 2D documents that fit your needs.”
- **Primary CTA**: `Start free` / `Watch demo`
- **Secondary CTA**: `Browse templates`
- **Proof chips**: “Visual canvas · Universal node system · Real-time previews”
- **Visual**: React Flow canvas animation — documents appear as nodes, relationships connect, right panel shows AI interpretation and generated output.

---

### 2) Core Value Proposition

- **Title**: “Workspace-native 2D intelligence”
- **Lead paragraph**:
  - “Bring your 2D work artifacts into a visual canvas. xbowl understands structures and relationships across documents, and generates new canvases, tables, kanbans, or markdown views on demand—grounded in your workspace.”
- **Pillars summary (teaser)**: Ingest · Understand · Generate · Organize · Evolve
- **Key points**:
  1. **Ingest any 2D artifact**: IA, user story, wireframe, domain map, outlines, scripts, mindmaps.
  2. **Understand relationships**: Semantics mapped to `blocks`, `edges`, `block_positions` for consistent 2D layouts.
  3. **Generate to spec**: Ask for a new user story set, lesson concept map, or storyboard; xbowl builds the 2D document and renders it.
  4. **One model, multiple views**: Canvas, Table, Kanban, Markdown — all from a single source of truth.
  5. **Optional agent workflows**: Define specialized flows for your workspace when you need repeatable AI execution.

---

### 3) Product Pillars (Railway-style mapping)

- **Section title**: “Ingest · Understand · Generate · Organize · Evolve”
- **Five cards**:
  1. **Ingest**: Import existing docs or start from templates. Parse structures into nodes and edges.
  2. **Understand**: The universal node system aligns semantics across artifacts for consistent 2D reasoning.
  3. **Generate**: Natural language prompts create new IA, stories, wireframes, concept maps—rendered instantly.
  4. **Organize**: Group pages by kind, navigate folders, and switch between canvas/table/kanban/markdown.
  5. **Evolve**: Review outputs, edit live on canvas, version and improve templates over time.

---

### 4) Quickstart / Velocity

- **Title**: “From zero to workspace-aware in 5 minutes”
- **3-step guide**:
  1. Connect your workspace (import IA/stories/wireframes or start blank)
  2. Ask what you need (e.g., “Generate 10 user stories for the Dashboard IA”)
  3. Review on canvas, tweak, export
- **Secondary copy**: No setup required. Start in the browser. Grow with templates and (optional) agent workflows.
- **Visual**: 3-step screenshots or looped animation.

---

### 5) Build & Deploy (Structure inspired by Railway)

- **Title**: “One canvas from understanding to output”
- **Body**: Start from your existing artifacts or a template. Interpret, assemble, and generate deliverables in one flow—no context switching. (Structure inspired by [Railway](https://railway.com/))
- **Highlights**:
  - Single source model for 2D documents
  - Runtime generation of nodes/types driven by templates
  - Artifact-first collaboration (documents, structured data, flows)

---

### 6) Single Use Case, Multiple Personas (Examples)

- **Title**: “One use case: AI that understands your workspace”
- **Copy**: Different roles, same promise — ingest, interpret, generate 2D documents.
- **Example bullets**:
  - **Vibe Coder workspace**: IA → user stories → domain maps → wireframes
  - **Content marketer workspace**: ideas → outlines → storyboards → scripts
  - **Learning workspace**: mindmaps → lesson scripts → concept maps → quiz plans
- Note: These are illustrations of the same core use case, not separate products.

---

### 7) For Developers

- **Headline**: “Built for extensibility, grounded in consistency”
- **Points**:
  - Next.js 15, React 19, TypeScript 5, React Flow, Supabase + Drizzle, Clerk, Vercel AI SDK
  - Unified data model: `blocks`, `edges`, `block_positions` with RLS and indexing
  - Multiple views from the same source; policies guide rendering and editing per page kind
  - CLI/SDK (e.g., `xbowl-cli`) for sync/templating (progressively rolling out)

---

### 8) Observability

- **Headline**: “See what the AI sees”
- **Body**: Real-time visualization of parsed structures and generated outputs. Inspect relationships, preview artifacts, and iterate in place.
- **Icons/pills**: Live status, logs, artifact previews, versioning (planned), re-run.

---

### 9) Social Proof

- **Headline**: “Creators and teams are already mapping their work in 2D”
- **Logo wall**: Community or OSS placeholders
- **Quotes (guidance)**: 1–2 lines, role/use case/result. Use placeholders until real testimonials are collected.

---

### 10) Competitive Positioning

- **Summary table (short)**: xbowl vs Flowise vs n8n — target user, learning curve, marketplace/templates, 2D doc understanding
- **Copy**: “Most tools automate workflows or wire APIs. xbowl understands your workspace’s 2D artifacts and generates new ones to spec—no code required.”
- **Link**: See `docs/analyst/competitor-analysis.md` for details.

---

### 11) Pricing

- **Headline**: “Start free. Scale by usage.”
- **Plans**:
  - Free: Core canvas, starter templates, 1,000 tokens/month
  - Pro: Advanced templates, higher limits, priority support
  - Business: Team collaboration, roles/permissions, higher throughput
  - Enterprise: Custom security, deployment, SLAs
- **Note**: Token-based usage aligns with AI costs (see `docs/analyst/market-research.md`).

---

### 12) FAQ (Focused on workspace understanding)

- Do I need to build agent workflows to use xbowl?
  - No. Agent workflows are optional. The core is ingesting/interpreting/generating 2D documents.
- What types of documents can xbowl understand?
  - IA, user stories, wireframes, domain maps, outlines, scripts, mindmaps, and more.
- How does xbowl represent my documents?
  - A universal model: nodes (`blocks`), relationships (`edges`), and positions (`block_positions`) for consistent 2D layouts.
- How do I export results?
  - Switch views (canvas/table/kanban/markdown), export data or markdown, and keep editing.
- Is my data private?
  - Yes. We use RLS and modern best practices; more enterprise controls are available on higher tiers.

---

### 13) Final CTA + Footer

- **CTA block**: “Give your workspace a visual brain.” — `Start free` / `Watch demo`
- **Footer links**: Docs, Templates, Community, Pricing, Trust/Security, Blog (coming)

---

## Copy Guide (Draft)

- **Hero headline**: ai canvas for [vibe coder]
- **Hero sub**: “Your workspace, understood. 2D docs in, 2D docs out.”
- **Core value**: “Ingest · Understand · Generate · Organize · Evolve”
- **Quickstart**: “Connect. Ask. Review. Ship.”
- **Developers**: “Extensible by design. Consistent by default.”
- **Observability**: “See what the AI sees.”
- **Pricing**: “Start free. Scale by usage.”

---

## Visual / Art Direction Notes

- Light canvas with vivid node colors and smooth edge animations.
- Hero: progressive node creation + relationship wiring; right panel shows AI interpretation and output.
- Cards: simple line icons, 3–5 grid.
- Templates: thumbnails show compressed node/edge layout.

---

## IA / Section Order

1. Hero
2. Core Value Proposition
3. Pillars (Ingest/Understand/Generate/Organize/Evolve)
4. Quickstart
5. Build & Deploy (structure inspired)
6. Single Use Case with Persona Examples
7. For Developers
8. Observability
9. Social Proof
10. Competitive Positioning
11. Pricing
12. FAQ
13. Final CTA & Footer

---

## Internal Link Mapping

- Canvas/policies/data model: `docs/canvas-domain-architecture.md`
- MVP/messaging: `docs/analyst/project-brief.md`
- Pricing model/segments: `docs/analyst/market-research.md`
- Competitive summary: `docs/analyst/competitor-analysis.md`
- Domain policies/extensions: `docs/domains/`

---

## Next Steps

- Define hero animation specs (node creation/edge timing, ≤12s loop)
- Choose 3 real sample templates (Vibe coder, Content, Learning) for persona examples
- Collect testimonials and logos
- Pricing component wireframe (token notation)
- Screenshot capture points and privacy review

---

Note: Layout/section inspiration references [Railway](https://railway.com/).
