# 🚀 SSOTA Open Source Readiness Analysis

> This document analyzes the current codebase structure and provides a roadmap for transitioning SSOTA into a successful open-source project, comparable to AFFiNE, n8n, and React Flow.

## 📊 Executive Summary

| Criteria | Current Score | Target |
|----------|---------------|--------|
| Code Quality | 8/10 | ✅ DDD well applied |
| Package Separation | 3/10 | ❌ Critical improvement needed |
| Documentation | 5/10 | 🟡 Internal → External transition required |
| Extensibility | 4/10 | ❌ No Plugin API |
| Internationalization | 2/10 | ❌ Korean dependency |
| Testing | 7/10 | ✅ Present but scattered |

**Verdict**: Not ready for open-source release in current state. Core logic extraction is the priority.

---

## 🔍 Current Architecture Analysis

### Current Structure

```
ssota/
├── apps/
│   └── web/                    # ❌ All business logic concentrated here
│       └── src/
│           └── domains/        # DDD structure but app-dependent
│               ├── block-management/      (~400+ files)
│               ├── canvas-management/     (~100+ files)
│               ├── workspace-management/  
│               ├── organization-management/
│               ├── user-management/
│               ├── ai-management/
│               ├── image-app-space/
│               └── ...
├── packages/
│   ├── eslint-config/          # ✅ Shared config
│   ├── typescript-config/      # ✅ Shared config
│   └── ui/                     # ✅ UI components (but hard to extend)
└── docs/
    ├── event-domain-design/    # ✅ Comprehensive domain docs
    └── agile-planning/         # ✅ Sprint planning docs
```

### Key Issues

#### 1. **Core Logic App Dependency** (Critical)

All core domain logic resides in `apps/web/src/domains/`:

```typescript
// Current: tightly coupled to Next.js app
// apps/web/src/domains/block-management/shared/entities/block.entity.ts
import { WorkspaceId } from '@/domains/workspace-management/shared/value-objects/workspace-id.vo';
```

**Problems:**
- ❌ Cannot use block system in external projects
- ❌ Cannot reuse in other frameworks (Vue, Svelte)
- ❌ Cannot provide as `npm install @ssota/blocks`

#### 2. **Framework-Dependent Core Logic**

DDD Entities exist inside Next.js app:
- Pure business logic cannot be used without Next.js project
- No clear separation between framework code and domain logic

#### 3. **Unclear Package Boundaries**

| Current | Ideal (AFFiNE-style) |
|---------|---------------------|
| `apps/web/src/domains/block-management/` | `packages/core/blocks/` |
| `apps/web/src/domains/canvas-management/` | `packages/canvas-engine/` |
| DDD tied to app | Framework-agnostic core |

#### 4. **Language Barrier**

Korean comments and documentation:
- Barrier for global contributors
- Limits community growth

---

## ✅ Positive Aspects

1. **Well-structured DDD**
   - Entity, Value Object, Repository patterns
   - Clear Aggregate boundaries
   - Tests included

2. **Modern Monorepo Setup**
   - Turborepo + pnpm workspaces
   - Scalable foundation

3. **Detailed Convention Documentation**
   - Excellent `CONTRIBUTING.md`
   - Commit message, branch strategy defined

4. **Event Domain Design Documentation**
   - Comprehensive `docs/event-domain-design/`
   - Existing open-source transition plan (`opensource-monorepo.md`)

---

## 🎯 Reference: Successful Open Source Projects

### AFFiNE (60.5k ⭐)

```
AFFiNE/
├── blocksuite/          # ⭐ Core: Independently usable editor engine
├── packages/
│   ├── frontend/component/   # UI components
│   └── common/theme/         # Design tokens
└── docs/                # Contributor documentation
```

**Key Success Factors:**
- Core editor engine as **independent package** (`blocksuite`)
- Clear package separation by function
- Plugin system with `registerBlockType()` API

### React Flow

```typescript
// Clean, importable packages
import { ReactFlow, useNodesState } from '@xyflow/react';

// What SSOTA should provide:
import { CanvasEngine, useBlocks } from '@ssota/react';
import { MarkdownBlock } from '@ssota/blocks';
```

---

## 📋 Recommended Architecture

### Target Structure

```
ssota/
├── apps/
│   ├── web/                    # SaaS application (Next.js)
│   ├── studio/                 # 🆕 Dev playground (Storybook)
│   └── docs/                   # 🆕 Documentation site
├── packages/
│   ├── core/                   # 🆕 Framework-agnostic business logic
│   │   ├── blocks/            # Block Entity, Value Objects
│   │   ├── canvas/            # Canvas Engine (independent of React Flow)
│   │   ├── events/            # Domain Events
│   │   └── schema/            # Zod schemas
│   ├── adapters/
│   │   └── react/             # 🆕 React bindings (hooks, providers)
│   ├── blocks/                # 🆕 First-party block types
│   │   ├── markdown/
│   │   ├── youtube/
│   │   ├── image/
│   │   └── shape/
│   ├── views/                 # 🆕 Table, Kanban, Calendar views
│   ├── ui/                    # (existing - enhanced)
│   ├── eslint-config/         # (existing)
│   └── typescript-config/     # (existing)
├── plugins/                   # 🆕 Community plugins
│   └── example-block/
└── templates/                 # 🆕 Scaffolding templates
```

### Package Layering Rules

```
core  ← schema, events (no framework dependencies)
adapters/* ← core, ui
blocks ← core, schema, adapters/*
views ← core, schema
apps/* ← everything above via public APIs only
```

### Target API Design

```typescript
// packages/core/src/blocks/define-block.ts
import { defineBlockType } from '@ssota/core'
import { z } from 'zod'

export const YouTubeBlock = defineBlockType({
  type: 'youtube',
  props: z.object({
    url: z.string().url(),
    title: z.string().optional(),
    transcript: z.string().optional(),
  }),
  tools: {
    extractTranscript: { scope: 'server' },
    captureFrame: { scope: 'server' },
  },
})
```

```typescript
// packages/adapters/react/src/hooks/use-blocks.ts
import { useBlocks, useCanvas, BlockProvider } from '@ssota/react'

function MyCanvas() {
  const { blocks, addBlock } = useBlocks()
  return (
    <BlockProvider>
      <CanvasSurface blocks={blocks} />
    </BlockProvider>
  )
}
```

---

## 📅 Implementation Roadmap

### Phase 1: Core Extraction (Weeks 1-4)

| Task | Priority | Duration | Description |
|------|----------|----------|-------------|
| Create `packages/core/` | P0 | 2 weeks | Extract pure TS business logic |
| Extract Block entities | P0 | 1 week | Move from `apps/web/src/domains/block-management/shared/` |
| Extract Canvas engine | P0 | 1 week | Decouple from React Flow |
| Create `packages/schema/` | P0 | 2 days | Zod schemas for all entities |

### Phase 2: React Adapter (Weeks 5-6)

| Task | Priority | Duration | Description |
|------|----------|----------|-------------|
| Create `packages/adapters/react/` | P0 | 1 week | React hooks and providers |
| Migrate existing hooks | P1 | 3 days | Move from `apps/web/src/hooks/` |
| Create `BlockProvider` | P1 | 2 days | Context provider for blocks |

### Phase 3: Documentation (Weeks 7-8)

| Task | Priority | Duration | Description |
|------|----------|----------|-------------|
| Translate comments to English | P1 | 1 week | i18n for global contributors |
| Setup TypeDoc | P1 | 2 days | Auto-generate API docs |
| Write getting started guide | P1 | 3 days | Quick start for new users |
| Create architecture guide | P2 | 2 days | High-level system overview |

### Phase 4: Plugin System (Weeks 9-12)

| Task | Priority | Duration | Description |
|------|----------|----------|-------------|
| Design `defineBlockType()` API | P2 | 1 week | Extensible block registration |
| Create example plugin | P2 | 3 days | Community contribution template |
| Setup `plop` generators | P2 | 2 days | `pnpm plop block` scaffolding |
| Create `apps/studio/` | P2 | 1 week | Block development playground |

---

## 📦 Package Publishing Strategy

### Open Source Packages (MIT License)

| Package | npm Name | Description |
|---------|----------|-------------|
| `packages/core` | `@ssota/core` | Framework-agnostic engine |
| `packages/adapters/react` | `@ssota/react` | React bindings |
| `packages/blocks` | `@ssota/blocks` | First-party blocks |
| `packages/schema` | `@ssota/schema` | Zod schemas |
| `packages/ui` | `@ssota/ui` | UI component library |

### SaaS-Only (Proprietary)

- Real-time multi-presence
- Organization/workspace management
- AI agents and advanced features
- Template marketplace
- Enterprise features (SSO, RBAC, audit logs)

---

## 🔧 Immediate Action Items

### This Week

- [ ] Create `packages/core/` directory structure
- [ ] Define package boundaries in ESLint
- [ ] Start extracting `Block` entity

### This Month

- [ ] Complete core extraction
- [ ] Setup TypeDoc for API documentation
- [ ] Create `packages/adapters/react/`

### This Quarter

- [ ] First npm release (`@ssota/core@0.1.0`)
- [ ] Documentation site launch
- [ ] Plugin system MVP

---

## 📚 References

- [AFFiNE Repository](https://github.com/toeverything/AFFiNE)
- [React Flow](https://github.com/xyflow/xyflow)
- [n8n](https://github.com/n8n-io/n8n)
- [Internal: Open Source Monorepo Plan](docs/event-domain-design/discussion/project-strategy/opensource-monorepo.md)

---

## 🤝 Contributing

Once the core extraction is complete, we will welcome community contributions:

1. **Block Development**: Create custom block types
2. **View Development**: Create new views (Kanban, Timeline, etc.)
3. **Documentation**: Improve guides and examples
4. **Translations**: Help localize documentation

---

*Last Updated: December 2024*
*Status: Planning Phase*

