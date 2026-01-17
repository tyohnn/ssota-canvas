# Spatial Context

**A Spatial Context Engineering SDK for AI Agents on 2D Canvas**

[![npm version](https://img.shields.io/npm/v/@spatial-context/core)](https://www.npmjs.com/package/@spatial-context/core)
[![npm version](https://img.shields.io/npm/v/@spatial-context/react-flow)](https://www.npmjs.com/package/@spatial-context/react-flow)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

```
User Intent → Context Engineering → Relevant Spatial Context → AI Agent Action
```

## Why Spatial Context?

### The Problem: AI Agents and 2D Canvas Understanding

When building AI agents for canvas-based applications (like whiteboards, mind maps, or design tools), we face a fundamental challenge: **How do AI agents understand spatial relationships in a 2D canvas?**

Traditional approaches provide AI agents with flat, unstructured data:

```
All blocks: [block1, block2, block3, ..., block999]
```

This approach has significant drawbacks:
- **Context overload** — Too much irrelevant information
- **No spatial awareness** — AI doesn't understand "nearby" or "connected"
- **Missing work history** — AI doesn't know what user was working on
- **Action blindness** — AI doesn't know what actions are available

### The Solution: Four Pillars of Spatial Context

We reimagined the approach: **What if AI could understand canvas context the way humans do in a meeting?**

Inspired by how humans collaborate around a whiteboard, we created **Spatial Context** — a framework that provides AI agents with four types of contextual understanding:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Spatial Context SDK                         │
├────────────────┬────────────────┬────────────────┬──────────────┤
│  Focus Context │ Semantic Context│ Work Context  │Action Context│
│                │                │                │              │
│ "What am I     │ "What's        │ "What happened │ "What can I  │
│  looking at?"  │  relevant?"    │  before?"      │  do here?"   │
├────────────────┼────────────────┼────────────────┼──────────────┤
│ • Selected     │ • Vector       │ • Event        │ • Available  │
│   block        │   embeddings   │   history      │   actions    │
│ • Connected    │ • BM25 search  │ • Recent       │ • Parameters │
│   neighbors    │ • Hybrid       │   operations   │ • Conditions │
│ • Nearby       │   search       │ • Sessions     │ • Execution  │
│   blocks       │                │                │              │
└────────────────┴────────────────┴────────────────┴──────────────┘
```

One SDK. Four context types. Complete spatial understanding.

## Features

### Core Features
- **Four Context Types** — Focus, Semantic, Work, and Action contexts
- **Framework Independent** — Pure TypeScript core, no React dependency
- **React Flow Adapter** — First-class React Flow integration
- **LLM Ready** — Generate prompts and tool definitions for any LLM

### 1. Focus Context (초점 맥락)
> "What am I looking at right now?"

Extracts context based on the user's current focus:

```typescript
const focusContext = await spatial.focus.getContext({
  selectedBlockId: 'block-123',
  edgeDepth: 2,           // Include blocks up to 2 edges away
  proximityRadius: 200,   // Include blocks within 200px
});

// Result:
// - Currently selected block with full properties
// - Blocks connected via edges (up to depth 2)
// - Nearby blocks within radius
```

**Use cases:**
- Understanding what the user is working on
- Finding related information in connected blocks
- Utilizing spatial proximity as semantic proximity

### 2. Semantic Context (의미 맥락)
> "What's relevant to the user's question?"

Finds semantically related blocks using vector search and BM25:

```typescript
const semanticContext = await spatial.semantic.search({
  query: "How do we handle user authentication?",
  strategy: 'hybrid',     // 'vector' | 'bm25' | 'hybrid'
  vectorWeight: 0.7,      // 70% vector, 30% BM25
  topK: 10,
});

// Result:
// - Blocks semantically related to the query
// - Relevance scores for each result
// - Works even when relevant blocks are far away
```

**Use cases:**
- Finding relevant information across the entire canvas
- Answering questions about canvas content
- Connecting ideas that are physically distant

### 3. Work Context (작업 맥락)
> "What happened before this moment?"

Tracks canvas events and provides historical context:

```typescript
const workContext = spatial.work.getContext({
  timeRange: { from: new Date('2024-01-01') },
  eventTypes: ['block.created', 'block.updated'],
  maxEvents: 50,
});

// Result:
// - Recent block operations
// - Who did what and when
// - Session-based activity tracking
```

**Use cases:**
- Understanding the evolution of ideas
- Resuming work after a break
- Collaborative context sharing

### 4. Action Context (액션 맥락)
> "What can I do here?"

Provides available actions and their parameters:

```typescript
const actionContext = spatial.action.getContext({
  blockTypes: ['shape', 'markdown'],
  onlyAvailable: true,
  relevanceQuery: "add a new node",
});

// Result:
// - Available actions for current context
// - Action parameters with validation
// - Suggested actions based on user intent
```

**Use cases:**
- Generating LLM tool definitions
- Dynamic action availability
- Context-aware suggestions

## Installation

```bash
# Core package (all four contexts)
npm install @spatial-context/core

# React Flow adapter
npm install @spatial-context/react-flow

# Peer dependencies for React Flow adapter
npm install @xyflow/react react react-dom
```

## Quick Start

### 1. Initialize Spatial Context

```typescript
import { SpatialContext } from '@spatial-context/core';

const spatial = new SpatialContext({
  // Optional: Custom embedding provider for semantic search
  embeddingProvider: {
    embed: async (text) => openai.embeddings.create({ input: text }),
    dimensions: 1536,
  },
});

// Register your block types
spatial.registerBlockType({
  name: 'shape',
  contentExtractor: (block) => block.data.label,
});

spatial.registerBlockType({
  name: 'markdown',
  contentExtractor: (block) => block.data.content,
});
```

### 2. Provide Canvas Data

```typescript
// Set your canvas blocks and edges
spatial.setGraph({
  nodes: canvasNodes,
  edges: canvasEdges,
});

// Track events (for work context)
spatial.work.recordEvent({
  type: 'block.created',
  targetId: 'new-block-id',
  data: { label: 'New Idea' },
});
```

### 3. Get Context for AI

```typescript
// Compose multiple contexts
const context = await spatial.compose({
  focus: {
    selectedBlockId: selectedNode?.id,
    edgeDepth: 1,
    proximityRadius: 150,
  },
  semantic: {
    query: userMessage,
    strategy: 'hybrid',
    topK: 5,
  },
  work: {
    maxEvents: 20,
  },
  action: {
    onlyAvailable: true,
  },
});

// Generate LLM prompt
const systemPrompt = spatial.toPrompt(context);

// Or generate LLM tools
const tools = spatial.toTools(context.actions);
```

### 4. Use with React Flow

```tsx
import { useSpatialContext } from '@spatial-context/react-flow';
import { ReactFlow } from '@xyflow/react';

function MyCanvas() {
  const { spatial, context } = useSpatialContext({
    embeddingProvider: myEmbeddingProvider,
  });

  const handleAIRequest = async (userMessage: string) => {
    const ctx = await spatial.compose({
      focus: { selectedBlockId: selectedNode?.id },
      semantic: { query: userMessage },
    });
    
    // Send to your AI backend
    const response = await ai.chat({
      messages: [
        { role: 'system', content: spatial.toPrompt(ctx) },
        { role: 'user', content: userMessage },
      ],
      tools: spatial.toTools(ctx.actions),
    });
  };

  return <ReactFlow nodes={nodes} edges={edges} />;
}
```

## API Reference

### SpatialContext

```typescript
class SpatialContext {
  // Context providers
  focus: FocusContextProvider;
  semantic: SemanticContextProvider;
  work: WorkContextProvider;
  action: ActionContextProvider;

  // Graph management
  setGraph(graph: { nodes: Node[]; edges: Edge[] }): void;
  
  // Block type registration
  registerBlockType(config: BlockTypeConfig): void;
  
  // Compose multiple contexts
  compose(options: ComposeOptions): Promise<ComposedContext>;
  
  // LLM integration
  toPrompt(context: ComposedContext): string;
  toTools(actions: ActionDefinition[]): LLMTool[];
}
```

### FocusContextProvider

```typescript
interface FocusContextProvider {
  getContext(options?: FocusContextOptions): FocusContextResult;
}

interface FocusContextOptions {
  selectedBlockId?: string;
  edgeDepth?: number;        // Default: 1
  proximityRadius?: number;  // Default: 100
  maxResults?: number;       // Default: 20
}
```

### SemanticContextProvider

```typescript
interface SemanticContextProvider {
  search(options: SemanticContextOptions): Promise<SemanticContextResult>;
  indexBlocks(blocks: Block[]): Promise<void>;
}

interface SemanticContextOptions {
  query: string;
  strategy?: 'vector' | 'bm25' | 'hybrid';  // Default: 'hybrid'
  vectorWeight?: number;                     // Default: 0.7
  topK?: number;                             // Default: 10
  minScore?: number;                         // Default: 0.5
}
```

### WorkContextProvider

```typescript
interface WorkContextProvider {
  recordEvent(event: CanvasEventInput): void;
  getContext(options?: WorkContextOptions): WorkContextResult;
  subscribe(callback: EventCallback): Unsubscribe;
}

interface WorkContextOptions {
  timeRange?: { from?: Date; to?: Date };
  eventTypes?: CanvasEventType[];
  maxEvents?: number;  // Default: 50
}
```

### ActionContextProvider

```typescript
interface ActionContextProvider {
  registerAction(action: ActionDefinition): void;
  getContext(options?: ActionContextOptions): ActionContextResult;
  executeAction(actionId: string, params: unknown): Promise<ActionResult>;
}

interface ActionContextOptions {
  blockTypes?: string[];
  onlyAvailable?: boolean;  // Default: true
  relevanceQuery?: string;
}
```

## Packages

| Package | Description |
|---------|-------------|
| `@spatial-context/core` | Core SDK with all four context providers |
| `@spatial-context/react-flow` | React Flow adapter with hooks and providers |

## Architecture

```
packages/
├── core/                       # @spatial-context/core
│   ├── focus/                  # Focus Context module
│   ├── semantic/               # Semantic Context module
│   ├── work/                   # Work Context module
│   ├── action/                 # Action Context module
│   ├── composer/               # Context composition
│   ├── llm/                    # LLM prompt/tool generation
│   └── types/                  # Shared types
│
├── react-flow/                 # @spatial-context/react-flow
│   ├── adapters/               # React Flow data adapters
│   ├── hooks/                  # useSpatialContext, etc.
│   └── providers/              # React context providers
│
└── examples/                   # Example applications
```

## Use Cases

### AI Canvas Assistant

```typescript
// Build an AI assistant that understands canvas context
const assistant = new CanvasAssistant({
  spatial: new SpatialContext({ embeddingProvider }),
  llm: new OpenAI(),
});

// User selects a block and asks a question
const response = await assistant.chat({
  selectedBlockId: 'idea-block-1',
  message: "What other ideas are related to this?",
});

// AI uses Focus + Semantic context to find and explain related blocks
```

### Smart Canvas Search

```typescript
// Semantic search across all canvas content
const results = await spatial.semantic.search({
  query: "authentication flow",
  strategy: 'hybrid',
  topK: 10,
});

// Highlight matching blocks on canvas
highlightBlocks(results.relevantBlocks.map(r => r.block.id));
```

### Collaborative Context Sharing

```typescript
// Share work context when collaborators join
const sessionContext = spatial.work.getContext({
  sessionId: currentSession.id,
  maxEvents: 100,
});

// New collaborator instantly understands recent activity
broadcastToNewUser(sessionContext);
```

### LLM Tool Generation

```typescript
// Generate LLM-compatible tools from action context
const tools = spatial.action.getContext({
  blockTypes: ['shape', 'markdown', 'image'],
  onlyAvailable: true,
}).toOpenAITools();

// Use with any LLM that supports function calling
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages,
  tools,
});
```

## Tech Stack

- **TypeScript** — Full type safety
- **Zero runtime dependencies** — Core package has no external deps
- **Pluggable embedding providers** — OpenAI, Voyage AI, local models
- **@xyflow/react** — React Flow integration

## Roadmap

### ✅ Phase 1: Analysis & Documentation
- [x] Core concept definition
- [x] API interface design
- [x] README and documentation

### 🚧 Phase 2: Core Implementation
- [ ] Focus Context module
- [ ] Semantic Context module
- [ ] Work Context module
- [ ] Action Context module
- [ ] Context composition

### 📋 Phase 3: Adapters & Integration
- [ ] React Flow adapter
- [ ] LLM prompt generation
- [ ] MCP (Model Context Protocol) support
- [ ] Example applications

### 🔮 Future Plans
- [ ] Streaming context updates
- [ ] Multi-canvas context
- [ ] Context persistence
- [ ] VS Code extension

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Related Projects

- [React Flow](https://reactflow.dev/) — The canvas framework we integrate with
- [Canvasdown](../canvasdown.md) — Our DSL for AI canvas manipulation
- [OpenAI](https://openai.com/) — LLM integration
- [Voyage AI](https://www.voyageai.com/) — Embedding provider

---

<p align="center">
  Built with ❤️ by the <a href="https://github.com/ssota-labs">SSOTA Labs</a> team
</p>
